var express = require('express');
var { getDb, validate, sanitize } = require('../db');
var { authMiddleware } = require('../middleware/auth');

var router = express.Router();

var waSchema = { number: { required: true, maxLength: 20 }, label: { maxLength: 100 }, is_default: { type: 'integer' }, is_tester: { type: 'integer' }, is_active: { type: 'integer' } };

router.get('/', function (req, res) {
    try {
        var db = getDb();
        var items = db.prepare('SELECT * FROM wa_numbers ORDER BY is_default DESC, is_tester ASC, id ASC').all();
        res.json({ data: items });
    } catch (e) {
        console.error('GET /api/wa-numbers error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/active', function (req, res) {
    try {
        var db = getDb();
        var items = db.prepare('SELECT * FROM wa_numbers WHERE is_active = 1 ORDER BY is_default DESC, id ASC').all();
        res.json({ data: items });
    } catch (e) {
        console.error('GET /api/wa-numbers/active error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', authMiddleware, function (req, res) {
    try {
        var errors = validate(waSchema, req.body);
        if (errors) return res.status(400).json({ error: errors.join(', ') });
        var db = getDb();
        var number = req.body.number.replace(/[^0-9]/g, '');
        var existing = db.prepare('SELECT id FROM wa_numbers WHERE number = ?').get(number);
        if (existing) return res.status(400).json({ error: 'Nomor WA sudah ada' });
        if (req.body.is_default) {
            db.prepare('UPDATE wa_numbers SET is_default = 0').run();
        }
        db.prepare('INSERT INTO wa_numbers (number, label, is_default, is_tester, is_active) VALUES (?, ?, ?, ?, ?)').run(number, sanitize(req.body.label || ''), req.body.is_default ? 1 : 0, req.body.is_tester ? 1 : 0, req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : 1);
        res.json({ success: true });
    } catch (e) {
        console.error('POST /api/wa-numbers error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:id', authMiddleware, function (req, res) {
    try {
        var errors = validate(waSchema, req.body);
        if (errors) return res.status(400).json({ error: errors.join(', ') });
        var db = getDb();
        var id = req.params.id;
        var existing = db.prepare('SELECT id FROM wa_numbers WHERE id = ?').get(id);
        if (!existing) return res.status(404).json({ error: 'Not found' });
        var number = req.body.number.replace(/[^0-9]/g, '');
        var dup = db.prepare('SELECT id FROM wa_numbers WHERE number = ? AND id != ?').get(number, id);
        if (dup) return res.status(400).json({ error: 'Nomor WA sudah ada' });
        if (req.body.is_default) {
            db.prepare('UPDATE wa_numbers SET is_default = 0').run();
        }
        db.prepare('UPDATE wa_numbers SET number = ?, label = ?, is_default = ?, is_tester = ?, is_active = ? WHERE id = ?').run(number, sanitize(req.body.label || ''), req.body.is_default ? 1 : 0, req.body.is_tester ? 1 : 0, req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : 1, id);
        res.json({ success: true });
    } catch (e) {
        console.error('PUT /api/wa-numbers error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', authMiddleware, function (req, res) {
    try {
        var db = getDb();
        var id = req.params.id;
        var item = db.prepare('SELECT * FROM wa_numbers WHERE id = ?').get(id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        if (item.is_default) return res.status(400).json({ error: 'Tidak bisa menghapus nomor default' });
        db.prepare('DELETE FROM wa_numbers WHERE id = ?').run(id);
        res.json({ success: true });
    } catch (e) {
        console.error('DELETE /api/wa-numbers error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
