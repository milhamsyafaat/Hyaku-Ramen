var express = require('express');
var { getDb } = require('../db');
var { authMiddleware } = require('../middleware/auth');

var router = express.Router();

router.get('/stats', authMiddleware, function (req, res) {
    var db = getDb();
    var menuCount = db.prepare('SELECT COUNT(*) as c FROM menu_items').get();
    var orderCount = db.prepare('SELECT COUNT(*) as c FROM orders').get();
    var pendingOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'").get();
    var reservationCount = db.prepare('SELECT COUNT(*) as c FROM reservations').get();
    var todayReservations = db.prepare("SELECT COUNT(*) as c FROM reservations WHERE date = date('now','localtime')").get();
    var unreadMessages = db.prepare("SELECT COUNT(*) as c FROM contact_messages WHERE status = 'unread'").get();
    var testimonialCount = db.prepare('SELECT COUNT(*) as c FROM testimonials').get();
    var galleryCount = db.prepare('SELECT COUNT(*) as c FROM gallery').get();
    db.close();
    res.json({
        menuCount: menuCount.c,
        orderCount: orderCount.c,
        pendingOrders: pendingOrders.c,
        reservationCount: reservationCount.c,
        todayReservations: todayReservations.c,
        unreadMessages: unreadMessages.c,
        testimonialCount: testimonialCount.c,
        galleryCount: galleryCount.c
    });
});

module.exports = router;
