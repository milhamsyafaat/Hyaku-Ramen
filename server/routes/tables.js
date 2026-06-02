var express = require('express');
var { getDb, validate } = require('../db');
var { authMiddleware } = require('../middleware/auth');

var router = express.Router();

router.get('/', function (req, res) {
    try {
        var db = getDb();
        var items = db.prepare('SELECT * FROM tables ORDER BY number').all();
        res.json({ data: items, total: items.length });
    } catch (e) {
        console.error('GET /api/tables error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/available', function (req, res) {
    try {
        var { date, time } = req.query;
        var db = getDb();
        var items;
        if (date && time) {
            items = db.prepare("SELECT t.* FROM tables t WHERE t.status = 'available' AND t.id NOT IN (SELECT table_id FROM reservations WHERE date = ? AND time = ? AND status IN ('pending', 'confirmed'))").all(date, time);
        } else {
            items = db.prepare("SELECT * FROM tables WHERE status = 'available' ORDER BY number").all();
        }
        res.json({ data: items, total: items.length });
    } catch (e) {
        console.error('GET /api/tables/available error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', authMiddleware, function (req, res) {
    try {
        var { number, capacity, location } = req.body;
        var errs = validate({
            number: { required: true, maxLength: 50 },
            capacity: { required: true, type: 'integer', min: 1, max: 50 },
            location: { maxLength: 100 }
        }, req.body);
        if (errs) return res.status(400).json({ error: errs.join('; ') });
        var db = getDb();
        var result = db.prepare('INSERT INTO tables (number, capacity, location) VALUES (?, ?, ?)').run(String(number).slice(0, 50), Number(capacity), String(location || '').slice(0, 100));
        res.status(201).json({ id: result.lastInsertRowid, ok: true });
    } catch (e) {
        if (e.message && e.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'Nomor meja sudah ada' });
        }
        console.error('POST /api/tables error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:id', authMiddleware, function (req, res) {
    try {
        var { number, capacity, location, status } = req.body;
        var errs = validate({
            number: { required: true, maxLength: 50 },
            capacity: { required: true, type: 'integer', min: 1, max: 50 },
            location: { maxLength: 100 },
            status: { maxLength: 20 }
        }, req.body);
        if (errs) return res.status(400).json({ error: errs.join('; ') });
        var db = getDb();
        db.prepare('UPDATE tables SET number=?, capacity=?, location=?, status=? WHERE id=?').run(String(number).slice(0, 50), Number(capacity), String(location || '').slice(0, 100), String(status || 'available').slice(0, 20), req.params.id);
        res.json({ ok: true });
    } catch (e) {
        console.error('PUT /api/tables error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', authMiddleware, function (req, res) {
    try {
        var db = getDb();
        db.prepare('DELETE FROM tables WHERE id = ?').run(req.params.id);
        res.json({ ok: true });
    } catch (e) {
        console.error('DELETE /api/tables error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
