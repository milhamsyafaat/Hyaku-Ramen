# Hyaku Ramen

| Folder | Deploy | Tech |
|--------|--------|------|
| `frontend/` | GitHub Pages | Vanilla HTML + Tailwind v3 CDN + FA6.4 + ES5 JS |
| `backend/` | VPS (Procfile) | Node >=22 + Express + `node:sqlite` |
| `admin/` | GitHub Pages subdomain | ES5 SPA, calls API via Cloudflare proxy |

## Quick start

```bash
cd backend && npm install && npm start  # http://localhost:3001
# npm run dev is identical (same script)
```

Express serves `frontend/` and `admin/` statically in both dev & prod. The `isDev` branch at `backend/index.js:40-63` is a no-op — identical code in both branches.

## Frontend — no build

Tailwind v3 via CDN. Load order: `images.js` → `data.js` → `script.js`.  
`images.js` provides `IMG_*`, `GAL_*`, `WA_NUMBER`, `WA_NUMBER_TESTER` globals.  
`data.js` provides `MENU_DATA`, `GALLERY_DATA`, `TESTIMONIALS` (fallbacks when API is down).

DOM helpers: `$('#id')`, `qs()`, `qa()` in `frontend/script.js:2-4`.  
`esc()` (at `script.js:7-10` and `admin/app.js:5-8`) for XSS-safe HTML.

## Backend

**DB** (`backend/db.js`): `node:sqlite` `DatabaseSync` (sync API). DB at `backend/data/hyaku.db`, auto-created + seeded on first start. Exports `getDb()`, `initialize()`, `validate()`, `sanitize()`, `resetData()`.

**Rate limiting** (15-min windows): `/api/*` 100 req (admin routes excluded), `/api/auth/login` 5 req, `/api/{contact,reservations,orders}` 10 req.

**Routes**: 13 files in `backend/routes/*.js` mounted at `backend/index.js:26-38`.

**JWT** (`backend/middleware/auth.js`): requires `JWT_SECRET` env in production; dev fallback `'hyaku-ramen-dev-secret'`. 24h expiry.

**Default admin**: `admin` / `admin123` (auto-seeded on first start, logged at startup).

**`.env`** (`backend/.env`, gitignored): `JWT_SECRET`, `MIDTRANS_*`, `MIDTRANS_IS_PRODUCTION`, `SMTP_*`, `ADMIN_EMAIL`. Template exists, but no `dotenv` loader — set vars in the runtime environment or shell.

**Optional services**: Midtrans payments (`backend/services/midtrans.js`), nodemailer (`backend/services/email.js`). Notif endpoint: `POST /api/payments/notification`.

**Unused deps** (never imported): `pg`, `http-proxy-middleware`.

**Only scripts**: `start`/`dev` (both `node index.js`). No lint/test/typecheck.

## Gotchas

- **Image URLs duplicated** in `frontend/images.js` and `backend/db.js` (same `IMG_*`/`GAL_*` vars). Update both.
- **`GAL_2` and `GAL_3` in `images.js` share the same URL** — likely a copy-paste bug.
- **Phone `6285174074352` hardcoded** in `href="tel:"` at `frontend/index.html:222,276` — update when changing WA number.
- **Forms POST to `/api/*`** AND open WhatsApp via `openWaSelection()`. Some fetches (e.g. `/api/wa-numbers/active`, `/api/config`) are fire-and-forget (`.catch(function() {})`).
- **Root `package-lock.json` is stale** — `backend/package.json` is the real manifest.
- `admin/app.js` has its own copy of `esc()` (same implementation as frontend).
- **Midtrans Snap URL hardcoded to sandbox** in `frontend/script.js:729`; `MIDTRANS_IS_PRODUCTION` only affects server-side (`backend/services/midtrans.js:6`).
- **`TODO.md` is stale** — claims admin password was changed to `Hyakuadmin`, but code still seeds `admin123` (`backend/db.js:60`).

## WhatsApp numbers

Source of truth: `wa_numbers` table (CRUD via Admin → WhatsApp tab). Frontend fetches from `/api/config`; fallback = `WA_NUMBER`/`WA_NUMBER_TESTER` from `images.js`. All WA links use `openWaSelection()` modal in `script.js:47`.

## Data

**Menu** cats: `ramen`/`dry`/`katsu`/`minuman`/`topping`. Fields: `id`, `cat`, `name`, `price` (display), `priceNum` (numeric), `badge`, `badgeClass`, `desc`, `img`.

**Tables**: 10 (Meja 1-10), capacity 2/4/6, location Indoor/Outdoor.

**localStorage keys**: `cart`, `admin_token` (JWT), `admin_user`, `theme` (dark mode), `saved` (bookmark), `newsletter_email`.

## Deploy

**Procfile** (root): `cd backend && npm install && node index.js` — npm install runs at deploy time.

**Docker** (`backend/Dockerfile`): Node 22 Alpine, serves all 3 folders. Build with `docker build -f backend/Dockerfile .`

**CI** (`.github/workflows/deploy.yml`): push to `main` → uploads only `frontend/` to GitHub Pages.
