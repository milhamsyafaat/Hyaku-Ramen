var express = require('express');
var { getDb, validate } = require('../db');
var { authMiddleware } = require('../middleware/auth');

var router = express.Router();

router.get('/', authMiddleware, function (req, res) {
    try {
        var limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);
        var offset = Math.max(parseInt(req.query.offset) || 0, 0);
        var db = getDb();
        var total = db.prepare('SELECT COUNT(*) as c FROM contact_messages').get().c;
        var items = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
        res.json({ data: items, total: total });
    } catch (e) {
        console.error('GET /api/contact error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', authMiddleware, function (req, res) {
    try {
        var db = getDb();
        var item = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(req.params.id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.json(item);
    } catch (e) {
        console.error('GET /api/contact/:id error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', function (req, res) {
    try {
        var { name, phone, subject, message } = req.body;
        var errs = validate({
            name: { required: true, maxLength: 100 },
            phone: { maxLength: 30 },
            subject: { maxLength: 200 },
            message: { required: true, maxLength: 2000 }
        }, req.body);
        if (errs) return res.status(400).json({ error: errs.join('; ') });
        var db = getDb();
        var result = db.prepare('INSERT INTO contact_messages (name, phone, subject, message) VALUES (?, ?, ?, ?)').run(String(name).slice(0, 100), String(phone || '').slice(0, 30), String(subject || '').slice(0, 200), String(message).slice(0, 2000));
        res.status(201).json({ id: result.lastInsertRowid, ok: true });
    } catch (e) {
        console.error('POST /api/contact error:', e);
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
        db.prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run(String(status), req.params.id);
        res.json({ ok: true });
    } catch (e) {
        console.error('PUT /api/contact error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', authMiddleware, function (req, res) {
    try {
        var db = getDb();
        db.prepare('DELETE FROM contact_messages WHERE id = ?').run(req.params.id);
        res.json({ ok: true });
    } catch (e) {
        console.error('DELETE /api/contact error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
