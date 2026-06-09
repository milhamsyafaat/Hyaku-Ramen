var express = require('express');
var { getDb, resetData } = require('../db');
var { authMiddleware } = require('../middleware/auth');

var router = express.Router();

router.get('/stats', authMiddleware, function (req, res) {
    try {
        var db = getDb();
        var menuCount = db.prepare('SELECT COUNT(*) as c FROM menu_items').get();
        var orderCount = db.prepare('SELECT COUNT(*) as c FROM orders').get();
        var pendingOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'").get();
        var reservationCount = db.prepare('SELECT COUNT(*) as c FROM reservations').get();
        var todayReservations = db.prepare("SELECT COUNT(*) as c FROM reservations WHERE date = date('now','localtime')").get();
        var unreadMessages = db.prepare("SELECT COUNT(*) as c FROM contact_messages WHERE status = 'unread'").get();
        var testimonialCount = db.prepare('SELECT COUNT(*) as c FROM testimonials').get();
        var galleryCount = db.prepare('SELECT COUNT(*) as c FROM gallery').get();
        var tableCount = db.prepare('SELECT COUNT(*) as c FROM tables').get();
        var availableTables = db.prepare("SELECT COUNT(*) as c FROM tables WHERE status = 'available'").get();
        var waNumberCount = db.prepare('SELECT COUNT(*) as c FROM wa_numbers').get();
        res.json({
            menuCount: menuCount.c,
            orderCount: orderCount.c,
            pendingOrders: pendingOrders.c,
            reservationCount: reservationCount.c,
            todayReservations: todayReservations.c,
            unreadMessages: unreadMessages.c,
            testimonialCount: testimonialCount.c,
            galleryCount: galleryCount.c,
            tableCount: tableCount.c,
            availableTables: availableTables.c,
            waNumberCount: waNumberCount.c
        });
    } catch (e) {
        console.error('GET /api/admin/stats error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/sales-recap', authMiddleware, function (req, res) {
    try {
        var db = getDb();
        var from = req.query.from || '';
        var to = req.query.to || '';
        var where = "WHERE o.status IS NOT NULL";
        if (from) where += " AND date(o.created_at) >= date(?)";
        if (to) where += " AND date(o.created_at) <= date(?)";
        var params = [];
        if (from) params.push(from);
        if (to) params.push(to);
        var sql = "SELECT date(o.created_at) as date, COUNT(*) as order_count, SUM(o.total) as revenue, SUM(CASE WHEN o.status = 'pending' THEN 1 ELSE 0 END) as pending, SUM(CASE WHEN o.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed, SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) as completed, SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled FROM orders o " + where + " GROUP BY date(o.created_at) ORDER BY date(o.created_at) DESC";
        var stmt = db.prepare(sql);
        var rows = stmt.all.apply(stmt, params);
        res.json({ data: rows || [] });
    } catch (e) {
        console.error('GET /api/admin/sales-recap error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/reset', authMiddleware, function (req, res) {
    try {
        resetData();
        res.json({ ok: true });
    } catch (e) {
        console.error('POST /api/admin/reset error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
