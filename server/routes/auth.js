var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var { getDb } = require('../db');
var { authMiddleware, SECRET } = require('../middleware/auth');

var router = express.Router();

router.post('/login', function (req, res) {
    var { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    var db = getDb();
    var user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
    db.close();
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    var token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username });
});

router.get('/me', authMiddleware, function (req, res) {
    res.json({ username: req.admin.username });
});

module.exports = router;
