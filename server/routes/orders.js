var express = require('express');
var { getDb } = require('../db');
var { authMiddleware } = require('../middleware/auth');

var router = express.Router();

router.get('/', authMiddleware, function (req, res) {
    var db = getDb();
    var orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    db.close();
    res.json(orders);
});

router.post('/', function (req, res) {
    var { items, total, customer_name, customer_phone, notes } = req.body;
    if (!items || total === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    var db = getDb();
    var result = db.prepare('INSERT INTO orders (items, total, customer_name, customer_phone, notes) VALUES (?, ?, ?, ?, ?)').run(JSON.stringify(items), total, customer_name || '', customer_phone || '', notes || '');
    db.close();
    res.status(201).json({ id: result.lastInsertRowid, ok: true });
});

router.put('/:id', authMiddleware, function (req, res) {
    var { status } = req.body;
    var db = getDb();
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    db.close();
    res.json({ ok: true });
});

router.delete('/:id', authMiddleware, function (req, res) {
    var db = getDb();
    db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
    db.close();
    res.json({ ok: true });
});

module.exports = router;
