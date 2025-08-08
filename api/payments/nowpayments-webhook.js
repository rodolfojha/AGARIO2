// api/payments/nowpayments-webhook.js - Webhook para NOWPayments (IPN)
// Nota: Simplificado sin verificación HMAC. Añadir firma según documentación de NOWPayments en producción.

import { getDatabase } from '../lib/database.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const db = getDatabase();
    const payload = req.body || {};
    console.log('📥 NOWPayments Webhook received:', payload);

    const paymentId = String(payload.payment_id || payload.invoice_id || payload.id || '');
    const paymentStatus = String(payload.payment_status || payload.status || '').toLowerCase();
    const orderId = String(payload.order_id || ''); // esperado formato: deposit_<userId>_<timestamp>
    const payAmount = parseFloat(payload.pay_amount || payload.price_amount || 0);
    const payCurrency = String(payload.pay_currency || '').toLowerCase();

    if (!paymentId || !orderId) {
      return res.status(400).json({ success: false, error: 'Missing payment_id or order_id' });
    }

    // Extraer userId de order_id
    let userId = null;
    if (orderId.startsWith('deposit_')) {
      const parts = orderId.split('_');
      userId = parts[1];
    }

    // Actualizar estado del pago
    await db.updatePaymentStatus(paymentId, paymentStatus);

    // Acreditar saldo cuando finaliza
    if (paymentStatus === 'finished' && userId) {
      // En este flujo, el monto en USD lo definimos al crear el pago y lo guardamos en DB
      const payment = await db.getPaymentById(paymentId);
      const creditAmount = payment ? payment.amount : payAmount; // fallback
      await db.addUserBalance(userId, creditAmount);
      await db.createTransaction(userId, 'deposit', creditAmount, {
        provider: 'nowpayments',
        payment_id: paymentId,
        currency: payCurrency,
      });
      console.log(`✅ Deposit credited: $${creditAmount} to ${userId}`);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('❌ NOWPayments webhook error:', err);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
}


