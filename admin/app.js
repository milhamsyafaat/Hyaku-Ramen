var API = '/api';
var TOKEN = localStorage.getItem('admin_token');

/* ===== ESCAPE HTML (XSS prevention) ===== */
function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

/* ===== TOAST ===== */
function adminToast(msg, type) {
    var el = document.getElementById('adminToast');
    if (!el) return;
    var colors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600', warning: 'bg-yellow-600 text-gray-900' };
    el.className = 'fixed top-4 right-4 z-50 ' + (colors[type] || colors.info) + ' text-white px-4 py-3 rounded-xl shadow-lg text-sm flex items-center gap-2 animate-fade-in max-w-sm';
    el.innerHTML = '<i class="fas fa-' + (type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle') + '"></i> ' + msg;
    el.classList.remove('hidden');
    setTimeout(function () { el.classList.add('hidden'); }, 4000);
}

/* ===== DELETE CONFIRM MODAL ===== */
var deleteCallback = null;
function confirmDelete(msg, cb) {
    document.getElementById('deleteModalMessage').textContent = msg;
    document.getElementById('deleteModal').classList.remove('hidden');
    deleteCallback = cb;
}
document.getElementById('deleteConfirmBtn').addEventListener('click', function () {
    document.getElementById('deleteModal').classList.add('hidden');
    if (deleteCallback) deleteCallback();
    deleteCallback = null;
});
document.getElementById('deleteCancelBtn').addEventListener('click', function () {
    document.getElementById('deleteModal').classList.add('hidden');
    deleteCallback = null;
});

function showView(id) {
    document.querySelectorAll('.view').forEach(function (el) { el.classList.add('hidden'); });
    var view = document.getElementById(id);
    if (view) view.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(function (el) { el.classList.remove('bg-red-600', 'text-white'); el.classList.add('text-gray-300', 'hover:bg-gray-700', 'hover:text-white'); });
    var nav = document.querySelector('.nav-item[data-view="' + id + '"]');
    if (nav) { nav.classList.remove('text-gray-300', 'hover:bg-gray-700', 'hover:text-white'); nav.classList.add('bg-red-600', 'text-white'); }
}

function showLoading(el) {
    var target = document.querySelector(el);
    if (target) target.innerHTML = '<tr><td colspan="10" class="py-8 text-center text-gray-500"><i class="fas fa-spinner fa-spin text-xl"></i><p class="text-xs mt-2">Memuat data...</p></td></tr>';
}

function authHeaders() {
    var t = localStorage.getItem('admin_token');
    return t ? { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

function api(path, options) {
    options = options || {};
    options.headers = Object.assign(authHeaders(), options.headers || {});
    return fetch(API + path, options).then(function (r) {
        if (r.status === 429) { adminToast('Terlalu banyak permintaan, coba lagi nanti.', 'warning'); throw new Error('Rate limited'); }
        if (r.status === 401) { localStorage.removeItem('admin_token'); localStorage.removeItem('admin_user'); showView('viewLogin'); document.getElementById('sidebarNav').classList.add('hidden'); throw new Error('Unauthorized'); }
        return r.json().catch(function () { return {}; });
    }).then(function (body) {
        if (body && Array.isArray(body.data)) return body.data;
        return body;
    });
}

/* ===== DASHBOARD AUTO-REFRESH ===== */
var dashboardInterval = null;
var prevStats = {};

function loadDashboard() {
    api('/admin/stats').then(function (d) {
        var prev = prevStats;
        if (prev.orderCount !== undefined && d.orderCount > prev.orderCount) {
            adminToast(d.orderCount - prev.orderCount + ' pesanan baru masuk!', 'success');
        }
        if (prev.unreadMessages !== undefined && d.unreadMessages > prev.unreadMessages) {
            adminToast(d.unreadMessages - prev.unreadMessages + ' pesan baru!', 'info');
        }
        if (prev.todayReservations !== undefined && d.todayReservations > prev.todayReservations) {
            adminToast('Reservasi baru untuk hari ini!', 'info');
        }
        prevStats = d;
        document.getElementById('statMenu').textContent = d.menuCount;
        document.getElementById('statOrders').textContent = d.orderCount;
        document.getElementById('statPendingOrders').textContent = d.pendingOrders;
        document.getElementById('statReservations').textContent = d.reservationCount;
        document.getElementById('statTodayRes').textContent = d.todayReservations;
        document.getElementById('statMessages').textContent = d.unreadMessages;
        document.getElementById('statTestimonials').textContent = d.testimonialCount;
        document.getElementById('statGallery').textContent = d.galleryCount;
        if (document.getElementById('statNewsletter')) document.getElementById('statNewsletter').textContent = d.newsletterCount || 0;
        if (document.getElementById('statTables')) document.getElementById('statTables').textContent = d.tableCount || 0;
        if (document.getElementById('statAvailableTables')) document.getElementById('statAvailableTables').textContent = d.availableTables || 0;
    }).catch(function () {});
}

function startDashboardPoll() {
    if (dashboardInterval) clearInterval(dashboardInterval);
    dashboardInterval = setInterval(loadDashboard, 30000);
}

/* ===== LOGIN ===== */
(function () {
    if (TOKEN) {
        api('/auth/me').then(function (data) {
            if (data.username) { localStorage.setItem('admin_user', data.username); showApp(); }
        }).catch(function () {
            localStorage.removeItem('admin_token');
            showView('viewLogin');
        });
    }

    document.getElementById('loginForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var username = document.getElementById('loginUser').value;
        var password = document.getElementById('loginPass').value;
        var btn = document.getElementById('loginBtn');
        btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Masuk...';
        fetch(API + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, password: password })
        }).then(function (r) { return r.json(); }).then(function (data) {
            if (data.token) {
                localStorage.setItem('admin_token', data.token);
                localStorage.setItem('admin_user', data.username);
                showApp();
            } else {
                document.getElementById('loginError').classList.remove('hidden');
                btn.disabled = false; btn.innerHTML = 'Masuk';
            }
        }).catch(function () {
            document.getElementById('loginError').classList.remove('hidden');
            btn.disabled = false; btn.innerHTML = 'Masuk';
        });
    });

    document.getElementById('logoutBtn').addEventListener('click', function () {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        showView('viewLogin');
        document.getElementById('sidebarNav').classList.add('hidden');
        if (dashboardInterval) clearInterval(dashboardInterval);
    });
})();

function showApp() {
    document.getElementById('sidebarNav').classList.remove('hidden');
    document.getElementById('adminUser').textContent = localStorage.getItem('admin_user');
    showView('viewDashboard');
    loadDashboard();
    startDashboardPoll();
}

/* ===== MENU ===== */
var menuEditingId = null;

function loadMenu() {
    showLoading('#menuTable tbody');
    api('/menu').then(function (items) {
        var tbody = document.querySelector('#menuTable tbody');
        tbody.innerHTML = '';
        var cats = { ramen: 'Ramen', dry: 'Dry Ramen', katsu: 'Katsu', minuman: 'Minuman', topping: 'Topping' };
        items.forEach(function (m) {
            var tr = document.createElement('tr');
            tr.className = 'border-b border-gray-700 hover:bg-gray-700/50';
            tr.innerHTML = '<td class="py-2 px-3 text-xs text-gray-400">' + esc(m.id) + '</td><td class="py-2 px-3 text-sm">' + esc(m.name) + '</td><td class="py-2 px-3 text-xs text-gray-400">' + esc(cats[m.cat] || m.cat) + '</td><td class="py-2 px-3 text-sm">' + esc(m.price) + '</td><td class="py-2 px-3"><span class="' + esc(m.badgeClass) + ' text-xs">' + esc(m.badge || '-') + '</span></td><td class="py-2 px-3"><button class="text-blue-400 hover:text-blue-300 mr-2" onclick="editMenu(\'' + esc(m.id) + '\')"><i class="fas fa-edit"></i></button><button class="text-red-400 hover:text-red-300" onclick="deleteMenu(\'' + esc(m.id) + '\')"><i class="fas fa-trash"></i></button></td>';
            tbody.appendChild(tr);
        });
    });
}

function editMenu(id) {
    menuEditingId = id;
    api('/menu').then(function (items) {
        var m = items.find(function (x) { return x.id === id; });
        if (!m) return;
        document.getElementById('mmId').value = m.id;
        document.getElementById('mmId').readOnly = true;
        document.getElementById('mmCat').value = m.cat;
        document.getElementById('mmName').value = m.name;
        document.getElementById('mmPrice').value = m.price;
        document.getElementById('mmPriceNum').value = m.priceNum;
        document.getElementById('mmBadge').value = m.badge || '';
        document.getElementById('mmBadgeClass').value = m.badgeClass || '';
        document.getElementById('mmDesc').value = m.desc || '';
        document.getElementById('mmImg').value = m.img || '';
        document.getElementById('menuModalTitle').textContent = 'Edit Menu';
        document.getElementById('menuFormModal').classList.remove('hidden');
    });
}

function deleteMenu(id) {
    confirmDelete('Hapus item menu ini?', function () {
        api('/menu/' + id, { method: 'DELETE' }).then(function () { loadMenu(); adminToast('Menu berhasil dihapus', 'success'); }).catch(function () { adminToast('Gagal menghapus menu', 'error'); });
    });
}

document.getElementById('addMenuBtn').addEventListener('click', function () {
    menuEditingId = null;
    document.getElementById('mmId').value = 'm' + Date.now();
    document.getElementById('mmId').readOnly = false;
    document.getElementById('mmCat').value = 'ramen';
    document.getElementById('mmName').value = '';
    document.getElementById('mmPrice').value = '';
    document.getElementById('mmPriceNum').value = '';
    document.getElementById('mmBadge').value = '';
    document.getElementById('mmBadgeClass').value = '';
    document.getElementById('mmDesc').value = '';
    document.getElementById('mmImg').value = '';
    document.getElementById('menuModalTitle').textContent = 'Tambah Menu';
    document.getElementById('menuFormModal').classList.remove('hidden');
});

document.getElementById('menuForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    var data = {
        id: document.getElementById('mmId').value,
        cat: document.getElementById('mmCat').value,
        name: document.getElementById('mmName').value,
        price: document.getElementById('mmPrice').value,
        priceNum: parseInt(document.getElementById('mmPriceNum').value) || 0,
        badge: document.getElementById('mmBadge').value,
        badgeClass: document.getElementById('mmBadgeClass').value,
        desc: document.getElementById('mmDesc').value,
        img: document.getElementById('mmImg').value
    };
    var url = menuEditingId ? ('/menu/' + menuEditingId) : '/menu';
    var method = menuEditingId ? 'PUT' : 'POST';
    api(url, { method: method, body: JSON.stringify(data) }).then(function () {
        document.getElementById('menuFormModal').classList.add('hidden');
        loadMenu();
        adminToast(menuEditingId ? 'Menu berhasil diupdate' : 'Menu berhasil ditambah', 'success');
        btn.disabled = false; btn.innerHTML = 'Simpan';
    }).catch(function () { btn.disabled = false; btn.innerHTML = 'Simpan'; });
});

document.getElementById('menuFormCancel').addEventListener('click', function () {
    document.getElementById('menuFormModal').classList.add('hidden');
});

/* ===== ORDERS ===== */
function loadOrders() {
    showLoading('#ordersTable tbody');
    api('/orders').then(function (orders) {
        var tbody = document.querySelector('#ordersTable tbody');
        tbody.innerHTML = '';
        orders.forEach(function (o) {
            var items = JSON.parse(o.items || '[]');
            var itemsStr = items.map(function (i) { return i.name + ' x' + i.qty; }).join(', ');
            var statusBadge = { pending: 'bg-yellow-600', confirmed: 'bg-blue-600', completed: 'bg-green-600', cancelled: 'bg-red-600' };
            var pmtBadge = { pending: 'bg-yellow-600', success: 'bg-green-600', failed: 'bg-red-600', refund: 'bg-purple-600', denied: 'bg-red-600' };
            var pmtStatus = o.payment_status || '';
            var pmtHtml = pmtStatus ? '<span class="' + esc(pmtBadge[pmtStatus] || 'bg-gray-600') + ' text-white text-xs px-2 py-0.5 rounded">' + esc(pmtStatus) + '</span>' : '<span class="text-gray-500 text-xs">-</span>';
            var tr = document.createElement('tr');
            tr.className = 'border-b border-gray-700 hover:bg-gray-700/50';
            tr.innerHTML = '<td class="py-2 px-3 text-xs">#' + esc(o.id) + '</td><td class="py-2 px-3 text-xs max-w-[200px] truncate">' + esc(itemsStr) + '</td><td class="py-2 px-3 text-sm">Rp ' + (o.total || 0).toLocaleString('id-ID') + '</td><td class="py-2 px-3 text-xs text-gray-400">' + esc(o.customer_name || '-') + '<br>' + esc(o.customer_phone || '') + '</td><td class="py-2 px-3">' + pmtHtml + '</td><td class="py-2 px-3"><span class="' + esc(statusBadge[o.status] || 'bg-gray-600') + ' text-white text-xs px-2 py-0.5 rounded">' + esc(o.status) + '</span></td><td class="py-2 px-3 text-xs text-gray-400">' + esc(o.created_at) + '</td><td class="py-2 px-3"><select class="bg-gray-700 text-white text-xs rounded px-1 py-0.5 border border-gray-600" onchange="updateOrderStatus(' + esc(o.id) + ', this.value)"><option value="pending" ' + (o.status === 'pending' ? 'selected' : '') + '>Pending</option><option value="confirmed" ' + (o.status === 'confirmed' ? 'selected' : '') + '>Confirmed</option><option value="completed" ' + (o.status === 'completed' ? 'selected' : '') + '>Completed</option><option value="cancelled" ' + (o.status === 'cancelled' ? 'selected' : '') + '>Cancelled</option></select></td>';
            tbody.appendChild(tr);
        });
    });
}

function updateOrderStatus(id, status) {
    api('/orders/' + id, { method: 'PUT', body: JSON.stringify({ status: status }) }).then(function () { adminToast('Status pesanan diupdate', 'success'); }).catch(function () { adminToast('Gagal update status', 'error'); });
}

/* ===== RESERVATIONS ===== */
function loadReservations() {
    showLoading('#reservationsTable tbody');
    api('/reservations').then(function (items) {
        var tbody = document.querySelector('#reservationsTable tbody');
        tbody.innerHTML = '';
        items.forEach(function (r) {
            var statusBadge = { pending: 'bg-yellow-600', confirmed: 'bg-blue-600', completed: 'bg-green-600', cancelled: 'bg-red-600' };
            var tableHtml = r.table_number ? esc(r.table_number) : '<button class="text-blue-400 hover:text-blue-300 text-xs" onclick="openAssignTable(' + esc(r.id) + ')"><i class="fas fa-chair"></i> Assign</button>';
            var tr = document.createElement('tr');
            tr.className = 'border-b border-gray-700 hover:bg-gray-700/50';
            tr.innerHTML = '<td class="py-2 px-3 text-xs">#' + esc(r.id) + '</td><td class="py-2 px-3 text-sm">' + esc(r.name) + '</td><td class="py-2 px-3 text-xs text-gray-400">' + esc(r.phone) + '</td><td class="py-2 px-3 text-sm">' + esc(r.guests) + '</td><td class="py-2 px-3 text-xs">' + esc(r.date) + ' ' + esc(r.time) + '</td><td class="py-2 px-3 text-xs">' + tableHtml + '</td><td class="py-2 px-3"><span class="' + esc(statusBadge[r.status] || 'bg-gray-600') + ' text-white text-xs px-2 py-0.5 rounded">' + esc(r.status) + '</span></td><td class="py-2 px-3 text-xs text-gray-400">' + esc(r.created_at) + '</td><td class="py-2 px-3"><select class="bg-gray-700 text-white text-xs rounded px-1 py-0.5 border border-gray-600" onchange="updateReservationStatus(' + esc(r.id) + ', this.value)"><option value="pending" ' + (r.status === 'pending' ? 'selected' : '') + '>Pending</option><option value="confirmed" ' + (r.status === 'confirmed' ? 'selected' : '') + '>Confirmed</option><option value="completed" ' + (r.status === 'completed' ? 'selected' : '') + '>Completed</option><option value="cancelled" ' + (r.status === 'cancelled' ? 'selected' : '') + '>Cancelled</option></select></td>';
            tbody.appendChild(tr);
        });
    });
}

function updateReservationStatus(id, status) {
    api('/reservations/' + id, { method: 'PUT', body: JSON.stringify({ status: status }) }).then(function () { adminToast('Status reservasi diupdate', 'success'); }).catch(function () { adminToast('Gagal update status', 'error'); });
}

var assignReservationId = null;

function openAssignTable(id) {
    assignReservationId = id;
    document.getElementById('assignReservationInfo').textContent = 'Reservasi #' + id;
    var select = document.getElementById('assignTableSelect');
    select.innerHTML = '<option value="">Memuat meja...</option>';
    document.getElementById('tableAssignModal').classList.remove('hidden');
    api('/tables/available').then(function (tables) {
        select.innerHTML = '<option value="">-- Pilih Meja --</option>';
        tables.forEach(function (t) {
            var opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.number + ' (' + t.capacity + ' kursi, ' + t.location + ')';
            select.appendChild(opt);
        });
    }).catch(function () {
        select.innerHTML = '<option value="">Gagal memuat meja</option>';
    });
}

document.getElementById('assignTableConfirmBtn').addEventListener('click', function () {
    var tableId = document.getElementById('assignTableSelect').value;
    if (!tableId) { adminToast('Pilih meja terlebih dahulu', 'warning'); return; }
    api('/reservations/' + assignReservationId, { method: 'PUT', body: JSON.stringify({ status: 'confirmed', table_id: parseInt(tableId) }) }).then(function () {
        document.getElementById('tableAssignModal').classList.add('hidden');
        loadReservations();
        adminToast('Meja berhasil diassign', 'success');
    }).catch(function () {
        adminToast('Gagal assign meja', 'error');
    });
});

document.getElementById('assignTableCancelBtn').addEventListener('click', function () {
    document.getElementById('tableAssignModal').classList.add('hidden');
    assignReservationId = null;
});

/* ===== CONTACT MESSAGES ===== */
function loadMessages() {
    showLoading('#messagesTable tbody');
    api('/contact').then(function (items) {
        var tbody = document.querySelector('#messagesTable tbody');
        tbody.innerHTML = '';
        items.forEach(function (m) {
            var tr = document.createElement('tr');
            tr.className = 'border-b border-gray-700 hover:bg-gray-700/50' + (m.status === 'unread' ? ' font-bold' : '');
            tr.innerHTML = '<td class="py-2 px-3 text-xs">#' + esc(m.id) + '</td><td class="py-2 px-3 text-sm">' + esc(m.name) + '</td><td class="py-2 px-3 text-xs text-gray-400">' + esc(m.phone || '-') + '</td><td class="py-2 px-3 text-sm max-w-[250px] truncate" title="' + esc(m.message) + '">' + esc(m.message) + '</td><td class="py-2 px-3"><span class="' + (m.status === 'unread' ? 'bg-yellow-600' : 'bg-green-600') + ' text-white text-xs px-2 py-0.5 rounded">' + esc(m.status) + '</span></td><td class="py-2 px-3 text-xs text-gray-400">' + esc(m.created_at) + '</td><td class="py-2 px-3"><button class="text-green-400 hover:text-green-300 text-xs mr-2" onclick="markRead(' + esc(m.id) + ')"><i class="fas fa-check"></i></button><button class="text-red-400 hover:text-red-300 text-xs" onclick="deleteMessage(' + esc(m.id) + ')"><i class="fas fa-trash"></i></button></td>';
            tbody.appendChild(tr);
        });
    });
}

function markRead(id) {
    api('/contact/' + id, { method: 'PUT', body: JSON.stringify({ status: 'read' }) }).then(function () { loadMessages(); loadDashboard(); adminToast('Pesan ditandai sudah dibaca', 'success'); });
}

function deleteMessage(id) {
    confirmDelete('Hapus pesan ini?', function () {
        api('/contact/' + id, { method: 'DELETE' }).then(function () { loadMessages(); adminToast('Pesan berhasil dihapus', 'success'); }).catch(function () { adminToast('Gagal hapus pesan', 'error'); });
    });
}

/* ===== TESTIMONIALS ===== */
var testimonialEditingId = null;

function loadTestimonials() {
    showLoading('#testimonialsTable tbody');
    api('/testimonials').then(function (items) {
        var tbody = document.querySelector('#testimonialsTable tbody');
        tbody.innerHTML = '';
        items.forEach(function (t) {
            var stars = '';
            for (var i = 0; i < 5; i++) { stars += i < t.rating ? '<i class="fas fa-star text-yellow-400 text-xs"></i>' : '<i class="far fa-star text-yellow-400 text-xs"></i>'; }
            var tr = document.createElement('tr');
            tr.className = 'border-b border-gray-700 hover:bg-gray-700/50';
            tr.innerHTML = '<td class="py-2 px-3 text-xs">#' + esc(t.id) + '</td><td class="py-2 px-3 text-sm">' + esc(t.author) + '</td><td class="py-2 px-3 text-xs text-gray-400">' + esc(t.role || '-') + '</td><td class="py-2 px-3 text-xs">' + stars + '</td><td class="py-2 px-3 text-sm max-w-[200px] truncate">' + esc(t.text || '') + '</td><td class="py-2 px-3"><button class="text-blue-400 hover:text-blue-300 mr-2" onclick="editTestimonial(' + esc(t.id) + ')"><i class="fas fa-edit"></i></button><button class="text-red-400 hover:text-red-300" onclick="deleteTestimonial(' + esc(t.id) + ')"><i class="fas fa-trash"></i></button></td>';
            tbody.appendChild(tr);
        });
    });
}

function editTestimonial(id) {
    testimonialEditingId = id;
    api('/testimonials').then(function (items) {
        var t = items.find(function (x) { return x.id === id; });
        if (!t) return;
        document.getElementById('tmAuthor').value = t.author;
        document.getElementById('tmRole').value = t.role || '';
        document.getElementById('tmDate').value = t.date || '';
        document.getElementById('tmRating').value = t.rating;
        document.getElementById('tmTitle').value = t.title || '';
        document.getElementById('tmText').value = t.text || '';
        document.getElementById('tmReply').value = t.ownerReply || '';
        document.getElementById('testiModalTitle').textContent = 'Edit Testimoni';
        document.getElementById('testiFormModal').classList.remove('hidden');
    });
}

function deleteTestimonial(id) {
    confirmDelete('Hapus testimoni ini?', function () {
        api('/testimonials/' + id, { method: 'DELETE' }).then(function () { loadTestimonials(); adminToast('Testimoni berhasil dihapus', 'success'); }).catch(function () { adminToast('Gagal hapus testimoni', 'error'); });
    });
}

document.getElementById('addTestiBtn').addEventListener('click', function () {
    testimonialEditingId = null;
    document.getElementById('tmAuthor').value = '';
    document.getElementById('tmRole').value = '';
    document.getElementById('tmDate').value = '';
    document.getElementById('tmRating').value = '5';
    document.getElementById('tmTitle').value = '';
    document.getElementById('tmText').value = '';
    document.getElementById('tmReply').value = '';
    document.getElementById('testiModalTitle').textContent = 'Tambah Testimoni';
    document.getElementById('testiFormModal').classList.remove('hidden');
});

document.getElementById('testiForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    var author = document.getElementById('tmAuthor').value;
    var data = {
        author: author,
        initial: author ? author[0] : '?',
        role: document.getElementById('tmRole').value,
        date: document.getElementById('tmDate').value,
        rating: parseInt(document.getElementById('tmRating').value) || 5,
        title: document.getElementById('tmTitle').value,
        text: document.getElementById('tmText').value,
        ownerReply: document.getElementById('tmReply').value
    };
    var url = testimonialEditingId ? ('/testimonials/' + testimonialEditingId) : '/testimonials';
    var method = testimonialEditingId ? 'PUT' : 'POST';
    api(url, { method: method, body: JSON.stringify(data) }).then(function () {
        document.getElementById('testiFormModal').classList.add('hidden');
        loadTestimonials();
        adminToast(testimonialEditingId ? 'Testimoni diupdate' : 'Testimoni ditambah', 'success');
        btn.disabled = false; btn.innerHTML = 'Simpan';
    }).catch(function () { btn.disabled = false; btn.innerHTML = 'Simpan'; });
});

document.getElementById('testiFormCancel').addEventListener('click', function () {
    document.getElementById('testiFormModal').classList.add('hidden');
});

/* ===== GALLERY ===== */
var galleryEditingId = null;

function loadGallery() {
    showLoading('#galleryTable tbody');
    api('/gallery').then(function (items) {
        var tbody = document.querySelector('#galleryTable tbody');
        tbody.innerHTML = '';
        items.forEach(function (g) {
            var tr = document.createElement('tr');
            tr.className = 'border-b border-gray-700 hover:bg-gray-700/50';
            tr.innerHTML = '<td class="py-2 px-3 text-xs">#' + esc(g.id) + '</td><td class="py-2 px-3"><img src="' + esc(g.src) + '" class="w-16 h-10 object-cover rounded" alt="" loading="lazy"></td><td class="py-2 px-3 text-sm max-w-[200px] truncate">' + esc(g.alt || '-') + '</td><td class="py-2 px-3 text-xs text-gray-400">' + esc(g.sort_order) + '</td><td class="py-2 px-3"><button class="text-blue-400 hover:text-blue-300 mr-2" onclick="editGallery(' + esc(g.id) + ')"><i class="fas fa-edit"></i></button><button class="text-red-400 hover:text-red-300" onclick="deleteGallery(' + esc(g.id) + ')"><i class="fas fa-trash"></i></button></td>';
            tbody.appendChild(tr);
        });
    });
}

function editGallery(id) {
    galleryEditingId = id;
    api('/gallery').then(function (items) {
        var g = items.find(function (x) { return x.id === id; });
        if (!g) return;
        document.getElementById('glSrc').value = g.src;
        document.getElementById('glAlt').value = g.alt || '';
        document.getElementById('glOrder').value = g.sort_order || 0;
        document.getElementById('galleryModalTitle').textContent = 'Edit Galeri';
        document.getElementById('galleryFormModal').classList.remove('hidden');
    });
}

function deleteGallery(id) {
    confirmDelete('Hapus gambar ini?', function () {
        api('/gallery/' + id, { method: 'DELETE' }).then(function () { loadGallery(); adminToast('Gambar berhasil dihapus', 'success'); }).catch(function () { adminToast('Gagal hapus gambar', 'error'); });
    });
}

document.getElementById('addGalleryBtn').addEventListener('click', function () {
    galleryEditingId = null;
    document.getElementById('glSrc').value = '';
    document.getElementById('glAlt').value = '';
    document.getElementById('glOrder').value = '0';
    document.getElementById('galleryModalTitle').textContent = 'Tambah Galeri';
    document.getElementById('galleryFormModal').classList.remove('hidden');
});

document.getElementById('galleryForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    var data = {
        src: document.getElementById('glSrc').value,
        alt: document.getElementById('glAlt').value,
        sort_order: parseInt(document.getElementById('glOrder').value) || 0
    };
    var url = galleryEditingId ? ('/gallery/' + galleryEditingId) : '/gallery';
    var method = galleryEditingId ? 'PUT' : 'POST';
    api(url, { method: method, body: JSON.stringify(data) }).then(function () {
        document.getElementById('galleryFormModal').classList.add('hidden');
        loadGallery();
        adminToast(galleryEditingId ? 'Galeri diupdate' : 'Galeri ditambah', 'success');
        btn.disabled = false; btn.innerHTML = 'Simpan';
    }).catch(function () { btn.disabled = false; btn.innerHTML = 'Simpan'; });
});

document.getElementById('galleryFormCancel').addEventListener('click', function () {
    document.getElementById('galleryFormModal').classList.add('hidden');
});

/* ===== TABLES ===== */
var tableEditingId = null;

function loadTables() {
    showLoading('#tablesTable tbody');
    api('/tables').then(function (items) {
        var tbody = document.querySelector('#tablesTable tbody');
        tbody.innerHTML = '';
        var statusColors = { available: 'bg-green-600', occupied: 'bg-red-600', reserved: 'bg-blue-600', maintenance: 'bg-yellow-600' };
        items.forEach(function (t) {
            var tr = document.createElement('tr');
            tr.className = 'border-b border-gray-700 hover:bg-gray-700/50';
            tr.innerHTML = '<td class="py-2 px-3 text-xs text-gray-400">#' + esc(t.id) + '</td><td class="py-2 px-3 text-sm font-medium">' + esc(t.number) + '</td><td class="py-2 px-3 text-sm">' + esc(t.capacity) + '</td><td class="py-2 px-3 text-xs text-gray-400">' + esc(t.location || '-') + '</td><td class="py-2 px-3"><span class="' + esc(statusColors[t.status] || 'bg-gray-600') + ' text-white text-xs px-2 py-0.5 rounded">' + esc(t.status) + '</span></td><td class="py-2 px-3"><button class="text-blue-400 hover:text-blue-300 mr-2" onclick="editTable(' + esc(t.id) + ')"><i class="fas fa-edit"></i></button><button class="text-red-400 hover:text-red-300" onclick="deleteTable(' + esc(t.id) + ')"><i class="fas fa-trash"></i></button></td>';
            tbody.appendChild(tr);
        });
    });
}

function editTable(id) {
    tableEditingId = id;
    api('/tables').then(function (items) {
        var t = items.find(function (x) { return x.id === id; });
        if (!t) return;
        document.getElementById('tmNumber').value = t.number;
        document.getElementById('tmCapacity').value = t.capacity;
        document.getElementById('tmLocation').value = t.location || 'Indoor';
        document.getElementById('tmStatus').value = t.status || 'available';
        document.getElementById('tableModalTitle').textContent = 'Edit Meja';
        document.getElementById('tableFormModal').classList.remove('hidden');
    });
}

function deleteTable(id) {
    confirmDelete('Hapus meja ini?', function () {
        api('/tables/' + id, { method: 'DELETE' }).then(function () { loadTables(); adminToast('Meja berhasil dihapus', 'success'); }).catch(function () { adminToast('Gagal menghapus meja', 'error'); });
    });
}

document.getElementById('addTableBtn').addEventListener('click', function () {
    tableEditingId = null;
    document.getElementById('tmNumber').value = '';
    document.getElementById('tmCapacity').value = '2';
    document.getElementById('tmLocation').value = 'Indoor';
    document.getElementById('tmStatus').value = 'available';
    document.getElementById('tableModalTitle').textContent = 'Tambah Meja';
    document.getElementById('tableFormModal').classList.remove('hidden');
});

document.getElementById('tableForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    var data = {
        number: document.getElementById('tmNumber').value,
        capacity: parseInt(document.getElementById('tmCapacity').value) || 2,
        location: document.getElementById('tmLocation').value,
        status: document.getElementById('tmStatus').value
    };
    var url = tableEditingId ? ('/tables/' + tableEditingId) : '/tables';
    var method = tableEditingId ? 'PUT' : 'POST';
    api(url, { method: method, body: JSON.stringify(data) }).then(function () {
        document.getElementById('tableFormModal').classList.add('hidden');
        loadTables();
        adminToast(tableEditingId ? 'Meja berhasil diupdate' : 'Meja berhasil ditambah', 'success');
        btn.disabled = false; btn.innerHTML = 'Simpan';
    }).catch(function (err) {
        if (err && err.error) adminToast(err.error, 'error');
        else adminToast('Gagal menyimpan meja', 'error');
        btn.disabled = false; btn.innerHTML = 'Simpan';
    });
});

document.getElementById('tableFormCancel').addEventListener('click', function () {
    document.getElementById('tableFormModal').classList.add('hidden');
});

/* ===== NAVIGATION ===== */
document.querySelectorAll('.nav-item').forEach(function (el) {
    el.addEventListener('click', function () {
        var view = el.dataset.view;
        showView(view);
        if (view === 'viewDashboard') loadDashboard();
        if (view === 'viewMenu') loadMenu();
        if (view === 'viewOrders') loadOrders();
        if (view === 'viewReservations') loadReservations();
        if (view === 'viewMessages') loadMessages();
        if (view === 'viewTestimonials') loadTestimonials();
        if (view === 'viewGallery') loadGallery();
        if (view === 'viewTables') loadTables();
    });
});

document.getElementById('hamburgerAdmin').addEventListener('click', function () {
    document.getElementById('sidebarNav').classList.toggle('-translate-x-full');
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        document.getElementById('deleteModal').classList.add('hidden');
        document.getElementById('tableFormModal').classList.add('hidden');
        document.getElementById('tableAssignModal').classList.add('hidden');
        deleteCallback = null;
    }
});
