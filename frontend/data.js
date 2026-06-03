/* ===== MENU DATA ===== */
var MENU_DATA = [
    { id: 'm1', cat: 'ramen', name: 'Hyaku Legendary Ramen', price: 'Rp 28.000', priceNum: 28000, badge: 'Best Seller', badgeClass: 'text-red-500', desc: 'Ramen signature dengan rich tonkotsu broth, chashu, soft-boiled egg, nori, dan green onions. Hidangan paling populer kami!', img: IMG_LEGENDARY },
    { id: 'm2', cat: 'ramen', name: 'Tan Tan Ramen', price: 'Rp 25.000', priceNum: 25000, badge: 'Rekomendasi', badgeClass: 'text-blue-500', desc: 'Spicy sesame ramen dengan minced pork, chili oil, dan creamy broth. Pilihan pedas yang berani.', img: IMG_TANTAN },
    { id: 'm3', cat: 'ramen', name: 'Tonkotsu Ramen', price: 'Rp 28.000', priceNum: 28000, badge: 'Populer', badgeClass: 'text-amber-500', desc: 'Ramen klasik dengan kuah tulang babi yang direbus lama, chashu, dan telur setengah matang.', img: IMG_TONKOTSU },
    { id: 'm4', cat: 'dry', name: 'Dry Hyaku Ramen', price: 'Rp 25.000', priceNum: 25000, badge: '', badgeClass: '', desc: 'Ramen kering signature dengan saus spesial, telur, dan potongan chashu. Cocok untuk yang tidak suka kuah.', img: IMG_DRY_HYAKU },
    { id: 'm5', cat: 'dry', name: 'Dry Katsu Ramen', price: 'Rp 28.000', priceNum: 28000, badge: '', badgeClass: '', desc: 'Ramen kering dengan chicken katsu gurih di atasnya. Perpaduan tekstur yang sempurna.', img: IMG_DRY_KATSU },
    { id: 'm6', cat: 'katsu', name: 'Chicken Katsu', price: 'Rp 15.000', priceNum: 15000, badge: 'Side Dish', badgeClass: 'text-gray-500', desc: 'Chicken katsu renyah dengan saus katsu spesial. Cocok sebagai pendamping ramen.', img: IMG_KATSU },
    { id: 'm7', cat: 'katsu', name: 'Katsu Curry Rice', price: 'Rp 22.000', priceNum: 22000, badge: '', badgeClass: '', desc: 'Nasi dengan chicken katsu dan saus kari Jepang yang kental dan gurih.', img: IMG_KATSU_CURRY },
    { id: 'm8', cat: 'minuman', name: 'Ocha (Es / Hangat)', price: 'Rp 5.000', priceNum: 5000, badge: '', badgeClass: '', desc: 'Japanese green tea yang menyegarkan, bisa dinikmati dingin atau hangat.', img: IMG_OCHA },
    { id: 'm9', cat: 'minuman', name: 'Teh Tarik', price: 'Rp 7.000', priceNum: 7000, badge: '', badgeClass: '', desc: 'Teh tarik khas dengan rasa creamy dan legit.', img: IMG_TEH_TARIK },
    { id: 'm10', cat: 'minuman', name: 'Lemon Tea', price: 'Rp 7.000', priceNum: 7000, badge: '', badgeClass: '', desc: 'Lemon tea segar, perasan jeruk lemon asli.', img: IMG_LEMON_TEA },
    { id: 'm11', cat: 'minuman', name: 'Air Mineral', price: 'Rp 4.000', priceNum: 4000, badge: '', badgeClass: '', desc: 'Air mineral kemasan ukuran 600ml.', img: IMG_AIR },
    { id: 'm12', cat: 'topping', name: 'Extra Chashu', price: 'Rp 8.000', priceNum: 8000, badge: '', badgeClass: '', desc: 'Tambahan daging chashu panggang yang empuk dan gurih.', img: IMG_EXTRA_CHASHU },
    { id: 'm13', cat: 'topping', name: 'Soft Boiled Egg', price: 'Rp 5.000', priceNum: 5000, badge: '', badgeClass: '', desc: 'Telur setengah matang dengan kuning meleleh.', img: IMG_SOFT_EGG },
    { id: 'm14', cat: 'topping', name: 'Nori Tambahan', price: 'Rp 3.000', priceNum: 3000, badge: '', badgeClass: '', desc: 'Lembaran rumput laut panggang tambahan.', img: IMG_NORI }
];

/* ===== GALLERY DATA ===== */
var GALLERY_DATA = [
    { src: GAL_1, alt: 'Ramen di meja restoran' },
    { src: GAL_2, alt: 'Suasana dalam restoran ramen' },
    { src: GAL_3, alt: 'Piring ramen dengan topping' },
    { src: GAL_4, alt: 'Interior restoran' },
    { src: GAL_5, alt: 'Semangkuk ramen lezat' },
    { src: GAL_6, alt: 'Chicken katsu goreng' }
];

/* ===== TESTIMONIALS ===== */
var TESTIMONIALS = [
    { author: 'SandKCL', initial: 'S', avatarClass: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300', role: 'Local Guide \u2022 81 ulasan', date: '6 bulan lalu', rating: 5, title: 'Bagus, Bersih, Enak', text: 'Ramen nya Enak, beli Hyaku Legendary Ramen 28k sama Katsu Ramen 28k termasuk...', ownerReply: 'Terimakasih utk ulasannya kak...ditunggu kedatangannya kembali \u00f0\u009f\u0099\u008f' },
    { author: 'Saptiana Pascaliati Muqtazirin', initial: 'S', avatarClass: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300', role: 'Local Guide \u2022 17 ulasan', date: '3 bulan lalu', rating: 5, title: '', text: 'pertama kalii mencoba ramen yang kebetulan lokasiny dekat rumah. langsung setuju bgt kalo pantes dpt bintang 5 pkus plus plusss... anak\xc2\xac juga suka dry ramennya, habis tanpa sisa, katsu nya juga guriih .. nyyammmmm', ownerReply: 'Terimakasih utk ulasannya kak...ditunggu kedatangannya kembali \u00f0\u009f\u0099\u008f' },
    { author: 'Alya Nurul Fadillah', initial: 'A', avatarClass: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300', role: 'Local Guide \u2022 9 ulasan', date: '4 bulan lalu', rating: 5, title: 'BESSTTT. BESSTTTT. BESSTTT. GONG.', text: 'beneran GONG soalnya ramen disini GAK ADA LAWAN. harganya juga sangat amat SANGAAATT murah meriah dan porsinya lumayan banyak jujur KENYANG. ada banyak opsi minuman juga.', ownerReply: 'Terimakasih utk ulasannya kak...ditunggu kedatangannya kembali \u00f0\u009f\u0099\u008f' }
];
