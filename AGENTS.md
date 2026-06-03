# Hyaku Ramen — Monorepo

3 bagian terpisah dalam 1 repo:

| Folder | Hosting |
|--------|---------|
| `frontend/` | GitHub Pages |
| `backend/` | VPS (API server) |
| `admin/` | GitHub Pages (subdomain) |

**Frontend**: Vanilla HTML + Tailwind v3 CDN + FontAwesome 6.4 CDN + Inter (GFonts) + ES5 JS.  
**Backend**: Node.js >=22 + Express + built-in `node:sqlite`.  
**Admin SPA**: ES5 JS, calls API via Cloudflare proxy.

```bash
cd backend
npm install
npm start      # node index.js → http://localhost:3001
npm run dev    # identical to start
```

## ES5 frontend, no build step

- `var`, function expressions, no arrow functions, no modules, no imports.
- Every feature is a standalone IIFE in `frontend/script.js`.
- DOM helpers (`frontend/script.js:2-4`): `$('#id')` = `getElementById`, `qs()`/`qa()` = querySelector/All.
- `esc()` (`frontend/script.js:7-10`) for XSS-safe HTML — use it for all user-generated content.

## JS load order (frontend/index.html)

1. `images.js` — image URL variables (`IMG_*`, `GAL_*`, `WA_NUMBER`)
2. `data.js` — static data arrays (`MENU_DATA`, `GALLERY_DATA`, `TESTIMONIALS`) — API fallback
3. `script.js` — all logic

## Backend

`backend/index.js` — pure API server. In dev (`NODE_ENV !== 'production'`) it also serves static frontend/admin files. In production, only API routes respond; everything else returns 404.

**DB**: built-in `node:sqlite` (`DatabaseSync` — Node 22+). Sync API (`db.prepare().get()`, `db.prepare().run()`). DB at `backend/data/hyaku.db`, auto-created + seeded on first start. `backend/data/*.db*` gitignored. `backend/db.js` exports `getDb()`, `initialize()`, `validate(schema, data)`, and `sanitize(str)`. Seed data (`menuData`, `galleryData`, `testimonialData`, `tableData`) is module-scoped inside `backend/db.js`.

**`backend/db.js` has its own copies of image URL variables** (`IMG_*`, `GAL_*`). If you update `frontend/images.js`, update `backend/db.js` too.

**Default admin credentials**: `admin` / `HyakuAdmin123!` (created on first start, printed in dev console).

**JWT auth** (`backend/middleware/auth.js`): `JWT_SECRET` env var required in production; dev falls back to `'hyaku-ramen-dev-secret'`. Tokens expire in 24h.

**`.env` is a template** (gitignored, in `backend/`) — no `dotenv` package, set env vars manually. Keys: `JWT_SECRET`, `MIDTRANS_*` (optional), `SMTP_*` (optional), `ADMIN_EMAIL`.

**Helmet**: disabled CSP + crossOriginEmbedderPolicy (`backend/index.js:11`).

**Midtrans payments** (`backend/services/midtrans.js`): optional, requires `MIDTRANS_SERVER_KEY`/`MIDTRANS_CLIENT_KEY` env vars. Payment notifications at `POST /api/payments/notification`.

**Email** (`backend/services/email.js`): optional via nodemailer. Requires `SMTP_*` env vars.

**Rate limiting** (all 15-min windows): `/api/*` 100 req, `/api/auth/login` 5 req, form endpoints (`/api/contact`, `/api/reservations`, `/api/orders`) 10 req each.

**Unused dep**: `pg` in `backend/package.json` is listed but never imported — the app uses `node:sqlite` only.

## API

Endpoints in `backend/routes/*.js`. Render functions fetch from API, fall back to globals (`MENU_DATA`, `GALLERY_DATA`, `TESTIMONIALS`).

Forms POST to `/api/*` (fire-and-forget, `.catch(function() {})`) **and** open WhatsApp in a new tab.

## WhatsApp number

`+6285174074352` is hardcoded in 7 hrefs across `frontend/index.html` + used via `WA_NUMBER` in 4 spots in `frontend/script.js` (lines 274, 563, 590, 723). `frontend/images.js` defines `WA_NUMBER` (digits only) used by `script.js` for WhatsApp links; `frontend/index.html` has its own raw `+6285174074352` hrefs. Always update **both** the `WA_NUMBER` var **and** all 7 raw `tel:`/`wa.me/` hrefs in `frontend/index.html`.

## Local storage keys

`cart` (cart array), `admin_token` (JWT), `admin_user` (username), `theme` (dark mode), `saved` (bookmark), `newsletter_email`.

## Key data structures

**Menu** categories: `ramen`/`dry`/`katsu`/`minuman`/`topping`. Fields: `id`, `cat`, `name`, `price` (display string), `priceNum` (numeric for cart), `badge`, `badgeClass`, `desc`, `img` (empty = icon placeholder).

Seed data in `backend/db.js` (`menuData`, `galleryData`, `testimonialData`, `tableData`). After seeding, manage via admin panel.

**Tables** (`tableData`): 10 tables, `number` (Meja 1-10), `capacity` (2/4/6), `location` (Indoor/Outdoor).

## Admin SPA

`admin/index.html` (shell), `admin/app.js` (logic), `admin/style.css`. All API calls use JWT from `localStorage.admin_token`.

## External assets only

Images from `images.unsplash.com` (one DuckDuckGo image for Katsu Curry). Fonts from Google Fonts CDN. No local image files.

## No test/lint/typecheck suite

`backend/package.json` only has `start` and `dev` (both: `node index.js`). No test framework, no linter, no type checker.
