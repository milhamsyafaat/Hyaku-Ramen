var express = require('express');
var { getDb } = require('../db');
var { authMiddleware } = require('../middleware/auth');

var router = express.Router();

router.get('/', function (req, res) {
    var db = getDb();
    var items = db.prepare('SELECT * FROM menu_items ORDER BY cat, name').all();
    db.close();
    res.json(items);
});

router.post('/', authMiddleware, function (req, res) {
    var { id, cat, name, price, priceNum, badge, badgeClass, desc, img } = req.body;
    if (!id || !cat || !name || !price || priceNum === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    var db = getDb();
    db.prepare('INSERT INTO menu_items (id, cat, name, price, priceNum, badge, badgeClass, desc, img) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, cat, name, price, priceNum, badge || '', badgeClass || '', desc || '', img || '');
    db.close();
    res.status(201).json({ ok: true });
});

router.put('/:id', authMiddleware, function (req, res) {
    var { cat, name, price, priceNum, badge, badgeClass, desc, img } = req.body;
    var db = getDb();
    db.prepare('UPDATE menu_items SET cat=?, name=?, price=?, priceNum=?, badge=?, badgeClass=?, desc=?, img=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(cat, name, price, priceNum, badge || '', badgeClass || '', desc || '', img || '', req.params.id);
    db.close();
    res.json({ ok: true });
});

router.delete('/:id', authMiddleware, function (req, res) {
    var db = getDb();
    db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
    db.close();
    res.json({ ok: true });
});

module.exports = router;
