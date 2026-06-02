var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var { getDb, validate } = require('../db');
var { authMiddleware, SECRET } = require('../middleware/auth');

var router = express.Router();

router.post('/login', function (req, res) {
    try {
        var { username, password } = req.body;
        var errs = validate({
            username: { required: true, maxLength: 50 },
            password: { required: true, maxLength: 100 }
        }, req.body);
        if (errs) return res.status(400).json({ error: errs.join('; ') });
        var db = getDb();
        var user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(String(username).slice(0, 50));
        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        var token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '24h' });
        res.json({ token, username: user.username });
    } catch (e) {
        console.error('POST /api/auth/login error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/me', authMiddleware, function (req, res) {
    res.json({ username: req.admin.username });
});

module.exports = router;
