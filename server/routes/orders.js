var express = require('express');
var { getDb, validate } = require('../db');
var { authMiddleware } = require('../middleware/auth');
var midtrans = require('../services/midtrans');
var email = require('../services/email');

var router = express.Router();

router.get('/', authMiddleware, function (req, res) {
    try {
        var limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);
        var offset = Math.max(parseInt(req.query.offset) || 0, 0);
        var db = getDb();
        var total = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
        var orders = db.prepare('SELECT o.*, p.status as payment_status, p.payment_type, p.transaction_id FROM orders o LEFT JOIN payments p ON o.payment_id = p.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
        res.json({ data: orders, total: total });
    } catch (e) {
        console.error('GET /api/orders error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', authMiddleware, function (req, res) {
    try {
        var db = getDb();
        var item = db.prepare('SELECT o.*, p.status as payment_status, p.payment_type, p.transaction_id, p.snap_redirect_url FROM orders o LEFT JOIN payments p ON o.payment_id = p.id WHERE o.id = ?').get(req.params.id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.json(item);
    } catch (e) {
        console.error('GET /api/orders/:id error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', function (req, res) {
    try {
        var { items, total, customer_name, customer_phone, notes, email: customerEmail } = req.body;
        var errs = validate({
            items: { required: true },
            total: { required: true, type: 'number', min: 0 },
            customer_name: { maxLength: 100 },
            customer_phone: { maxLength: 30 },
            notes: { maxLength: 500 },
            email: { maxLength: 200 }
        }, req.body);
        if (errs) return res.status(400).json({ error: errs.join('; ') });
        var db = getDb();
        var result = db.prepare('INSERT INTO orders (items, total, customer_name, customer_phone, notes, email) VALUES (?, ?, ?, ?, ?, ?)').run(JSON.stringify(items), Number(total), String(customer_name || '').slice(0, 100), String(customer_phone || '').slice(0, 30), String(notes || '').slice(0, 500), String(customerEmail || '').slice(0, 200));
        var orderId = result.lastInsertRowid;

        var response = { id: orderId, ok: true };

        if (midtrans.isConfigured()) {
            try {
                var customerDetails = {};
                if (customer_name) customerDetails.first_name = String(customer_name).slice(0, 50);
                if (customerEmail) customerDetails.email = String(customerEmail).slice(0, 100);
                if (customer_phone) customerDetails.phone = String(customer_phone).slice(0, 20);

                var trx = midtrans.createTransaction(orderId, Number(total), customerDetails);
                if (trx) {
                    var snapToken = trx.token;
                    var redirectUrl = trx.redirect_url;
                    db.prepare('INSERT INTO payments (order_id, gross_amount, snap_token, snap_redirect_url) VALUES (?, ?, ?, ?)').run(orderId, Number(total), snapToken, redirectUrl);
                    var paymentId = db.prepare('SELECT last_insert_rowid() as id').get().id;
                    db.prepare('UPDATE orders SET payment_id = ? WHERE id = ?').run(paymentId, orderId);
                    response.snap_token = snapToken;
                    response.snap_redirect_url = redirectUrl;
                }
            } catch (mtErr) {
                console.error('Midtrans error for order ' + orderId + ':', mtErr);
            }
        }

        email.notifyNewOrder({ id: orderId, items: items, total: total, customer_name: customer_name, customer_phone: customer_phone, email: customerEmail }).catch(function (e) {
            console.error('Email notification error for order ' + orderId + ':', e);
        });

        res.status(201).json(response);
    } catch (e) {
        console.error('POST /api/orders error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:id', authMiddleware, function (req, res) {
    try {
        var { status } = req.body;
        var errs = validate({
            status: { required: true, maxLength: 20 }
        }, req.body);
        if (errs) return res.status(400).json({ error: errs.join('; ') });
        var db = getDb();
        db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(String(status), req.params.id);
        res.json({ ok: true });
    } catch (e) {
        console.error('PUT /api/orders error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', authMiddleware, function (req, res) {
    try {
        var db = getDb();
        db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
        res.json({ ok: true });
    } catch (e) {
        console.error('DELETE /api/orders error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
