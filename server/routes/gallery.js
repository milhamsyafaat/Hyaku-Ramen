var express = require('express');
var { getDb, validate } = require('../db');
var { authMiddleware } = require('../middleware/auth');

var router = express.Router();

router.get('/', function (req, res) {
    try {
        var db = getDb();
        var items = db.prepare('SELECT * FROM gallery ORDER BY sort_order ASC').all();
        res.json({ data: items, total: items.length });
    } catch (e) {
        console.error('GET /api/gallery error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', function (req, res) {
    try {
        var db = getDb();
        var item = db.prepare('SELECT * FROM gallery WHERE id = ?').get(req.params.id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.json(item);
    } catch (e) {
        console.error('GET /api/gallery/:id error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', authMiddleware, function (req, res) {
    try {
        var { src, alt, sort_order } = req.body;
        var errs = validate({
            src: { required: true, maxLength: 500 },
            alt: { maxLength: 200 },
            sort_order: { type: 'integer', min: 0 }
        }, req.body);
        if (errs) return res.status(400).json({ error: errs.join('; ') });
        var db = getDb();
        var result = db.prepare('INSERT INTO gallery (src, alt, sort_order) VALUES (?, ?, ?)').run(String(src).slice(0, 500), String(alt || '').slice(0, 200), sort_order !== undefined ? Number(sort_order) : 0);
        res.status(201).json({ id: result.lastInsertRowid, ok: true });
    } catch (e) {
        console.error('POST /api/gallery error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:id', authMiddleware, function (req, res) {
    try {
        var { src, alt, sort_order } = req.body;
        var errs = validate({
            src: { required: true, maxLength: 500 },
            alt: { maxLength: 200 },
            sort_order: { type: 'integer', min: 0 }
        }, req.body);
        if (errs) return res.status(400).json({ error: errs.join('; ') });
        var db = getDb();
        db.prepare('UPDATE gallery SET src=?, alt=?, sort_order=? WHERE id=?').run(String(src).slice(0, 500), String(alt || '').slice(0, 200), sort_order !== undefined ? Number(sort_order) : 0, req.params.id);
        res.json({ ok: true });
    } catch (e) {
        console.error('PUT /api/gallery error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', authMiddleware, function (req, res) {
    try {
        var db = getDb();
        db.prepare('DELETE FROM gallery WHERE id = ?').run(req.params.id);
        res.json({ ok: true });
    } catch (e) {
        console.error('DELETE /api/gallery error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
