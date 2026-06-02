var { DatabaseSync } = require('node:sqlite');
var path = require('path');
var fs = require('fs');
var bcrypt = require('bcryptjs');

var DB_PATH = path.join(__dirname, '..', 'data', 'hyaku.db');

function getDb() {
    var dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    var db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode=WAL');
    db.exec('PRAGMA foreign_keys=ON');
    return db;
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

    var count = db.prepare('SELECT COUNT(*) as c FROM menu_items').get();
    if (count.c === 0) { seed(db); }

    var adminCount = db.prepare('SELECT COUNT(*) as c FROM admin_users').get();
    if (adminCount.c === 0) {
        var hash = bcrypt.hashSync('HyakuAdmin123!', 10);
        db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', hash);
    }

    db.close();
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
    db.exec('COMMIT');
}

var IMG_LEGENDARY = 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80';
var IMG_TANTAN = 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?auto=format&fit=crop&w=400&q=80';
var IMG_TONKOTSU = 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=400&q=80';
var IMG_DRY_HYAKU = 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=400&q=80';
var IMG_DRY_KATSU = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80';
var IMG_KATSU = 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=400&q=80';
var IMG_KATSU_CURRY = 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=400&q=80';
var IMG_OCHA = 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80';
var IMG_TEH_TARIK = 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=400&q=80';
var IMG_LEMON_TEA = 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=400&q=80';
var IMG_AIR = 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=400&q=80';
var IMG_EXTRA_CHASHU = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80';
var IMG_SOFT_EGG = 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=400&q=80';
var IMG_NORI = 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=400&q=80';
var GAL_1 = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
var GAL_2 = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80';
var GAL_3 = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80';
var GAL_4 = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80';
var GAL_5 = 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=600&q=80';
var GAL_6 = 'https://images.unsplash.com/photo-1569058242567-93de6f36f8e6?auto=format&fit=crop&w=600&q=80';

var menuData = [
    { id: 'm1', cat: 'ramen', name: 'Hyaku Legendary Ramen', price: 'Rp 28.000', priceNum: 28000, badge: 'Best Seller', badgeClass: 'text-red-500', desc: 'Ramen signature dengan rich tonkotsu broth, chashu, soft-boiled egg, nori, dan green onions.', img: IMG_LEGENDARY },
    { id: 'm2', cat: 'ramen', name: 'Tan Tan Ramen', price: 'Rp 25.000', priceNum: 25000, badge: 'Rekomendasi', badgeClass: 'text-blue-500', desc: 'Spicy sesame ramen dengan minced pork, chili oil, dan creamy broth.', img: IMG_TANTAN },
    { id: 'm3', cat: 'ramen', name: 'Tonkotsu Ramen', price: 'Rp 28.000', priceNum: 28000, badge: 'Populer', badgeClass: 'text-amber-500', desc: 'Ramen klasik dengan kuah tulang babi yang direbus lama, chashu, dan telur setengah matang.', img: IMG_TONKOTSU },
    { id: 'm4', cat: 'dry', name: 'Dry Hyaku Ramen', price: 'Rp 25.000', priceNum: 25000, badge: '', badgeClass: '', desc: 'Ramen kering signature dengan saus spesial, telur, dan potongan chashu.', img: IMG_DRY_HYAKU },
    { id: 'm5', cat: 'dry', name: 'Dry Katsu Ramen', price: 'Rp 28.000', priceNum: 28000, badge: '', badgeClass: '', desc: 'Ramen kering dengan chicken katsu gurih di atasnya.', img: IMG_DRY_KATSU },
    { id: 'm6', cat: 'katsu', name: 'Chicken Katsu', price: 'Rp 15.000', priceNum: 15000, badge: 'Side Dish', badgeClass: 'text-gray-500', desc: 'Chicken katsu renyah dengan saus katsu spesial.', img: IMG_KATSU },
    { id: 'm7', cat: 'katsu', name: 'Katsu Curry Rice', price: 'Rp 22.000', priceNum: 22000, badge: '', badgeClass: '', desc: 'Nasi dengan chicken katsu dan saus kari Jepang yang kental dan gurih.', img: IMG_KATSU_CURRY },
    { id: 'm8', cat: 'minuman', name: 'Ocha (Es / Hangat)', price: 'Rp 5.000', priceNum: 5000, badge: '', badgeClass: '', desc: 'Japanese green tea yang menyegarkan.', img: IMG_OCHA },
    { id: 'm9', cat: 'minuman', name: 'Teh Tarik', price: 'Rp 7.000', priceNum: 7000, badge: '', badgeClass: '', desc: 'Teh tarik khas dengan rasa creamy dan legit.', img: IMG_TEH_TARIK },
    { id: 'm10', cat: 'minuman', name: 'Lemon Tea', price: 'Rp 7.000', priceNum: 7000, badge: '', badgeClass: '', desc: 'Lemon tea segar, perasan jeruk lemon asli.', img: IMG_LEMON_TEA },
    { id: 'm11', cat: 'minuman', name: 'Air Mineral', price: 'Rp 4.000', priceNum: 4000, badge: '', badgeClass: '', desc: 'Air mineral kemasan ukuran 600ml.', img: IMG_AIR },
    { id: 'm12', cat: 'topping', name: 'Extra Chashu', price: 'Rp 8.000', priceNum: 8000, badge: '', badgeClass: '', desc: 'Tambahan daging chashu panggang.', img: IMG_EXTRA_CHASHU },
    { id: 'm13', cat: 'topping', name: 'Soft Boiled Egg', price: 'Rp 5.000', priceNum: 5000, badge: '', badgeClass: '', desc: 'Telur setengah matang dengan kuning meleleh.', img: IMG_SOFT_EGG },
    { id: 'm14', cat: 'topping', name: 'Nori Tambahan', price: 'Rp 3.000', priceNum: 3000, badge: '', badgeClass: '', desc: 'Lembaran rumput laut panggang tambahan.', img: IMG_NORI }
];

var galleryData = [
    { src: GAL_1, alt: 'Ramen di meja restoran' },
    { src: GAL_2, alt: 'Suasana dalam restoran ramen' },
    { src: GAL_3, alt: 'Piring ramen dengan topping' },
    { src: GAL_4, alt: 'Interior restoran' },
    { src: GAL_5, alt: 'Semangkuk ramen lezat' },
    { src: GAL_6, alt: 'Chicken katsu goreng' }
];

var testimonialData = [
    { author: 'SandKCL', initial: 'S', avatarClass: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300', role: 'Local Guide \u2022 81 ulasan', date: '6 bulan lalu', rating: 5, title: 'Bagus, Bersih, Enak', text: 'Ramen nya Enak, beli Hyaku Legendary Ramen 28k sama Katsu Ramen 28k termasuk...', ownerReply: 'Terimakasih utk ulasannya kak...ditunggu kedatangannya kembali \u00f0\u009f\u0099\u008f' },
    { author: 'Saptiana Pascaliati Muqtazirin', initial: 'S', avatarClass: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300', role: 'Local Guide \u2022 17 ulasan', date: '3 bulan lalu', rating: 5, title: '', text: 'pertama kalii mencoba ramen yang kebetulan lokasiny dekat rumah. langsung setuju bgt kalo pantes dpt bintang 5 pkus plus plusss... anak\u00c2\u00ac juga suka dry ramennya, habis tanpa sisa, katsu nya juga guriih .. nyyammmmm', ownerReply: 'Terimakasih utk ulasannya kak...ditunggu kedatangannya kembali \u00f0\u009f\u0099\u008f' },
    { author: 'Alya Nurul Fadillah', initial: 'A', avatarClass: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300', role: 'Local Guide \u2022 9 ulasan', date: '4 bulan lalu', rating: 5, title: 'BESSTTT. BESSTTTT. BESSTTT. GONG.', text: 'beneran GONG soalnya ramen disini GAK ADA LAWAN. harganya juga sangat amat SANGAAATT murah meriah dan porsinya lumayan banyak jujur KENYANG. ada banyak opsi minuman juga.', ownerReply: 'Terimakasih utk ulasannya kak...ditunggu kedatangannya kembali \u00f0\u009f\u0099\u008f' }
];

module.exports = { getDb, initialize };
