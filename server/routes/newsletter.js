var express = require('express');
var { getDb, validate } = require('../db');
var { authMiddleware } = require('../middleware/auth');

var router = express.Router();

router.post('/', function (req, res) {
    try {
        var { email } = req.body;
        var errs = validate({
            email: { required: true, maxLength: 200, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
        }, req.body);
        if (errs) return res.status(400).json({ error: errs.join('; ') });
        var db = getDb();
        db.prepare('INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)').run(String(email).slice(0, 200).trim().toLowerCase());
        res.status(201).json({ ok: true });
    } catch (e) {
        console.error('POST /api/newsletter error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/', authMiddleware, function (req, res) {
    try {
        var limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);
        var offset = Math.max(parseInt(req.query.offset) || 0, 0);
        var db = getDb();
        var total = db.prepare('SELECT COUNT(*) as c FROM newsletter_subscribers').get().c;
        var items = db.prepare('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
        res.json({ data: items, total: total });
    } catch (e) {
        console.error('GET /api/newsletter error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
