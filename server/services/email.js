var nodemailer = require('nodemailer');

var SMTP_HOST = process.env.SMTP_HOST || '';
var SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
var SMTP_USER = process.env.SMTP_USER || '';
var SMTP_PASS = process.env.SMTP_PASS || '';
var ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

var transporter = null;
if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
}

function isConfigured() {
    return transporter !== null && ADMIN_EMAIL !== '';
}

function sendMail(to, subject, html) {
    if (!isConfigured()) {
        console.log('Email not configured. Skipping email to', to, 'subject:', subject);
        return Promise.resolve(null);
    }
    return transporter.sendMail({
        from: SMTP_USER,
        to: to,
        subject: subject,
        html: html
    });
}

function notifyNewOrder(order) {
    var items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    var itemsHtml = '';
    items.forEach(function (i) {
        itemsHtml += '<tr><td style="padding:8px;border-bottom:1px solid #ddd;">' + i.name + '</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:center;">x' + i.qty + '</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">' + i.price + '</td></tr>';
    });
    var subject = 'Pesanan Baru #' + order.id + ' — Hyaku Ramen';
    var html = '<h2 style="color:#dc2626;">Pesanan Baru Masuk!</h2>'
        + '<p><strong>Order #' + order.id + '</strong></p>'
        + '<p>Nama: ' + (order.customer_name || '-') + '<br>No. HP: ' + (order.customer_phone || '-') + '<br>Email: ' + (order.email || '-') + '</p>'
        + '<table style="width:100%;border-collapse:collapse;">'
        + '<thead><tr style="background:#f3f4f6;"><th style="padding:8px;text-align:left;">Item</th><th style="padding:8px;text-align:center;">Qty</th><th style="padding:8px;text-align:right;">Harga</th></tr></thead>'
        + '<tbody>' + itemsHtml + '</tbody>'
        + '<tfoot><tr><td colspan="2" style="padding:8px;font-weight:bold;">Total</td><td style="padding:8px;text-align:right;font-weight:bold;">Rp ' + (order.total || 0).toLocaleString('id-ID') + '</td></tr></tfoot>'
        + '</table>'
        + '<p style="margin-top:16px;"><a href="http://localhost:3001/admin/" style="background:#dc2626;color:white;padding:10px 20px;text-decoration:none;border-radius:8px;">Lihat di Admin</a></p>';
    return sendMail(ADMIN_EMAIL, subject, html);
}

function notifyNewReservation(reservation) {
    var subject = 'Reservasi Baru #' + reservation.id + ' — Hyaku Ramen';
    var html = '<h2 style="color:#dc2626;">Reservasi Baru!</h2>'
        + '<p><strong>Reservasi #' + reservation.id + '</strong></p>'
        + '<p>Nama: ' + (reservation.name || '-') + '<br>No. HP: ' + (reservation.phone || '-') + '<br>Tamu: ' + (reservation.guests || 0) + '<br>Tanggal: ' + (reservation.date || '-') + '<br>Waktu: ' + (reservation.time || '-') + '</p>'
        + (reservation.notes ? '<p>Catatan: ' + reservation.notes + '</p>' : '')
        + '<p style="margin-top:16px;"><a href="http://localhost:3001/admin/" style="background:#dc2626;color:white;padding:10px 20px;text-decoration:none;border-radius:8px;">Lihat di Admin</a></p>';
    return sendMail(ADMIN_EMAIL, subject, html);
}

module.exports = { isConfigured, sendMail, notifyNewOrder, notifyNewReservation };
