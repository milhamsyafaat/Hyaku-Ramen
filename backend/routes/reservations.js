var express = require('express');
var { getDb, validate } = require('../db');
var { authMiddleware } = require('../middleware/auth');
var email = require('../services/email');

var router = express.Router();

router.get('/', authMiddleware, function (req, res) {
    try {
        var limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);
        var offset = Math.max(parseInt(req.query.offset) || 0, 0);
        var db = getDb();
        var total = db.prepare('SELECT COUNT(*) as c FROM reservations').get().c;
        var items = db.prepare('SELECT r.*, t.number as table_number FROM reservations r LEFT JOIN tables t ON r.table_id = t.id ORDER BY r.created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
        res.json({ data: items, total: total });
    } catch (e) {
        console.error('GET /api/reservations error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', authMiddleware, function (req, res) {
    try {
        var db = getDb();
        var item = db.prepare('SELECT r.*, t.number as table_number FROM reservations r LEFT JOIN tables t ON r.table_id = t.id WHERE r.id = ?').get(req.params.id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.json(item);
    } catch (e) {
        console.error('GET /api/reservations/:id error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', function (req, res) {
    try {
        var { name, phone, guests, date, time, notes } = req.body;
        var errs = validate({
            name: { required: true, maxLength: 100 },
            phone: { required: true, maxLength: 30 },
            guests: { required: true, type: 'integer', min: 1, max: 50 },
            date: { required: true, maxLength: 20 },
            time: { required: true, maxLength: 10 },
            notes: { maxLength: 500 }
        }, req.body);
        if (errs) return res.status(400).json({ error: errs.join('; ') });
        var db = getDb();
        var result = db.prepare('INSERT INTO reservations (name, phone, guests, date, time, notes) VALUES (?, ?, ?, ?, ?, ?)').run(String(name).slice(0, 100), String(phone).slice(0, 30), Number(guests), String(date).slice(0, 20), String(time).slice(0, 10), String(notes || '').slice(0, 500));
        var reservationId = result.lastInsertRowid;

        email.notifyNewReservation({ id: reservationId, name: name, phone: phone, guests: guests, date: date, time: time, notes: notes }).catch(function (e) {
            console.error('Email notification error for reservation ' + reservationId + ':', e);
        });

        res.status(201).json({ id: reservationId, ok: true });
    } catch (e) {
        console.error('POST /api/reservations error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:id', authMiddleware, function (req, res) {
    try {
        var { status, table_id } = req.body;
        var errs = validate({
            status: { required: true, maxLength: 20 },
            table_id: { type: 'integer' }
        }, req.body);
        if (errs) return res.status(400).json({ error: errs.join('; ') });
        var db = getDb();
        if (table_id !== undefined) {
            db.prepare('UPDATE reservations SET status = ?, table_id = ? WHERE id = ?').run(String(status), Number(table_id), req.params.id);
        } else {
            db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run(String(status), req.params.id);
        }
        res.json({ ok: true });
    } catch (e) {
        console.error('PUT /api/reservations error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', authMiddleware, function (req, res) {
    try {
        var db = getDb();
        db.prepare('DELETE FROM reservations WHERE id = ?').run(req.params.id);
        res.json({ ok: true });
    } catch (e) {
        console.error('DELETE /api/reservations error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
