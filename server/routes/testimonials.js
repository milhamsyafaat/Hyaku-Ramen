var express = require('express');
var { getDb } = require('../db');
var { authMiddleware } = require('../middleware/auth');

var router = express.Router();

router.get('/', function (req, res) {
    var db = getDb();
    var items = db.prepare('SELECT * FROM testimonials ORDER BY created_at DESC').all();
    db.close();
    res.json(items);
});

router.post('/', authMiddleware, function (req, res) {
    var { author, initial, avatarClass, role, date, rating, title, text, ownerReply } = req.body;
    if (!author) return res.status(400).json({ error: 'Author required' });
    var db = getDb();
    var result = db.prepare('INSERT INTO testimonials (author, initial, avatarClass, role, date, rating, title, text, ownerReply) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(author, initial || author[0], avatarClass || '', role || '', date || '', rating || 5, title || '', text || '', ownerReply || '');
    db.close();
    res.status(201).json({ id: result.lastInsertRowid, ok: true });
});

router.put('/:id', authMiddleware, function (req, res) {
    var { author, initial, avatarClass, role, date, rating, title, text, ownerReply } = req.body;
    var db = getDb();
    db.prepare('UPDATE testimonials SET author=?, initial=?, avatarClass=?, role=?, date=?, rating=?, title=?, text=?, ownerReply=? WHERE id=?').run(author, initial || author[0], avatarClass || '', role || '', date || '', rating || 5, title || '', text || '', ownerReply || '', req.params.id);
    db.close();
    res.json({ ok: true });
});

router.delete('/:id', authMiddleware, function (req, res) {
    var db = getDb();
    db.prepare('DELETE FROM testimonials WHERE id = ?').run(req.params.id);
    db.close();
    res.json({ ok: true });
});

module.exports = router;
