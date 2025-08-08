// api/payments/nowpayments.js - Integración con NOWPayments API

import { getDatabase } from '../lib/database.js';

// Configuración de NOWPayments
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || 'your-api-key-here';
const HAS_API_KEY = !!NOWPAYMENTS_API_KEY && NOWPAYMENTS_API_KEY !== 'your-api-key-here';
const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';
const NOWPAYMENTS_SANDBOX_URL = 'https://api-sandbox.nowpayments.io/v1';

// Usar sandbox en desarrollo
const API_BASE_URL = process.env.NODE_ENV === 'production' ? NOWPAYMENTS_API_URL : NOWPAYMENTS_SANDBOX_URL;

export default async function handler(req, res) {
    console.log('💳 NOWPayments API called:', req.method, req.url);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const db = getDatabase();
    
    try {
        if (req.method === 'GET') {
            // Obtener monedas disponibles
            return await getAvailableCurrencies(req, res);
        } else if (req.method === 'POST') {
            const { action } = req.body;
            
            switch (action) {
                case 'create_payment':
                    return await createPayment(req, res, db);
                case 'check_payment':
                    return await checkPaymentStatus(req, res, db);
                default:
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Invalid action' 
                    });
            }
        }
        
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
        
    } catch (error) {
        console.error('❌ NOWPayments error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
}

// Obtener monedas disponibles
async function getAvailableCurrencies(req, res) {
    try {
        if (!HAS_API_KEY) {
            // Fallback sin API key
            return res.json({
                success: true,
                currencies: ['usdt','usdc','btc','eth','sol','trx','ltc']
            });
        }

        const response = await fetch(`${API_BASE_URL}/currencies`, {
            method: 'GET',
            headers: {
                'x-api-key': NOWPAYMENTS_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'NOWPayments currencies error');

        // Filtrar solo las monedas más populares
        const popularCurrencies = [
            'btc', 'eth', 'usdt', 'usdc', 'bnb', 'ada', 'dot', 'sol', 'matic', 'avax',
            'ltc', 'doge', 'trx', 'xrp', 'link', 'uni', 'atom', 'xlm', 'vet', 'fil'
        ];
        const filtered = Array.isArray(data.currencies)
            ? data.currencies.filter(c => popularCurrencies.includes(String(c).toLowerCase()))
            : popularCurrencies;

        return res.json({ success: true, currencies: filtered });
    } catch (error) {
        console.error('❌ Error fetching currencies:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch currencies'
        });
    }
}

// Crear nuevo pago
async function createPayment(req, res, db) {
    try {
        const { amount, currency, userId } = req.body;
        
        if (!amount || !currency || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: amount, currency, userId'
            });
        }
        
        // Validar usuario
        const user = await db.getUserById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        // Si no hay API key, crear un pago simulado (DEV)
        if (!HAS_API_KEY) {
            const mockId = `devpay-${Date.now()}`;
            const payment = {
                id: mockId,
                userId,
                amount: parseFloat(amount),
                currency: currency.toLowerCase(),
                status: 'waiting',
                nowpayments_id: mockId,
                payment_url: '#',
                pay_amount: (parseFloat(amount) / 1000).toFixed(6), // simulado
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
            };
            await db.createPayment(payment);
            return res.json({
                success: true,
                payment: {
                    id: payment.id,
                    amount: payment.amount,
                    currency: payment.currency,
                    pay_amount: payment.pay_amount,
                    pay_address: 'TEST-ADDRESS-ONLY-DEV',
                    payment_url: '#',
                    qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DEV_${payment.id}`,
                    expires_at: payment.expires_at,
                    status: payment.status
                }
            });
        }

        // Crear pago en NOWPayments (LIVE/SANDBOX)
        const paymentData = {
            price_amount: parseFloat(amount),
            price_currency: 'USD',
            pay_currency: currency.toLowerCase(),
            order_id: `deposit_${userId}_${Date.now()}`,
            order_description: `AGARIO2 Balance Deposit - $${amount}`,
            ipn_callback_url: `${process.env.BASE_URL || 'http://localhost:3000'}/api/payments/nowpayments-webhook`,
            success_url: `${process.env.BASE_URL || 'http://localhost:3000'}?payment=success`,
            cancel_url: `${process.env.BASE_URL || 'http://localhost:3000'}?payment=cancelled`
        };

        const response = await fetch(`${API_BASE_URL}/payment`, {
            method: 'POST',
            headers: {
                'x-api-key': NOWPAYMENTS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });
        const paymentResult = await response.json();
        if (!response.ok) throw new Error(paymentResult.message || 'NOWPayments payment error');

        const payment = {
            id: paymentResult.payment_id,
            userId: userId,
            amount: parseFloat(amount),
            currency: currency.toLowerCase(),
            status: 'waiting',
            nowpayments_id: paymentResult.payment_id,
            payment_url: paymentResult.invoice_url || paymentResult.pay_address,
            pay_amount: paymentResult.pay_amount,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        await db.createPayment(payment);
        return res.json({
            success: true,
            payment: {
                id: payment.id,
                amount: payment.amount,
                currency: payment.currency,
                pay_amount: paymentResult.pay_amount,
                pay_address: paymentResult.pay_address,
                payment_url: paymentResult.invoice_url || payment.payment_url,
                qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${paymentResult.pay_address}`,
                expires_at: payment.expires_at,
                status: payment.status
            }
        });
    } catch (error) {
        console.error('❌ Error creating payment:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to create payment'
        });
    }
}

// Verificar estado del pago
async function checkPaymentStatus(req, res, db) {
    try {
        const { paymentId } = req.body;
        
        if (!paymentId) {
            return res.status(400).json({
                success: false,
                error: 'Payment ID required'
            });
        }
        
        // Obtener pago de la base de datos
        const payment = await db.getPaymentById(paymentId);
        if (!payment) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }
        
        // DEV fallback sin API key: marcar como finished y acreditar
        if (!HAS_API_KEY) {
            await db.updatePaymentStatus(paymentId, 'finished');
            await db.addUserBalance(payment.userId, payment.amount);
            return res.json({
                success: true,
                payment: { id: paymentId, status: 'finished', amount: payment.amount, currency: payment.currency }
            });
        }

        // Verificar estado en NOWPayments (LIVE/SANDBOX)
        const response = await fetch(`${API_BASE_URL}/payment/${payment.nowpayments_id}`, {
            method: 'GET',
            headers: {
                'x-api-key': NOWPAYMENTS_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        const paymentStatus = await response.json();
        if (!response.ok) throw new Error(paymentStatus.message || 'NOWPayments status error');

        if (paymentStatus.payment_status !== payment.status) {
            await db.updatePaymentStatus(paymentId, paymentStatus.payment_status);
            if (paymentStatus.payment_status === 'finished') {
                await db.addUserBalance(payment.userId, payment.amount);
                console.log(`✅ Payment ${paymentId} confirmed - Added $${payment.amount} to user ${payment.userId}`);
            }
        }
        return res.json({
            success: true,
            payment: { id: paymentId, status: paymentStatus.payment_status, amount: payment.amount, currency: payment.currency }
        });
    } catch (error) {
        console.error('❌ Error checking payment status:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to check payment status'
        });
    }
}
