# Hyaku Ramen — Monorepo

| Folder | Hosting | Tech |
|--------|---------|------|
| `frontend/` | GitHub Pages | Vanilla HTML + Tailwind v3 CDN + FA6.4 + ES5 JS |
| `backend/` | VPS (Procfile) | Node >=22 + Express + `node:sqlite` |
| `admin/` | GitHub Pages (subdomain) | ES5 SPA, calls API via Cloudflare proxy |

```bash
cd backend && npm install && npm start  # http://localhost:3001
# npm run dev is identical to start
```

## ES5 frontend, no build

DOM helpers (`frontend/script.js:2-4`): `$('#id')`, `qs()`/`qa()`.  
`esc()` (`script.js:7-10`) for XSS-safe HTML — use on all user-generated content.

Load order (`frontend/index.html:699-701`): **images.js** → **data.js** → **script.js**.  
`images.js` defines `IMG_*`, `GAL_*`, `WA_NUMBER` globals.  
`data.js` defines `MENU_DATA`, `GALLERY_DATA`, `TESTIMONIALS` (API fallback).

## Backend

`index.js` serves API routes + static frontend/admin files in both dev and production (branches are identical at `index.js:42-65`).

Rate limiting (15-min windows): `/api/*` 100 req, `/api/auth/login` 5 req, form endpoints 10 req.

**DB** (`backend/db.js`): built-in `node:sqlite` `DatabaseSync` (Node 22+). Sync API — `db.prepare().get()`, `.run()`. DB at `backend/data/hyaku.db`, auto-created + seeded on first start. Exports `getDb()`, `initialize()`, `validate(schema, data)`, `sanitize(str)`. Seed data is module-scoped inside `db.js`.

**Image URLs are duplicated** in `backend/db.js` (same `IMG_*`/`GAL_*` vars). Update both files when changing images.

**Default admin**: `admin` / `Hyakuadmin` (created on first start, logged at `index.js:73`).  
**JWT** (`backend/middleware/auth.js`): `JWT_SECRET` env required in production; dev fallback `'hyaku-ramen-dev-secret'`. 24h expiry.

**`.env` template** (`backend/.env`, gitignored): `JWT_SECRET`, `MIDTRANS_*`, `MIDTRANS_IS_PRODUCTION`, `SMTP_*`, `ADMIN_EMAIL`. No `dotenv` package — set manually.

**Optional services**: Midtrans payments (`backend/services/midtrans.js`) and email via nodemailer (`backend/services/email.js`). Payment notif at `POST /api/payments/notification`.

**Unused deps**: `pg`, `http-proxy-middleware` in `package.json` — never imported.

## API & forms

Endpoints: `backend/routes/*.js` (13 files). Frontend render functions fetch from API, fall back to `MENU_DATA`/`GALLERY_DATA`/`TESTIMONIALS` globals.  
Forms POST to `/api/*` (fire-and-forget, `.catch(function() {})`) **and** open WhatsApp.

## WhatsApp numbers

Two defaults: `6285174074352` (Official) + `088293426204` (Tester).  
Source of truth: `wa_numbers` table in SQLite (CRUD via Admin → WhatsApp tab).  
Frontend: `/api/config` endpoint serves active numbers; fallback = `WA_NUMBER`/`WA_NUMBER_TESTER` from `images.js`.  
All WA links route through `openWaSelection()` modal in `script.js`.

## localStorage keys

`cart`, `admin_token` (JWT), `admin_user`, `theme` (dark mode), `saved` (bookmark), `newsletter_email`.

## Data structures

**Menu** items (`frontend/data.js:2-17`, also `backend/db.js:117-132`): cats `ramen`/`dry`/`katsu`/`minuman`/`topping`. Fields: `id`, `cat`, `name`, `price` (display), `priceNum` (numeric for cart), `badge`, `badgeClass`, `desc`, `img`.  
**Tables**: 10 tables, `number` (Meja 1-10), `capacity` (2/4/6), `location` (Indoor/Outdoor).

## CI/CD

`.github/workflows/deploy.yml`: push to `main` → upload `frontend/` to GitHub Pages. Backend/admin not included.

## Admin SPA

`admin/index.html` + `admin/app.js` + `admin/style.css`. Auth via `localStorage.admin_token` JWT.

## No test/lint/typecheck suite

`package.json` has only `start`/`dev` (both `node index.js`). No test framework, linter, or type checker.
