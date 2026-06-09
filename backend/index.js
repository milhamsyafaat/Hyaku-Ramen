var express = require('express');
var cors = require('cors');
var path = require('path');
var helmet = require('helmet');
var rateLimit = require('express-rate-limit');
var db = require('./db');

var app = express();
var PORT = process.env.PORT || 3001;

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));

var isDev = process.env.NODE_ENV !== 'production';

if (!isDev) {
    var limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests, try again later' }, skip: function (req) { return req.path.startsWith('/api/admin'); } });
    app.use('/api/', limiter);

    var authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { error: 'Too many login attempts, try again later' } });
    app.use('/api/auth/login', authLimiter);

    var formLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many submissions, try again later' } });
    app.use('/api/contact', formLimiter);
    app.use('/api/reservations', formLimiter);
    app.use('/api/orders', formLimiter);
}

app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/tables', require('./routes/tables'));
app.use('/api/wa-numbers', require('./routes/wa-numbers'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/config', require('./routes/config'));

if (isDev) {
    var frontendDir = path.join(__dirname, '..', 'frontend');
    var adminDir = path.join(__dirname, '..', 'admin');
    console.log('DEV mode: serving frontend/ and admin/');
    app.use(express.static(frontendDir));
    app.use('/admin', express.static(adminDir));
    app.get('/admin/*', function (req, res) {
        res.sendFile(path.join(adminDir, 'index.html'));
    });
    app.get('*', function (req, res) {
        res.sendFile(path.join(frontendDir, 'index.html'));
    });
} else {
    var frontendDir = path.join(__dirname, '..', 'frontend');
    var adminDir = path.join(__dirname, '..', 'admin');
    app.use(express.static(frontendDir));
    app.use('/admin', express.static(adminDir));
    app.get('/admin/*', function (req, res) {
        res.sendFile(path.join(adminDir, 'index.html'));
    });
    app.get('*', function (req, res) {
        res.sendFile(path.join(frontendDir, 'index.html'));
    });
}

db.initialize();

app.listen(PORT, function () {
    console.log('Hyaku Ramen API server running on http://localhost:' + PORT);
    console.log('Website: http://localhost:' + PORT);
    console.log('Admin: http://localhost:' + PORT + '/admin/');
    console.log('Default login: admin / admin123');

});
