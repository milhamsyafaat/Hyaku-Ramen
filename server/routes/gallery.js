var express = require('express');
var { getDb } = require('../db');
var { authMiddleware } = require('../middleware/auth');

var router = express.Router();

router.get('/', function (req, res) {
    var db = getDb();
    var items = db.prepare('SELECT * FROM gallery ORDER BY sort_order ASC').all();
    db.close();
    res.json(items);
});

router.post('/', authMiddleware, function (req, res) {
    var { src, alt, sort_order } = req.body;
    if (!src) return res.status(400).json({ error: 'Image src required' });
    var db = getDb();
    var result = db.prepare('INSERT INTO gallery (src, alt, sort_order) VALUES (?, ?, ?)').run(src, alt || '', sort_order || 0);
    db.close();
    res.status(201).json({ id: result.lastInsertRowid, ok: true });
});

router.put('/:id', authMiddleware, function (req, res) {
    var { src, alt, sort_order } = req.body;
    var db = getDb();
    db.prepare('UPDATE gallery SET src=?, alt=?, sort_order=? WHERE id=?').run(src, alt || '', sort_order || 0, req.params.id);
    db.close();
    res.json({ ok: true });
});

router.delete('/:id', authMiddleware, function (req, res) {
    var db = getDb();
    db.prepare('DELETE FROM gallery WHERE id = ?').run(req.params.id);
    db.close();
    res.json({ ok: true });
});

module.exports = router;
