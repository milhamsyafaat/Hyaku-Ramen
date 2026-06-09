# Hyaku Ramen — Website UMKM Restoran Ramen

Dibuat untuk membantu Hyaku Ramen (restoran ramen di Kukusan, Depok) punya
kehadiran digital — pelanggan bisa lihat menu, reservasi meja, order, dan
hubungi restoran lewat WhatsApp. Ada panel admin buat ngelola data.

## Fitur

| Fitur | Penjelasan |
|-------|-----------|
| **Menu Digital** | Pelanggan lihat menu + harga + gambar. Data fallback lokal jadi tetep tampil walau server mati. |
| **Order Online** | Pelanggan pilih menu -> masukin data -> otomatis notif ke WA restoran. Bisa bayar pake QRIS/transfer/e-wallet lewat Midtrans. |
| **Reservasi Meja** | Pelanggan booking meja -> admin liat di dashboard. Ada 10 meja (indoor & outdoor). |
| **Kontak** | Form pesan buat pelanggan yang pengen tanya-tanya. |
| **WhatsApp** | Semua form (order & reservasi) juga otomatis buka WhatsApp biar admin langsung liat. Nomor WA sumber dari database, fallback dari file JS. |
| **Admin Panel** | Dashboard buat liat statistik, CRUD menu/order/reservasi/testimoni/galeri/meja/WA number, rekap penjualan, reset data. |
| **Dark Mode** | Website bisa diganti tema gelap/terang, kesimpen di localStorage. |
| **Pembayaran Online** | Integrasi Midtrans — support QRIS, e-wallet, transfer bank via Snap popup. |

## Cara Jalanin

```bash
cd backend
npm install
npm start
```

Buka `http://localhost:3001` — backend langsung serve frontend & admin.

Login admin: `admin` / `admin123` (buka `http://localhost:3001/admin/`).

## Arsitektur (3 Bagian)

```
                         ┌──────────────────────┐
                         │    GitHub Pages        │
                         │  ┌──────────────────┐  │
                         │  │    Frontend       │  │
                         │  │ (landing page)    │  │
                         │  └────────┬─────────┘  │
                         │  ┌──────────────────┐  │
                         │  │     Admin        │  │
                         │  │ (dashboard SPA)   │  │
                         │  └────────┬─────────┘  │
                         └───────────┼────────────┘
                                     │ (Cloudflare Proxy)
                         ┌───────────▼────────────┐
                         │   Backend API Server   │
                         │   (Node.js + Express)  │
                         │   ┌────────────────┐   │
                         │   │   SQLite DB    │   │
                         │   └────────────────┘   │
                         │   Midtrans │ Nodemailer │
                         └────────────────────────┘
```

1. **Frontend** (`frontend/`) — Halaman yang dilihat pelanggan. HTML + Tailwind CSS (CDN) + Font Awesome (CDN) + JavaScript vanilla (ES5). Gausah build, tinggal buka.
2. **Backend** (`backend/`) — API server Express + SQLite. Yang ngatur logic: nyimpen order, reservasi, dll. Juga serve frontend & admin statis.
3. **Admin** (`admin/`) — Panel buat pemilik restoran. SPA vanilla JS. Akses pake JWT (login: admin/admin123).

## Tech Stack (Kenapa Pilih Ini?)

| Teknologi | Alasan |
|-----------|--------|
| **Node.js >=22 + Express** | Backend ringan, cocok buat skala UMKM. Setup gampang. |
| **SQLite (`node:sqlite`)** | Zero-config — gausah install database server. File db otomatis kebikin + keisi data contoh pertama kali jalan. |
| **Tailwind CSS v3 CDN** | Biar tampilan cepet rapi tanpa ribet ngatur CSS manual. Gausah build karena pake CDN. |
| **Midtrans** | Payment gateway populer di Indonesia. Support QRIS, e-wallet, transfer bank. |
| **JWT (JSON Web Token)** | Biar admin panel aman — cuma yang punya token bisa akses. |
| **Helmet + Rate Limiting** | Keamanan standar: proteksi header HTTP + batasi percobaan login/form biar gada spam. |

## Cara Kerja Fitur Utama

### Order + Pembayaran
1. Pelanggan pilih menu (ada 14 item: ramen, dry ramen, katsu, minuman, topping).
2. Isi nama + kontak -> submit.
3. Data masuk ke database, notifikasi WA + email ke restoran.
4. Kalo Midtrans aktif, pelanggan bisa bayar lewat popup Snap.
5. Midtrans kirim notifikasi ke backend -> status order otomatis ke-update.

### Reservasi
1. Pelanggan isi nama, no HP, jumlah tamu, tanggal, jam.
2. Notif WA ke restoran + email.
3. Admin bisa assign meja dan ubah status (pending/confirmed/cancelled).

### WhatsApp
- Semua form (order & reservasi) juga buka WhatsApp biar admin liat langsung.
- Nomor WA sumbernya dari database (`wa_numbers` table). Kalo server mati, pake nomor fallback yang udah disimpen di file JS.

## Keamanan

- **Input difilter** — karakter berbahaya kayak `<script>` di-encode biar gada XSS.
- **Login pake JWT** — token expired 24 jam, kalo gada token gabisa akses admin.
- **Rate limiting** (aktif di production) — maksimal 5 kali percobaan login dalam 15 menit, 100 request API per 15 menit.
- **Helmet** — pasang HTTP security headers otomatis.

## Deployment

| Bagian | Cara Deploy |
|--------|-------------|
| **Frontend** | Push ke branch `main` -> GitHub Actions upload `frontend/` ke GitHub Pages. |
| **Backend** | Manual ke VPS pake `Procfile` (`cd backend && npm install && node index.js`) atau Docker. |
| **Admin** | GitHub Pages subdomain, akses API lewat Cloudflare proxy. |

---

