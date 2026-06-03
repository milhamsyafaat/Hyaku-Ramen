var express = require('express');
var { getDb, validate } = require('../db');
var { authMiddleware } = require('../middleware/auth');

var router = express.Router();

router.get('/', function (req, res) {
    try {
        var db = getDb();
        var items = db.prepare('SELECT * FROM menu_items ORDER BY cat, name').all();
        res.json({ data: items, total: items.length });
    } catch (e) {
        console.error('GET /api/menu error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', function (req, res) {
    try {
        var db = getDb();
        var item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.json(item);
    } catch (e) {
        console.error('GET /api/menu/:id error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', authMiddleware, function (req, res) {
    try {
        var { id, cat, name, price, priceNum, badge, badgeClass, desc, img } = req.body;
        var errs = validate({
            id: { required: true, maxLength: 20 },
            cat: { required: true, maxLength: 20 },
            name: { required: true, maxLength: 100 },
            price: { required: true, maxLength: 20 },
            priceNum: { required: true, type: 'number', min: 0 }
        }, req.body);
        if (errs) return res.status(400).json({ error: errs.join('; ') });
        var db = getDb();
        db.prepare('INSERT INTO menu_items (id, cat, name, price, priceNum, badge, badgeClass, desc, img) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(String(id).slice(0, 20), String(cat).slice(0, 20), String(name).slice(0, 100), String(price).slice(0, 20), Number(priceNum), String(badge || '').slice(0, 50), String(badgeClass || '').slice(0, 50), String(desc || '').slice(0, 500), String(img || '').slice(0, 500));
        res.status(201).json({ ok: true });
    } catch (e) {
        console.error('POST /api/menu error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:id', authMiddleware, function (req, res) {
    try {
        var { cat, name, price, priceNum, badge, badgeClass, desc, img } = req.body;
        var errs = validate({
            cat: { required: true, maxLength: 20 },
            name: { required: true, maxLength: 100 },
            price: { required: true, maxLength: 20 },
            priceNum: { required: true, type: 'number', min: 0 }
        }, req.body);
        if (errs) return res.status(400).json({ error: errs.join('; ') });
        var db = getDb();
        db.prepare('UPDATE menu_items SET cat=?, name=?, price=?, priceNum=?, badge=?, badgeClass=?, desc=?, img=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(String(cat).slice(0, 20), String(name).slice(0, 100), String(price).slice(0, 20), Number(priceNum), String(badge || '').slice(0, 50), String(badgeClass || '').slice(0, 50), String(desc || '').slice(0, 500), String(img || '').slice(0, 500), req.params.id);
        res.json({ ok: true });
    } catch (e) {
        console.error('PUT /api/menu error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', authMiddleware, function (req, res) {
    try {
        var db = getDb();
        db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
        res.json({ ok: true });
    } catch (e) {
        console.error('DELETE /api/menu error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
