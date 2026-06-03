var express = require('express');
var { getDb, validate } = require('../db');
var { authMiddleware } = require('../middleware/auth');

var router = express.Router();

router.get('/', function (req, res) {
    try {
        var db = getDb();
        var items = db.prepare('SELECT * FROM testimonials ORDER BY created_at DESC').all();
        res.json({ data: items, total: items.length });
    } catch (e) {
        console.error('GET /api/testimonials error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', function (req, res) {
    try {
        var db = getDb();
        var item = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(req.params.id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.json(item);
    } catch (e) {
        console.error('GET /api/testimonials/:id error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', authMiddleware, function (req, res) {
    try {
        var { author, initial, avatarClass, role, date, rating, title, text, ownerReply } = req.body;
        var errs = validate({
            author: { required: true, maxLength: 100 },
            rating: { type: 'integer', min: 1, max: 5 },
            title: { maxLength: 200 },
            text: { maxLength: 2000 },
            ownerReply: { maxLength: 2000 }
        }, req.body);
        if (errs) return res.status(400).json({ error: errs.join('; ') });
        var db = getDb();
        var result = db.prepare('INSERT INTO testimonials (author, initial, avatarClass, role, date, rating, title, text, ownerReply) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(String(author).slice(0, 100), String(initial || author[0]).slice(0, 10), String(avatarClass || '').slice(0, 100), String(role || '').slice(0, 100), String(date || '').slice(0, 20), rating !== undefined ? Number(rating) : 5, String(title || '').slice(0, 200), String(text || '').slice(0, 2000), String(ownerReply || '').slice(0, 2000));
        res.status(201).json({ id: result.lastInsertRowid, ok: true });
    } catch (e) {
        console.error('POST /api/testimonials error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:id', authMiddleware, function (req, res) {
    try {
        var { author, initial, avatarClass, role, date, rating, title, text, ownerReply } = req.body;
        var errs = validate({
            author: { required: true, maxLength: 100 },
            rating: { type: 'integer', min: 1, max: 5 }
        }, req.body);
        if (errs) return res.status(400).json({ error: errs.join('; ') });
        var db = getDb();
        db.prepare('UPDATE testimonials SET author=?, initial=?, avatarClass=?, role=?, date=?, rating=?, title=?, text=?, ownerReply=? WHERE id=?').run(String(author).slice(0, 100), String(initial || author[0]).slice(0, 10), String(avatarClass || '').slice(0, 100), String(role || '').slice(0, 100), String(date || '').slice(0, 20), rating !== undefined ? Number(rating) : 5, String(title || '').slice(0, 200), String(text || '').slice(0, 2000), String(ownerReply || '').slice(0, 2000), req.params.id);
        res.json({ ok: true });
    } catch (e) {
        console.error('PUT /api/testimonials error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', authMiddleware, function (req, res) {
    try {
        var db = getDb();
        db.prepare('DELETE FROM testimonials WHERE id = ?').run(req.params.id);
        res.json({ ok: true });
    } catch (e) {
        console.error('DELETE /api/testimonials error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
