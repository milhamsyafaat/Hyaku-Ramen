var express = require('express');
var { getDb } = require('../db');
var midtrans = require('../services/midtrans');

var router = express.Router();

router.post('/notification', function (req, res) {
    try {
        var body = req.body;
        var result = midtrans.verifyNotification(body);
        if (!result) {
            return res.status(200).json({ ok: true });
        }
        var db = getDb();

        var orderIdStr = String(result.order_id || '');
        var match = orderIdStr.match(/^ORDER-(\d+)-/);
        var localOrderId = match ? parseInt(match[1]) : null;

        if (!localOrderId) {
            console.warn('Payment notification: could not parse order_id:', result.order_id);
            return res.status(200).json({ ok: true });
        }

        var payment = db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1').get(localOrderId);
        if (payment) {
            db.prepare('UPDATE payments SET transaction_id=?, status=?, payment_type=?, transaction_time=? WHERE id=?').run(
                String(result.transaction_id || '').slice(0, 100),
                result.status,
                String(result.payment_type || '').slice(0, 30),
                String(result.transaction_time || '').slice(0, 30),
                payment.id
            );
            if (result.status === 'success') {
                db.prepare("UPDATE orders SET status = 'confirmed' WHERE id = ? AND status = 'pending'").run(localOrderId);
            }
        }

        res.status(200).json({ ok: true });
    } catch (e) {
        console.error('POST /api/payments/notification error:', e);
        res.status(200).json({ ok: true });
    }
});

module.exports = router;
