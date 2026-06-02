var express = require('express');
var { getDb } = require('../db');
var { authMiddleware } = require('../middleware/auth');

var router = express.Router();

router.get('/', authMiddleware, function (req, res) {
    var db = getDb();
    var items = db.prepare('SELECT * FROM reservations ORDER BY created_at DESC').all();
    db.close();
    res.json(items);
});

router.post('/', function (req, res) {
    var { name, phone, guests, date, time, notes } = req.body;
    if (!name || !phone || !guests || !date || !time) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    var db = getDb();
    var result = db.prepare('INSERT INTO reservations (name, phone, guests, date, time, notes) VALUES (?, ?, ?, ?, ?, ?)').run(name, phone, guests, date, time, notes || '');
    db.close();
    res.status(201).json({ id: result.lastInsertRowid, ok: true });
});

router.put('/:id', authMiddleware, function (req, res) {
    var { status } = req.body;
    var db = getDb();
    db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run(status, req.params.id);
    db.close();
    res.json({ ok: true });
});

router.delete('/:id', authMiddleware, function (req, res) {
    var db = getDb();
    db.prepare('DELETE FROM reservations WHERE id = ?').run(req.params.id);
    db.close();
    res.json({ ok: true });
});

module.exports = router;
