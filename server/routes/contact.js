var express = require('express');
var { getDb } = require('../db');
var { authMiddleware } = require('../middleware/auth');

var router = express.Router();

router.get('/', authMiddleware, function (req, res) {
    var db = getDb();
    var items = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
    db.close();
    res.json(items);
});

router.post('/', function (req, res) {
    var { name, phone, subject, message } = req.body;
    if (!name || !message) {
        return res.status(400).json({ error: 'Name and message required' });
    }
    var db = getDb();
    var result = db.prepare('INSERT INTO contact_messages (name, phone, subject, message) VALUES (?, ?, ?, ?)').run(name, phone || '', subject || '', message);
    db.close();
    res.status(201).json({ id: result.lastInsertRowid, ok: true });
});

router.put('/:id', authMiddleware, function (req, res) {
    var { status } = req.body;
    var db = getDb();
    db.prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run(status, req.params.id);
    db.close();
    res.json({ ok: true });
});

router.delete('/:id', authMiddleware, function (req, res) {
    var db = getDb();
    db.prepare('DELETE FROM contact_messages WHERE id = ?').run(req.params.id);
    db.close();
    res.json({ ok: true });
});

module.exports = router;
