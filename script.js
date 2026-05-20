/* ===== DOM HELPERS ===== */
var $ = function (id) { return document.getElementById(id); };
var qs = function (sel) { return document.querySelector(sel); };
var qa = function (sel) { return document.querySelectorAll(sel); };

/* ===== TOAST SYSTEM ===== */
var toastContainer = $('toastContainer');
function showToast(message, type) {
    if (!toastContainer) return;
    var colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500', warning: 'bg-yellow-500 text-gray-900' };
    var bg = colors[type] || colors.info;
    var iconMap = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
    var icon = iconMap[type] || iconMap.info;
    var el = document.createElement('div');
    el.className = 'toast show flex items-center gap-3 ' + bg + ' text-white px-4 py-3 rounded-xl shadow-lg text-sm max-w-xs';
    el.innerHTML = '<i class="fas ' + icon + '"></i><span>' + message + '</span>';
    toastContainer.appendChild(el);
    setTimeout(function () {
        el.classList.remove('show');
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 350);
    }, 3000);
}

/* ===== CART STATE ===== */
var __cart = [];
function __cartAdd(item) {
    for (var i = 0; i < __cart.length; i++) {
        if (__cart[i].id === item.id) { __cart[i].qty++; __cartSave(); __cartUpdateUI(); return; }
    }
    __cart.push({ id: item.id, name: item.name, price: item.price, priceNum: item.priceNum, qty: 1 });
    __cartSave();
    __cartUpdateUI();
}
function __cartRemove(index) {
    __cart.splice(index, 1);
    __cartSave();
    __cartUpdateUI();
}
function __cartSave() {
    try { localStorage.setItem('cart', JSON.stringify(__cart)); } catch (e) {}
}
function __cartLoad() {
    try { var s = localStorage.getItem('cart'); if (s) __cart = JSON.parse(s); } catch (e) {}
}
function __cartUpdateUI() {
    var badge = $('cartBadge');
    var count = 0;
    for (var i = 0; i < __cart.length; i++) { count += __cart[i].qty; }
    if (badge) { badge.textContent = count; badge.classList.toggle('hidden', count === 0); }
}
__cartLoad();
__cartUpdateUI();

/* ===== STICKY HEADER ===== */
(function stickyHeader() {
    var header = $('siteHeader');
    if (!header) return;
    var ticking = false;
    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(function () {
                if (window.scrollY > 80) {
                    header.classList.add('header-glass', 'bg-red-700/90', 'dark:bg-gray-950/90', 'shadow-lg');
                    header.classList.remove('bg-transparent');
                } else {
                    header.classList.remove('header-glass', 'bg-red-700/90', 'dark:bg-gray-950/90', 'shadow-lg');
                    header.classList.add('bg-transparent');
                }
                ticking = false;
            });
            ticking = true;
        }
    });
})();

/* ===== SCROLL PROGRESS ===== */
(function scrollProgress() {
    var bar = $('scrollProgress');
    if (!bar) return;
    window.addEventListener('scroll', function () {
        var scrollTop = window.scrollY;
        var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width = progress + '%';
    });
})();

/* ===== DARK MODE ===== */
(function darkMode() {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (!stored && prefersDark)) {
        document.documentElement.classList.add('dark');
    }
    var toggle = $('darkToggle');
    var icon = $('darkIcon');
    if (!toggle || !icon) return;
    function updateIcon() {
        icon.className = document.documentElement.classList.contains('dark') ? 'fas fa-sun text-sm' : 'fas fa-moon text-sm';
    }
    updateIcon();
    toggle.addEventListener('click', function () {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        updateIcon();
    });
})();

/* ===== LIVE HOURS ===== */
(function liveHours() {
    var now = new Date();
    var total = now.getHours() * 60 + now.getMinutes();
    var isOpen = total >= 600 && total < 1320;
    var statusText = isOpen ? 'Buka \u2022 Tutup 22.00' : 'Tutup \u2022 Buka jam 10.00';
    var badge = $('statusBadge');
    var text = $('statusText');
    var textMobile = $('statusTextMobile');
    var textFooter = $('statusTextFooter');
    if (badge) {
        badge.className = (isOpen ? 'bg-green-500' : 'bg-red-500') + ' text-white px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm';
    }
    if (text) text.textContent = statusText;
    if (textMobile) textMobile.textContent = statusText;
    if (textFooter) textFooter.textContent = statusText;
})();

/* ===== MOBILE NAV ===== */
(function mobileNav() {
    var hamburger = $('hamburgerBtn');
    var drawer = $('navDrawer');
    var overlay = $('navOverlay');
    var closeBtn = $('navDrawerClose');
    var links = qa('.mobile-nav-link');
    if (!hamburger || !drawer || !overlay || !closeBtn) return;
    function openDrawer() {
        drawer.classList.add('open');
        drawer.setAttribute('aria-hidden', 'false');
        overlay.classList.add('open');
        hamburger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }
    function closeDrawer() {
        drawer.classList.remove('open');
        drawer.setAttribute('aria-hidden', 'true');
        overlay.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }
    hamburger.addEventListener('click', openDrawer);
    closeBtn.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);
    links.forEach(function (l) { l.addEventListener('click', closeDrawer); });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
    });
})();

/* ===== ACTIVE NAV ===== */
(function activeNav() {
    if (!('IntersectionObserver' in window)) return;
    var links = qa('.nav-link');
    var sections = [];
    links.forEach(function (link) {
        var href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            var section = document.getElementById(href.slice(1));
            if (section) sections.push({ el: section, link: link });
        }
    });
    if (!sections.length) return;
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                sections.forEach(function (s) {
                    s.link.classList.remove('bg-white/30', 'font-semibold');
                    s.link.classList.add('bg-white/10');
                });
                var active = sections.find(function (s) { return s.el === entry.target; });
                if (active) {
                    active.link.classList.remove('bg-white/10');
                    active.link.classList.add('bg-white/30', 'font-semibold');
                }
            }
        });
    }, { threshold: 0.3 });
    sections.forEach(function (s) { observer.observe(s.el); });
})();

/* ===== SCROLL ANIMATIONS ===== */
(function scrollAnimate() {
    var els = qa('.scroll-animate');
    if (!els.length || !('IntersectionObserver' in window)) {
        els.forEach(function (el) { el.classList.add('visible'); });
        return;
    }
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    els.forEach(function (el) { observer.observe(el); });
})();

/* ===== SCROLL TO TOP ===== */
(function scrollTop() {
    var btn = $('scrollTopBtn');
    if (!btn) return;
    window.addEventListener('scroll', function () {
        if (window.scrollY > 400) {
            btn.classList.remove('opacity-0', 'invisible', 'scale-75');
            btn.classList.add('opacity-100', 'visible', 'scale-100');
        } else {
            btn.classList.add('opacity-0', 'invisible', 'scale-75');
            btn.classList.remove('opacity-100', 'visible', 'scale-100');
        }
    });
    btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
})();

/* ===== RENDER MENU ===== */
(function renderMenu() {
    var grid = $('menuGrid');
    var count = $('menuCount');
    if (!grid) return;
    var currentFilter = 'all';
    var filterBtns = qa('.filter-btn');

    function render(filter) {
        var items = filter === 'all' ? MENU_DATA : MENU_DATA.filter(function (m) { return m.cat === filter; });
        if (count) count.textContent = items.length + ' item';
        if (items.length === 0) {
            grid.innerHTML = '<div class="sm:col-span-2 lg:col-span-3 text-center py-8 text-gray-400"><i class="fas fa-search text-2xl mb-2"></i><p class="text-sm">Tidak ada menu di kategori ini</p></div>';
            return;
        }
        var html = '';
        items.forEach(function (m) {
            var imgHtml = m.img ? '<div class="h-36 overflow-hidden"><img src="' + m.img + '" alt="' + m.name + '" class="w-full h-full object-cover" loading="lazy"></div>' : '<div class="h-36 bg-gray-100 dark:bg-gray-700 flex items-center justify-center"><i class="fas fa-utensils text-gray-400 text-2xl"></i></div>';
            var badgeHtml = m.badge ? '<span class="text-xs uppercase tracking-wider font-bold ' + m.badgeClass + '">' + m.badge + '</span>' : '';
            html += '<div class="menu-card bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden cursor-pointer hover:shadow-md" data-id="' + m.id + '">'
                + imgHtml
                + '<div class="p-4">'
                + badgeHtml
                + '<h3 class="font-bold text-gray-800 dark:text-gray-200 mt-1 text-sm">' + m.name + '</h3>'
                + '<p class="text-sm text-red-600 dark:text-red-400 font-semibold mt-1">' + m.price + '</p>'
                + '</div></div>';
        });
        grid.innerHTML = html;

        grid.querySelectorAll('.menu-card').forEach(function (card) {
            card.addEventListener('click', function () {
                var id = card.dataset.id;
                var item = MENU_DATA.find(function (m) { return m.id === id; });
                if (!item) return;
                var mmBadge = $('mmBadge');
                var mmTitle = $('mmTitle');
                var mmPrice = $('mmPrice');
                var mmDesc = $('mmDesc');
                var mmWa = $('mmWaLink');
                var modal = $('menuModal');
                if (mmBadge) { mmBadge.textContent = item.badge || ''; mmBadge.className = 'text-xs uppercase tracking-wider font-bold ' + (item.badgeClass || 'text-red-500'); }
                if (mmTitle) mmTitle.textContent = item.name;
                if (mmPrice) mmPrice.textContent = item.price;
                if (mmDesc) mmDesc.textContent = item.desc;
                if (mmWa) mmWa.href = 'https://wa.me/6285174074352?text=' + encodeURIComponent('Halo Hyaku Ramen, saya ingin pesan ' + item.name + ' (' + item.price + ').');
                if (modal) { modal.classList.add('open'); document.body.style.overflow = 'hidden'; }
                var mmAddBtn = $('mmAddCartBtn');
                if (mmAddBtn) {
                    mmAddBtn.onclick = function () { __cartAdd(item); };
                }
            });
        });
    }

    filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            filterBtns.forEach(function (b) {
                b.classList.remove('active', 'bg-red-600', 'text-white');
                b.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.remove('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
            btn.classList.add('active', 'bg-red-600', 'text-white');
            btn.setAttribute('aria-selected', 'true');
            currentFilter = btn.dataset.filter;
            render(currentFilter);
        });
    });

    render('all');
})();

/* ===== RENDER GALLERY ===== */
(function renderGallery() {
    var grid = $('galleryGrid');
    if (!grid) return;
    var html = '';
    GALLERY_DATA.forEach(function (img, i) {
        html += '<div class="gallery-item rounded-2xl overflow-hidden shadow-sm cursor-pointer" data-index="' + i + '">'
            + '<img src="' + img.src + '" alt="' + img.alt + '" class="w-full h-48 sm:h-56 object-cover" loading="lazy">'
            + '</div>';
    });
    grid.innerHTML = html;
})();

/* ===== LIGHTBOX ===== */
(function lightbox() {
    var items = qa('.gallery-item');
    var lb = $('lightbox');
    var lbImg = $('lbImage');
    var lbCap = $('lbCaption');
    var lbClose = $('lbCloseBtn');
    var lbPrev = $('lbPrevBtn');
    var lbNext = $('lbNextBtn');
    if (!lb || !lbImg || !lbClose) return;
    var currentIndex = 0;

    function openLb(index) {
        var img = GALLERY_DATA[index];
        if (!img) return;
        currentIndex = index;
        lbImg.src = img.src;
        lbCap.textContent = img.alt || '';
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
        if (GALLERY_DATA.length > 1) {
            if (lbPrev) lbPrev.classList.remove('hidden');
            if (lbNext) lbNext.classList.remove('hidden');
        }
        updateNavButtons();
    }

    function updateNavButtons() {
        if (lbPrev) lbPrev.classList.toggle('hidden', currentIndex === 0);
        if (lbNext) lbNext.classList.toggle('hidden', currentIndex === GALLERY_DATA.length - 1);
    }

    function closeLb() {
        lb.classList.remove('open');
        document.body.style.overflow = '';
    }

    function prevLb() {
        if (currentIndex > 0) openLb(currentIndex - 1);
    }

    function nextLb() {
        if (currentIndex < GALLERY_DATA.length - 1) openLb(currentIndex + 1);
    }

    items.forEach(function (item) {
        item.addEventListener('click', function () {
            var idx = parseInt(item.dataset.index);
            openLb(idx);
        });
    });

    if (lbClose) lbClose.addEventListener('click', closeLb);
    if (lbPrev) lbPrev.addEventListener('click', prevLb);
    if (lbNext) lbNext.addEventListener('click', nextLb);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
        if (!lb.classList.contains('open')) return;
        if (e.key === 'Escape') closeLb();
        if (e.key === 'ArrowLeft') prevLb();
        if (e.key === 'ArrowRight') nextLb();
    });
})();

/* ===== MENU MODAL ===== */
(function menuModal() {
    var modal = $('menuModal');
    var mmClose = $('mmCloseBtn');
    if (!modal || !mmClose) return;
    function closeMm() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
    mmClose.addEventListener('click', closeMm);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeMm(); });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('open')) closeMm();
    });
})();

/* ===== TESTIMONIALS CAROUSEL ===== */
(function testimonialsCarousel() {
    var container = $('testimonialContent');
    var dots = $('testimonialDots');
    var prevBtn = $('testiPrev');
    var nextBtn = $('testiNext');
    if (!container) return;
    var current = 0;
    var total = TESTIMONIALS.length;
    if (total === 0) return;

    function renderSlide(index) {
        var t = TESTIMONIALS[index];
        var stars = '';
        for (var i = 0; i < 5; i++) { stars += i < t.rating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>'; }
        var ownerHtml = t.ownerReply ? '<div class="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-xs text-gray-600 dark:text-gray-400 border-l-2 border-gray-300 dark:border-gray-600 mt-3"><p class="font-bold text-gray-700 dark:text-gray-300">Tanggapan Pemilik <span class="font-normal text-gray-400">&bull;</span></p><p class="mt-1">"' + t.ownerReply + '"</p></div>' : '';
        var titleHtml = t.title ? '<p class="text-sm font-semibold text-gray-800 dark:text-gray-200">' + t.title + '</p>' : '';
        container.innerHTML = '<div class="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3 animate-fade-in">'
            + '<div class="flex justify-between items-start">'
            + '<div class="flex items-center gap-3">'
            + '<div class="w-10 h-10 rounded-full ' + t.avatarClass + ' flex items-center justify-center font-bold">' + t.initial + '</div>'
            + '<div><h4 class="font-bold text-gray-800 dark:text-gray-200 text-sm">' + t.author + '</h4><p class="text-xs text-gray-400 dark:text-gray-500">' + t.role + '</p></div>'
            + '</div>'
            + '<span class="text-xs text-gray-400 dark:text-gray-500">' + t.date + '</span>'
            + '</div>'
            + '<div class="stars-display text-xs gap-0.5 flex">' + stars + '</div>'
            + titleHtml
            + '<p class="text-sm text-gray-600 dark:text-gray-400">"' + t.text + '"</p>'
            + ownerHtml
            + '</div>';
    }

    function updateDots() {
        if (!dots) return;
        var html = '';
        for (var i = 0; i < total; i++) {
            html += '<button class="w-2 h-2 rounded-full transition-all ' + (i === current ? 'bg-red-600 w-4' : 'bg-gray-300 dark:bg-gray-600') + '" data-index="' + i + '" aria-label="Testimoni ' + (i + 1) + '"></button>';
        }
        dots.innerHTML = html;
        dots.querySelectorAll('button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                current = parseInt(btn.dataset.index);
                renderSlide(current);
                updateDots();
            });
        });
    }

    function next() { current = (current + 1) % total; renderSlide(current); updateDots(); }
    function prev() { current = (current - 1 + total) % total; renderSlide(current); updateDots(); }

    renderSlide(0);
    updateDots();
    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', next);
    var interval = setInterval(next, 5000);
    var carouselContainer = $('testimonialContainer');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', function () { clearInterval(interval); });
        carouselContainer.addEventListener('mouseleave', function () { interval = setInterval(next, 5000); });
    }
})();

/* ===== SAVE / BOOKMARK ===== */
(function saveBtn() {
    var btn = $('saveBtn');
    var icon = $('saveIcon');
    if (!btn || !icon) return;
    var saved = localStorage.getItem('saved') === 'true';
    function updateSave() {
        icon.className = saved ? 'fas fa-bookmark text-red-600 text-xl mb-1' : 'far fa-bookmark text-red-600 text-xl mb-1';
        btn.querySelector('span').textContent = saved ? 'Tersimpan' : 'Simpan';
    }
    updateSave();
    btn.addEventListener('click', function () {
        saved = !saved;
        localStorage.setItem('saved', saved ? 'true' : 'false');
        updateSave();
        showToast(saved ? 'Tersimpan!' : 'Dihapus dari simpanan', saved ? 'success' : 'info');
    });
})();

/* ===== SHARE ===== */
(function shareBtn() {
    var btn = $('shareBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
        var data = { title: 'Hyaku Ramen - Depok', text: 'Hyaku Ramen di Kukusan, Depok \u2022 Rating 4.9 \u2022 Buka 10.00-22.00', url: window.location.href };
        if (navigator.share) {
            navigator.share(data).catch(function () {});
        } else {
            var dummy = document.createElement('textarea');
            dummy.value = data.text + ' ' + data.url;
            document.body.appendChild(dummy);
            dummy.select();
            document.execCommand('copy');
            document.body.removeChild(dummy);
            btn.querySelector('span').textContent = 'Tersalin!';
            showToast('Tautan disalin ke clipboard!', 'success');
            setTimeout(function () { btn.querySelector('span').textContent = 'Bagikan'; }, 2000);
        }
    });
})();

/* ===== RESERVATION FORM ===== */
(function reservationForm() {
    var form = $('reservationForm');
    if (!form) return;
    var dateInput = $('resDate');
    if (dateInput) {
        var today = new Date();
        dateInput.min = today.toISOString().split('T')[0];
        dateInput.value = today.toISOString().split('T')[0];
    }
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = $('resName').value.trim();
        var phone = $('resPhone').value.trim();
        var guests = $('resGuests').value.trim();
        var date = $('resDate').value;
        var time = $('resTime').value;
        var notes = $('resNotes').value.trim();
        if (!name || !phone || !guests || !date || !time) {
            showToast('Mohon lengkapi semua field yang wajib diisi.', 'warning');
            return;
        }
        var text = 'Halo Hyaku Ramen, saya ingin reservasi.%0A'
            + 'Nama: ' + name + '%0A'
            + 'No. Telepon: ' + phone + '%0A'
            + 'Jumlah Tamu: ' + guests + '%0A'
            + 'Tanggal: ' + date + '%0A'
            + 'Waktu: ' + time;
        if (notes) text += '%0A Catatan: ' + notes;
        window.open('https://wa.me/6285174074352?text=' + text, '_blank');
        showToast('Permintaan reservasi dikirim!', 'success');
    });
})();

/* ===== CONTACT FORM ===== */
(function contactForm() {
    var form = $('contactForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = $('formName').value.trim();
        var phone = $('formPhone').value.trim();
        var subject = $('formSubject').value;
        var message = $('formMessage').value.trim();
        if (!name || !message) {
            showToast('Mohon isi nama dan pesan Anda.', 'warning');
            return;
        }
        var text = 'Halo Hyaku Ramen, saya ' + name + '.';
        if (phone) text += ' No. Telepon: ' + phone + '.';
        if (subject) text += ' (' + subject + ')';
        text += ' ' + message;
        window.open('https://wa.me/6285174074352?text=' + encodeURIComponent(text), '_blank');
        showToast('Pesan terkirim!', 'success');
    });
})();

/* ===== NEWSLETTER ===== */
(function newsletter() {
    var form = $('newsletterForm');
    if (!form) return;
    var input = $('newsletterEmail');
    if (!input) return;

    var saved = localStorage.getItem('newsletter_email');
    if (saved) input.placeholder = 'Email: ' + saved;

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = input.value.trim();
        if (!email) return;
        try { localStorage.setItem('newsletter_email', email); } catch (e) {}
        showToast('Terima kasih! ' + email + ' telah terdaftar.', 'success');
        form.reset();
    });
})();

/* ===== CART UI ===== */
(function cartUI() {
    var modal = $('cartModal');
    var closeBtn = $('cartCloseBtn');
    var toggleBtn = $('cartBtn');
    var itemsEl = $('cartItems');
    var emptyEl = $('cartEmpty');
    var footerEl = $('cartFooter');
    var totalEl = $('cartTotal');
    var checkoutBtn = $('cartCheckoutBtn');

    if (!modal || !closeBtn || !toggleBtn || !itemsEl || !emptyEl || !footerEl || !totalEl) return;

    function render() {
        if (__cart.length === 0) {
            itemsEl.innerHTML = '';
            emptyEl.classList.remove('hidden');
            footerEl.classList.add('hidden');
            return;
        }
        emptyEl.classList.add('hidden');
        footerEl.classList.remove('hidden');
        var html = '';
        var total = 0;
        for (var i = 0; i < __cart.length; i++) {
            var item = __cart[i];
            total += item.priceNum * item.qty;
            html += '<div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">'
                + '<div class="flex-1 min-w-0"><p class="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">' + item.name + '</p><p class="text-xs text-gray-500">' + item.price + '</p></div>'
                + '<div class="flex items-center gap-2 ml-3">'
                + '<button class="cart-qty w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center justify-center text-xs font-bold hover:bg-gray-300 dark:hover:bg-gray-500 transition cursor-pointer" data-i="' + i + '" data-d="minus">-</button>'
                + '<span class="text-sm font-bold w-5 text-center">' + item.qty + '</span>'
                + '<button class="cart-qty w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center justify-center text-xs font-bold hover:bg-gray-300 dark:hover:bg-gray-500 transition cursor-pointer" data-i="' + i + '" data-d="plus">+</button>'
                + '<button class="cart-del w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/50 text-red-500 flex items-center justify-center text-xs hover:bg-red-200 dark:hover:bg-red-800 transition cursor-pointer" data-i="' + i + '"><i class="fas fa-trash-alt"></i></button>'
                + '</div></div>';
        }
        itemsEl.innerHTML = html;
        totalEl.textContent = 'Rp ' + total.toLocaleString('id-ID');

        itemsEl.querySelectorAll('.cart-qty').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx = parseInt(btn.dataset.i);
                if (btn.dataset.d === 'minus') {
                    if (__cart[idx].qty > 1) { __cart[idx].qty--; } else { __cartRemove(idx); }
                } else {
                    __cart[idx].qty++;
                }
                __cartSave();
                __cartUpdateUI();
                render();
            });
        });
        itemsEl.querySelectorAll('.cart-del').forEach(function (btn) {
            btn.addEventListener('click', function () {
                __cartRemove(parseInt(btn.dataset.i));
                render();
            });
        });
    }

    function open() { modal.classList.add('open'); document.body.style.overflow = 'hidden'; render(); }
    function close() { modal.classList.remove('open'); document.body.style.overflow = ''; }

    toggleBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function () {
            if (__cart.length === 0) return;
            var text = 'Halo Hyaku Ramen, saya ingin pesan:%0A';
            var total = 0;
            for (var i = 0; i < __cart.length; i++) {
                var item = __cart[i];
                text += '- ' + item.name + ' x' + item.qty + ' (' + item.price + ')%0A';
                total += item.priceNum * item.qty;
            }
            text += '%0ATotal: Rp ' + total.toLocaleString('id-ID');
            window.open('https://wa.me/6285174074352?text=' + text, '_blank');
            showToast('Pesanan dikirim via WhatsApp!', 'success');
        });
    }
})();

/* ===== PRINT ===== */
(function printBtn() {
    var btn = $('printBtn');
    if (!btn) return;
    btn.addEventListener('click', function () { window.print(); });
})();
