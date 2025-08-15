// api/payments/nowpayments.js - Integración con NOWPayments.io

const NOWPAYMENTS_API_KEY = '9Y86N0F-CB34G0D-KMB5ZAZ-JZR9J46';
const NOWPAYMENTS_BASE_URL = 'https://api.nowpayments.io/v1';

// Función para crear un pago
async function createPayment(amount, currency, orderId) {
    try {
        const response = await fetch(`${NOWPAYMENTS_BASE_URL}/payment`, {
            method: 'POST',
            headers: {
                'x-api-key': NOWPAYMENTS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                price_amount: amount,
                price_currency: currency,
                pay_currency: currency,
                order_id: orderId,
                order_description: `Balance top-up for ${orderId}`,
                ipn_callback_url: 'https://back.pruebatupanel.com/api/payments/nowpayments-webhook'
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to create payment');
        }

        return {
            success: true,
            payment: {
                id: data.payment_id,
                pay_address: data.pay_address,
                pay_amount: data.pay_amount,
                pay_currency: data.pay_currency,
                price_amount: data.price_amount,
                price_currency: data.price_currency,
                order_id: data.order_id,
                order_description: data.order_description,
                ipn_callback_url: data.ipn_callback_url,
                created_at: data.created_at,
                updated_at: data.updated_at,
                purchase_id: data.purchase_id,
                payment_status: data.payment_status,
                payin_extra_id: data.payin_extra_id,
                qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${data.pay_address}`
            }
        };
    } catch (error) {
        console.error('❌ NOWPayments create payment error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Función para verificar el estado de un pago
async function checkPaymentStatus(paymentId) {
    try {
        const response = await fetch(`${NOWPAYMENTS_BASE_URL}/payment/${paymentId}`, {
            method: 'GET',
            headers: {
                'x-api-key': NOWPAYMENTS_API_KEY
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to check payment status');
        }

        return {
            success: true,
            payment: {
                id: data.payment_id,
                payment_status: data.payment_status,
                pay_address: data.pay_address,
                pay_amount: data.pay_amount,
                pay_currency: data.pay_currency,
                price_amount: data.price_amount,
                price_currency: data.price_currency,
                order_id: data.order_id,
                order_description: data.order_description,
                ipn_callback_url: data.ipn_callback_url,
                created_at: data.created_at,
                updated_at: data.updated_at,
                purchase_id: data.purchase_id,
                payin_extra_id: data.payin_extra_id,
                actually_paid: data.actually_paid,
                actually_paid_at: data.actually_paid_at,
                can_redirect: data.can_redirect,
                redirect_url: data.redirect_url
            }
        };
    } catch (error) {
        console.error('❌ NOWPayments check payment error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Función para obtener la lista de monedas disponibles
async function getAvailableCurrencies() {
    try {
        const response = await fetch(`${NOWPAYMENTS_BASE_URL}/currencies`, {
            method: 'GET',
            headers: {
                'x-api-key': NOWPAYMENTS_API_KEY
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to get currencies');
        }

        return {
            success: true,
            currencies: data.currencies
        };
    } catch (error) {
        console.error('❌ NOWPayments get currencies error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Función para obtener el mínimo de pago para una moneda
async function getMinimumPaymentAmount(currency) {
    try {
        const response = await fetch(`${NOWPAYMENTS_BASE_URL}/min-amount/${currency}`, {
            method: 'GET',
            headers: {
                'x-api-key': NOWPAYMENTS_API_KEY
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to get minimum amount');
        }

        return {
            success: true,
            min_amount: data.min_amount
        };
    } catch (error) {
        console.error('❌ NOWPayments get minimum amount error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Función para obtener el máximo de pago para una moneda
async function getMaximumPaymentAmount(currency) {
    try {
        const response = await fetch(`${NOWPAYMENTS_BASE_URL}/max-amount/${currency}`, {
            method: 'GET',
            headers: {
                'x-api-key': NOWPAYMENTS_API_KEY
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to get maximum amount');
        }

        return {
            success: true,
            max_amount: data.max_amount
        };
    } catch (error) {
        console.error('❌ NOWPayments get maximum amount error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Función para estimar el precio de conversión
async function estimatePrice(amount, fromCurrency, toCurrency) {
    try {
        const response = await fetch(`${NOWPAYMENTS_BASE_URL}/estimate?amount=${amount}&currency_from=${fromCurrency}&currency_to=${toCurrency}`, {
            method: 'GET',
            headers: {
                'x-api-key': NOWPAYMENTS_API_KEY
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to estimate price');
        }

        return {
            success: true,
            estimate: {
                currency_from: data.currency_from,
                currency_to: data.currency_to,
                amount_from: data.amount_from,
                amount_to: data.amount_to,
                estimated_amount: data.estimated_amount
            }
        };
    } catch (error) {
        console.error('❌ NOWPayments estimate price error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    createPayment,
    checkPaymentStatus,
    getAvailableCurrencies,
    getMinimumPaymentAmount,
    getMaximumPaymentAmount,
    estimatePrice
};
