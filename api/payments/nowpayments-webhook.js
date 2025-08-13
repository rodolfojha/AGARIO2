// api/payments/nowpayments-webhook.js - Webhook para NOWPayments IPN

const crypto = require('crypto');

// Función para verificar la firma del webhook
function verifyWebhookSignature(payload, signature, secretKey) {
    try {
        const expectedSignature = crypto
            .createHmac('sha512', secretKey)
            .update(JSON.stringify(payload))
            .digest('hex');
        
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch (error) {
        console.error('❌ Webhook signature verification error:', error);
        return false;
    }
}

// Función para procesar el webhook
async function processWebhook(payload, signature) {
    try {
        console.log('🔔 NOWPayments webhook received:', {
            payment_id: payload.payment_id,
            payment_status: payload.payment_status,
            pay_address: payload.pay_address,
            price_amount: payload.price_amount,
            price_currency: payload.price_currency,
            pay_amount: payload.pay_amount,
            pay_currency: payload.pay_currency,
            order_id: payload.order_id,
            purchase_id: payload.purchase_id
        });

        // Verificar la firma del webhook (opcional pero recomendado)
        // const isValidSignature = verifyWebhookSignature(payload, signature, process.env.NOWPAYMENTS_IPN_SECRET);
        // if (!isValidSignature) {
        //     console.error('❌ Invalid webhook signature');
        //     return { success: false, error: 'Invalid signature' };
        // }

        // Extraer información del order_id (formato: deposit_userId_timestamp)
        const orderIdParts = payload.order_id.split('_');
        if (orderIdParts.length < 3) {
            console.error('❌ Invalid order_id format:', payload.order_id);
            return { success: false, error: 'Invalid order_id format' };
        }

        const userId = orderIdParts[1];
        const amount = parseFloat(payload.price_amount);

        // Procesar según el estado del pago
        switch (payload.payment_status) {
            case 'finished':
                console.log('✅ Payment finished - Processing balance update');
                // Aquí deberías actualizar el balance del usuario en tu base de datos
                // await updateUserBalance(userId, amount);
                return { success: true, action: 'balance_updated' };

            case 'confirmed':
                console.log('✅ Payment confirmed - Waiting for final confirmation');
                return { success: true, action: 'payment_confirmed' };

            case 'waiting':
                console.log('⏳ Payment waiting - User needs to complete payment');
                return { success: true, action: 'payment_waiting' };

            case 'expired':
                console.log('❌ Payment expired');
                return { success: true, action: 'payment_expired' };

            case 'failed':
                console.log('❌ Payment failed');
                return { success: true, action: 'payment_failed' };

            default:
                console.log('ℹ️ Unknown payment status:', payload.payment_status);
                return { success: true, action: 'unknown_status' };
        }

    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        return { success: false, error: error.message };
    }
}

// Función para actualizar el balance del usuario (implementar según tu base de datos)
async function updateUserBalance(userId, amount) {
    try {
        // Aquí implementarías la lógica para actualizar el balance en tu base de datos
        // Por ejemplo:
        // const user = await getUserById(userId);
        // if (user) {
        //     user.balance_available += amount;
        //     await updateUser(user);
        //     console.log(`✅ Balance updated for user ${userId}: +$${amount}`);
        // }
        
        console.log(`💰 Balance update requested for user ${userId}: +$${amount}`);
        return true;
    } catch (error) {
        console.error('❌ Error updating user balance:', error);
        return false;
    }
}

module.exports = {
    processWebhook,
    verifyWebhookSignature,
    updateUserBalance
};


