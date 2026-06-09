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
        var params = [];
        if (from) { where += " AND date(o.created_at) >= date(?)"; params.push(from); }
        if (to) { where += " AND date(o.created_at) <= date(?)"; params.push(to); }
        var orderSql = "SELECT o.* FROM orders o " + where + " ORDER BY o.created_at DESC";
        var orderStmt = db.prepare(orderSql);
        var orders = params.length ? orderStmt.all.apply(orderStmt, params) : orderStmt.all();
        var statsSql = "SELECT COUNT(*) as total_orders, SUM(CASE WHEN o.status IN ('confirmed','completed') THEN o.total ELSE 0 END) as total_revenue, SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) as total_completed FROM orders o " + where;
        var statsStmt = db.prepare(statsSql);
        var stats = params.length ? statsStmt.get.apply(statsStmt, params) : statsStmt.get();
        res.json({ orders: orders || [], stats: { totalOrders: stats.total_orders || 0, totalRevenue: stats.total_revenue || 0, totalCompleted: stats.total_completed || 0 } });
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
