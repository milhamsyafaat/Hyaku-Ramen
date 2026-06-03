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

var limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests, try again later' } });
app.use('/api/', limiter);

var authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { error: 'Too many login attempts, try again later' } });
app.use('/api/auth/login', authLimiter);

var formLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many submissions, try again later' } });
app.use('/api/contact', formLimiter);
app.use('/api/reservations', formLimiter);
app.use('/api/orders', formLimiter);

app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/tables', require('./routes/tables'));
app.use('/api/payments', require('./routes/payments'));

if (isDev) {
    var rootDir = path.join(__dirname, '..');
    console.log('DEV mode: serving static files');
    app.use(express.static(rootDir));
    app.use('/admin', express.static(path.join(rootDir, 'admin')));
    app.get('/admin/*', function (req, res) {
        res.sendFile(path.join(rootDir, 'admin', 'index.html'));
    });
    app.get('*', function (req, res) {
        res.sendFile(path.join(rootDir, 'frontend', 'index.html'));
    });
} else {
    app.all('*', function (req, res) {
        res.status(404).json({ error: 'API endpoint not found' });
    });
}

db.initialize();

app.listen(PORT, function () {
    console.log('Hyaku Ramen API server running on http://localhost:' + PORT);
    if (isDev) {
        console.log('Website: http://localhost:' + PORT);
        console.log('Admin: http://localhost:' + PORT + '/admin/');
        console.log('Default login: admin / HyakuAdmin123!');
    }
});
