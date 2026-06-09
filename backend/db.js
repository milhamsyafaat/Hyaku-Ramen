var { DatabaseSync } = require('node:sqlite');
var path = require('path');
var fs = require('fs');
var bcrypt = require('bcryptjs');

var DB_PATH = path.join(__dirname, 'data', 'hyaku.db');
var _db = null;

function getDb() {
    if (!_db) {
        var dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        _db = new DatabaseSync(DB_PATH);
        _db.exec('PRAGMA journal_mode=WAL');
        _db.exec('PRAGMA foreign_keys=ON');
    }
    return _db;
}

function initialize() {
    var db = getDb();

    db.exec('CREATE TABLE IF NOT EXISTS menu_items (id TEXT PRIMARY KEY, cat TEXT NOT NULL, name TEXT NOT NULL, price TEXT NOT NULL, priceNum INTEGER NOT NULL, badge TEXT DEFAULT "", badgeClass TEXT DEFAULT "", desc TEXT DEFAULT "", img TEXT DEFAULT "", created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
    db.exec('CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, items TEXT NOT NULL, total INTEGER NOT NULL, customer_name TEXT DEFAULT "", customer_phone TEXT DEFAULT "", notes TEXT DEFAULT "", status TEXT DEFAULT "pending", created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
    db.exec('CREATE TABLE IF NOT EXISTS reservations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL, guests INTEGER NOT NULL, date TEXT NOT NULL, time TEXT NOT NULL, notes TEXT DEFAULT "", status TEXT DEFAULT "pending", created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
    db.exec('CREATE TABLE IF NOT EXISTS contact_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT DEFAULT "", subject TEXT DEFAULT "", message TEXT NOT NULL, status TEXT DEFAULT "unread", created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
    db.exec('CREATE TABLE IF NOT EXISTS testimonials (id INTEGER PRIMARY KEY AUTOINCREMENT, author TEXT NOT NULL, initial TEXT DEFAULT "", avatarClass TEXT DEFAULT "", role TEXT DEFAULT "", date TEXT DEFAULT "", rating INTEGER DEFAULT 5, title TEXT DEFAULT "", text TEXT DEFAULT "", ownerReply TEXT DEFAULT "", created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
    db.exec('CREATE TABLE IF NOT EXISTS gallery (id INTEGER PRIMARY KEY AUTOINCREMENT, src TEXT NOT NULL, alt TEXT DEFAULT "", sort_order INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
    db.exec('CREATE TABLE IF NOT EXISTS admin_users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');

    db.exec('CREATE TABLE IF NOT EXISTS tables (id INTEGER PRIMARY KEY AUTOINCREMENT, number TEXT NOT NULL UNIQUE, capacity INTEGER NOT NULL, location TEXT DEFAULT "", status TEXT DEFAULT "available", created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
    db.exec('CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, transaction_id TEXT DEFAULT "", gross_amount INTEGER NOT NULL, status TEXT DEFAULT "pending", payment_type TEXT DEFAULT "", transaction_time TEXT DEFAULT "", snap_token TEXT DEFAULT "", snap_redirect_url TEXT DEFAULT "", created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
    db.exec('CREATE TABLE IF NOT EXISTS email_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, to_email TEXT NOT NULL, subject TEXT DEFAULT "", message TEXT DEFAULT "", status TEXT DEFAULT "sent", created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');

    db.exec('CREATE TABLE IF NOT EXISTS wa_numbers (id INTEGER PRIMARY KEY AUTOINCREMENT, number TEXT NOT NULL UNIQUE, label TEXT DEFAULT "", is_default INTEGER DEFAULT 0, is_tester INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');

    try { db.exec('ALTER TABLE reservations ADD COLUMN table_id INTEGER DEFAULT NULL REFERENCES tables(id)'); } catch (e) {}
    try { db.exec('ALTER TABLE orders ADD COLUMN email TEXT DEFAULT ""'); } catch (e) {}
    try { db.exec('ALTER TABLE orders ADD COLUMN payment_id INTEGER DEFAULT NULL REFERENCES payments(id)'); } catch (e) {}
    try { db.exec("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'manual'"); } catch (e) {}

    var count = db.prepare('SELECT COUNT(*) as c FROM menu_items').get();
    if (count.c === 0) { seed(db); }

    var tableCount = db.prepare('SELECT COUNT(*) as c FROM tables').get();
    if (tableCount.c === 0) {
        tableData.forEach(function (t) {
            db.prepare('INSERT INTO tables (number, capacity, location) VALUES (?, ?, ?)').run(t.number, t.capacity, t.location);
        });
    }

    var waCount = db.prepare('SELECT COUNT(*) as c FROM wa_numbers').get();
    if (waCount.c === 0) {
        db.prepare('INSERT INTO wa_numbers (number, label, is_default, is_tester, is_active) VALUES (?, ?, ?, ?, ?)').run('6285174074352', 'Hyaku Ramen Official', 1, 0, 1);
        db.prepare('INSERT INTO wa_numbers (number, label, is_default, is_tester, is_active) VALUES (?, ?, ?, ?, ?)').run('6288293426204', 'Hyaku Ramen Tester', 0, 1, 1);
    }

    var adminCount = db.prepare('SELECT COUNT(*) as c FROM admin_users').get();
    if (adminCount.c === 0) {
        var hash = bcrypt.hashSync('admin123', 10);
        db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', hash);

    }
}

function seed(db) {
    db.exec('BEGIN');
    menuData.forEach(function (m) {
        db.prepare('INSERT INTO menu_items (id, cat, name, price, priceNum, badge, badgeClass, desc, img) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(m.id, m.cat, m.name, m.price, m.priceNum, m.badge, m.badgeClass, m.desc, m.img);
    });
    galleryData.forEach(function (g, i) {
        db.prepare('INSERT INTO gallery (src, alt, sort_order) VALUES (?, ?, ?)').run(g.src, g.alt, i);
    });
    testimonialData.forEach(function (t) {
        db.prepare('INSERT INTO testimonials (author, initial, avatarClass, role, date, rating, title, text, ownerReply) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(t.author, t.initial, t.avatarClass, t.role, t.date, t.rating, t.title, t.text, t.ownerReply);
    });
    tableData.forEach(function (t) {
        db.prepare('INSERT INTO tables (number, capacity, location) VALUES (?, ?, ?)').run(t.number, t.capacity, t.location);
    });
    db.exec('COMMIT');
}

var tableData = [
    { number: 'Meja 1', capacity: 2, location: 'Indoor' },
    { number: 'Meja 2', capacity: 2, location: 'Indoor' },
    { number: 'Meja 3', capacity: 4, location: 'Indoor' },
    { number: 'Meja 4', capacity: 4, location: 'Indoor' },
    { number: 'Meja 5', capacity: 6, location: 'Indoor' },
    { number: 'Meja 6', capacity: 2, location: 'Outdoor' },
    { number: 'Meja 7', capacity: 2, location: 'Outdoor' },
    { number: 'Meja 8', capacity: 4, location: 'Outdoor' },
    { number: 'Meja 9', capacity: 4, location: 'Outdoor' },
    { number: 'Meja 10', capacity: 6, location: 'Outdoor' }
];

var IMG_LEGENDARY = 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80';
var IMG_TANTAN = 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?auto=format&fit=crop&w=400&q=80';
var IMG_TONKOTSU = 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=400&q=80';
var IMG_DRY_HYAKU = 'https://images.unsplash.com/photo-1690650453129-b521970d1247?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
var IMG_DRY_KATSU = 'https://images.pexels.com/photos/17592738/pexels-photo-17592738.jpeg';
var IMG_KATSU = 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fthfvnext.bing.com%2Fth%2Fid%2FOIP.LtN4dOirvdYU6HlTsSUQSgHaE8%3Fr%3D0%26cb%3Dthfvnextfalcon2%26pid%3DApi&f=1&ipt=288ee0e5786b8d1798d59e6a582e960976db720a939720154b7585e174e3d509&ipo=images';
var IMG_KATSU_CURRY = 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%2Fid%2FOIP.fPE00prlmdqo5npzpWJ_2QHaHa%3Fpid%3DApi&f=1&ipt=014e417f84e6118fefa537a46e020913bcb5e76b05d1120c1802c27be41291bd&ipo=images';
var IMG_OCHA = 'https://images.pexels.com/photos/35042573/pexels-photo-35042573.jpeg';
var IMG_TEH_TARIK = 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=400&q=80';
var IMG_LEMON_TEA = 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=400&q=80';
var IMG_AIR = 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=400&q=80';
var IMG_EXTRA_CHASHU = 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fquickread.co.za%2Fwp-content%2Fuploads%2F2024%2F09%2FChashu.jpg&f=1&nofb=1&ipt=0dc30cb4c7ed536fe4225ea8790da347d63a59ba542ce165208dd041c2af75fa';
var IMG_SOFT_EGG = 'https://images.pexels.com/photos/4397261/pexels-photo-4397261.jpeg';
var IMG_NORI = 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fthfvnext.bing.com%2Fth%2Fid%2FOIP.hKKNZBjFtZczb0JNGYTcnAHaDl%3Fcb%3Dthfvnextfalcon2%26pid%3DApi&f=1&ipt=65c35d229fc32d74398eddadb6afdc73fbf730b22638aaf06de92424360f652a';
var GAL_1 = 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?q=80&w=1170&auto=format&fit=crop';
var GAL_2 = 'https://images.unsplash.com/photo-1721032740303-faa3480ec606?w=500&auto=format&fit=crop&q=60';
var GAL_3 = 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cmFtZW58ZW58MHx8MHx8fDA%3D';
var GAL_4 = 'https://images.unsplash.com/photo-1614563637806-1d0e645e0940?w=500&auto=format&fit=crop&q=60';
var GAL_5 = 'https://images.unsplash.com/photo-1618889482923-38250401a84e?w=500&auto=format&fit=crop&q=60';
var GAL_6 = 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=500&auto=format&fit=crop&q=60';

var menuData = [
    { id: 'm1', cat: 'ramen', name: 'Hyaku Legendary Ramen', price: 'Rp 28.000', priceNum: 28000, badge: 'Best Seller', badgeClass: 'text-red-500', desc: 'Ramen signature dengan rich tonkotsu broth, chashu, soft-boiled egg, nori, dan green onions.', img: IMG_LEGENDARY },
    { id: 'm2', cat: 'ramen', name: 'Tan Tan Ramen', price: 'Rp 25.000', priceNum: 25000, badge: 'Rekomendasi', badgeClass: 'text-blue-500', desc: 'Spicy sesame ramen dengan minced pork, chili oil, dan creamy broth.', img: IMG_TANTAN },
    { id: 'm3', cat: 'ramen', name: 'Tonkotsu Ramen', price: 'Rp 28.000', priceNum: 28000, badge: 'Populer', badgeClass: 'text-amber-500', desc: 'Ramen klasik dengan kuah tulang babi yang direbus lama, chashu, dan telur setengah matang.', img: IMG_TONKOTSU },
    { id: 'm4', cat: 'dry', name: 'Dry Hyaku Ramen', price: 'Rp 25.000', priceNum: 25000, badge: '', badgeClass: '', desc: 'Ramen kering signature dengan saus spesial, telur, dan potongan chashu.', img: IMG_DRY_HYAKU },
    { id: 'm5', cat: 'dry', name: 'Dry Katsu Ramen', price: 'Rp 28.000', priceNum: 28000, badge: '', badgeClass: '', desc: 'Ramen kering dengan chicken katsu gurih di atasnya.', img: IMG_DRY_KATSU },
    { id: 'm6', cat: 'katsu', name: 'Chicken Katsu', price: 'Rp 15.000', priceNum: 15000, badge: 'Side Dish', badgeClass: 'text-gray-500', desc: 'Chicken katsu renyah dengan saus katsu spesial.', img: IMG_KATSU },
    { id: 'm7', cat: 'katsu', name: 'Katsu Curry Rice', price: 'Rp 22.000', priceNum: 22000, badge: '', badgeClass: '', desc: 'Nasi dengan chicken katsu dan saus kari Jepang yang kental dan gurih.', img: IMG_KATSU_CURRY },
    { id: 'm8', cat: 'minuman', name: 'Ocha Tea', price: 'Rp 5.000', priceNum: 5000, badge: '', badgeClass: '', desc: 'Japanese green tea yang menyegarkan.', img: IMG_OCHA },
    { id: 'm9', cat: 'minuman', name: 'Teh Tarik', price: 'Rp 7.000', priceNum: 7000, badge: '', badgeClass: '', desc: 'Teh tarik khas dengan rasa creamy dan legit.', img: IMG_TEH_TARIK },
    { id: 'm10', cat: 'minuman', name: 'Lemon Tea', price: 'Rp 7.000', priceNum: 7000, badge: '', badgeClass: '', desc: 'Lemon tea segar, perasan jeruk lemon asli.', img: IMG_LEMON_TEA },
    { id: 'm11', cat: 'minuman', name: 'Air Mineral', price: 'Rp 4.000', priceNum: 4000, badge: '', badgeClass: '', desc: 'Air mineral kemasan ukuran 600ml.', img: IMG_AIR },
    { id: 'm12', cat: 'topping', name: 'Extra Chashu', price: 'Rp 8.000', priceNum: 8000, badge: '', badgeClass: '', desc: 'Tambahan daging chashu panggang.', img: IMG_EXTRA_CHASHU },
    { id: 'm13', cat: 'topping', name: 'Soft Boiled Egg', price: 'Rp 5.000', priceNum: 5000, badge: '', badgeClass: '', desc: 'Telur setengah matang dengan kuning meleleh.', img: IMG_SOFT_EGG },
    { id: 'm14', cat: 'topping', name: 'Nori Tambahan', price: 'Rp 3.000', priceNum: 3000, badge: '', badgeClass: '', desc: 'Lembaran rumput laut panggang tambahan.', img: IMG_NORI }
];

var galleryData = [
    { src: GAL_1, alt: 'Ramen dengan telur dan nori' },
    { src: GAL_2, alt: 'Semangkuk ramen lezat' },
    { src: GAL_3, alt: 'Semangkuk ramen lezat' },
    { src: GAL_4, alt: 'Ramen dengan kuah dan topping' },
    { src: GAL_5, alt: 'Ramen dengan chashu dan telur' },
    { src: GAL_6, alt: 'Mie ramen dengan kuah kental' }
];

var testimonialData = [
    { author: 'SandKCL', initial: 'S', avatarClass: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300', role: 'Local Guide \u2022 81 ulasan', date: '6 bulan lalu', rating: 5, title: 'Bagus, Bersih, Enak', text: 'Ramen nya Enak, beli Hyaku Legendary Ramen 28k sama Katsu Ramen 28k termasuk...', ownerReply: 'Terimakasih utk ulasannya kak...ditunggu kedatangannya kembali \u00f0\u009f\u0099\u008f' },
    { author: 'Saptiana Pascaliati Muqtazirin', initial: 'S', avatarClass: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300', role: 'Local Guide \u2022 17 ulasan', date: '3 bulan lalu', rating: 5, title: '', text: 'pertama kalii mencoba ramen yang kebetulan lokasiny dekat rumah. langsung setuju bgt kalo pantes dpt bintang 5 pkus plus plusss... anak\u00c2\u00ac juga suka dry ramennya, habis tanpa sisa, katsu nya juga guriih .. nyyammmmm', ownerReply: 'Terimakasih utk ulasannya kak...ditunggu kedatangannya kembali \u00f0\u009f\u0099\u008f' },
    { author: 'Alya Nurul Fadillah', initial: 'A', avatarClass: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300', role: 'Local Guide \u2022 9 ulasan', date: '4 bulan lalu', rating: 5, title: 'BESSTTT. BESSTTTT. BESSTTT. GONG.', text: 'beneran GONG soalnya ramen disini GAK ADA LAWAN. harganya juga sangat amat SANGAAATT murah meriah dan porsinya lumayan banyak jujur KENYANG. ada banyak opsi minuman juga.', ownerReply: 'Terimakasih utk ulasannya kak...ditunggu kedatangannya kembali \u00f0\u009f\u0099\u008f' }
];

function validate(schema, data) {
    var errors = [];
    Object.keys(schema).forEach(function (field) {
        var rules = schema[field];
        var value = data[field];
        if (rules.required && (value === undefined || value === null || String(value).trim() === '')) {
            errors.push(field + ' is required');
            return;
        }
        if (value === undefined || value === null || value === '') return;
        var strVal = String(value);
        if (rules.maxLength && strVal.length > rules.maxLength) { errors.push(field + ' max ' + rules.maxLength + ' characters'); }
        if (rules.type === 'number' && isNaN(Number(value))) { errors.push(field + ' must be a number'); }
        if (rules.type === 'integer' && (!Number.isInteger(Number(value)) || isNaN(Number(value)))) { errors.push(field + ' must be an integer'); }
        if (rules.min !== undefined && Number(value) < rules.min) { errors.push(field + ' min ' + rules.min); }
        if (rules.max !== undefined && Number(value) > rules.max) { errors.push(field + ' max ' + rules.max); }
        if (rules.pattern && !rules.pattern.test(strVal)) { errors.push(field + ' format invalid'); }
    });
    return errors.length ? errors : null;
}

function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

function resetData() {
    var db = getDb();
    var tables = ['orders', 'reservations', 'contact_messages', 'testimonials', 'gallery', 'menu_items', 'tables', 'wa_numbers', 'payments', 'email_logs'];
    tables.forEach(function (t) { db.exec('DELETE FROM ' + t); });
    seed(db);
    db.prepare('INSERT INTO wa_numbers (number, label, is_default, is_tester, is_active) VALUES (?, ?, ?, ?, ?)').run('6285174074352', 'Hyaku Ramen Official', 1, 0, 1);
    db.prepare('INSERT INTO wa_numbers (number, label, is_default, is_tester, is_active) VALUES (?, ?, ?, ?, ?)').run('6288293426204', 'Hyaku Ramen Tester', 0, 1, 1);
}

module.exports = { getDb, initialize, validate, sanitize, resetData };
