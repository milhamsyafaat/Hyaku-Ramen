var crypto = require('crypto');
var midtransClient = require('midtrans-client');

var SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
var CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || '';
var IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';

var snap = null;
if (SERVER_KEY) {
    snap = new midtransClient.Snap({
        isProduction: IS_PRODUCTION,
        serverKey: SERVER_KEY,
        clientKey: CLIENT_KEY
    });
}

function isConfigured() {
    return snap !== null;
}

function createTransaction(orderId, grossAmount, customerDetails) {
    if (!snap) return null;
    var parameter = {
        transaction_details: {
            order_id: 'ORDER-' + orderId + '-' + Date.now(),
            gross_amount: grossAmount
        },
        credit_card: { secure: true }
    };
    if (customerDetails) {
        parameter.customer_details = customerDetails;
    }
    return snap.createTransaction(parameter);
}

function verifyNotification(body) {
    if (!SERVER_KEY) return null;

    var computed = crypto.createHash('sha512').update(body.order_id + body.status_code + body.gross_amount + SERVER_KEY).digest('hex');
    if (body.signature_key !== computed) {
        console.warn('Payment notification: invalid signature');
        return null;
    }

    var transactionStatus = body.transaction_status;
    var fraudStatus = body.fraud_status;

    var status = 'pending';
    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
        if (fraudStatus === 'accept' || fraudStatus === null || fraudStatus === undefined) {
            status = 'success';
        } else if (fraudStatus === 'deny' || fraudStatus === 'challenge') {
            status = 'denied';
        }
    } else if (transactionStatus === 'pending') {
        status = 'pending';
    } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
        status = 'failed';
    } else if (transactionStatus === 'refund' || transactionStatus === 'partial_refund') {
        status = 'refund';
    }

    return {
        transaction_id: body.transaction_id,
        order_id: body.order_id,
        status: status,
        payment_type: body.payment_type,
        transaction_time: body.transaction_time,
        gross_amount: body.gross_amount
    };
}

module.exports = { isConfigured, createTransaction, verifyNotification, CLIENT_KEY };
