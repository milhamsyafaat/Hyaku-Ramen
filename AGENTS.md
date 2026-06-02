# Hyaku Ramen

Vanilla `index.html` + Tailwind v3 CDN + FontAwesome 6 CDN + Inter (Google Fonts) + ES5 JS. Backend: **Node.js + Express + built-in `node:sqlite`** (`server/`). Admin dashboard at `/admin/`.

```bash
npm install
npm start   # → http://localhost:3001
```

Admin: `http://localhost:3001/admin/` — login `admin` / `HyakuAdmin123!`.

## ES5 frontend, no build step

- `var`, function expressions, no arrow functions, no modules, no imports.
- Every feature is a standalone IIFE in `script.js`.
- DOM helpers (`script.js:2-4`): `$('#id')` = `getElementById`, `qs()`/`qa()` = querySelector/All.
- `esc()` (`script.js:7-10`) for XSS-safe HTML — use it for all user-generated content.

## JS load order (index.html:681-684)

1. `images.js` — image URL variables
2. `data.js` — static data arrays (API fallback)
3. `script.js` — all logic

Root-level `.js`/`.css` files are the source of truth. `js/` and `css/` subdirs are exact duplicates — edit only root files.

## Backend

`server/index.js` — Express app, static root (`/`), admin (`/admin`), API (`/api/*`). All routes in `server/routes/`.

**DB**: built-in `node:sqlite` (`DatabaseSync` — Node 22+). Sync API (`db.prepare().get()`, `db.prepare().run()`). DB at `data/hyaku.db`, auto-created + seeded on first start. `server/db.js` exports `validate(schema, data)` and `sanitize(str)`.

**`server/db.js` has its own copies of image URL variables** (`IMG_*`, `GAL_*`). If you update `images.js`, update `server/db.js` too.

**Rate limiting** (all 15-min windows): `/api/*` 100 req, `/api/auth/login` 5 req, form endpoints 10 req each.

**JWT auth** (`server/middleware/auth.js`): `JWT_SECRET` env var required in production; dev falls back to `'hyaku-ramen-dev-secret'`. Tokens expire in 24h.

**`.env` is a template** — no `dotenv` package. Set env vars manually in the shell. Env vars needed: `JWT_SECRET`, `MIDTRANS_*` (optional), `SMTP_*` (optional).

**Midtrans payments** (`server/services/midtrans.js`): optional. Requires `MIDTRANS_SERVER_KEY` and `MIDTRANS_CLIENT_KEY` env vars. Payment notifications at `POST /api/payments/notification`.

## API

Endpoints in `server/routes/*.js`. Render functions fetch from API, fall back to globals (`MENU_DATA`, `GALLERY_DATA`, `TESTIMONIALS`).

Forms POST to `/api/*` (fire-and-forget) **and** open WhatsApp.

## WhatsApp number

`+6285174074352` hardcoded in ~10 places (`index.html` + `script.js`). Encoding varies — search both files if changing. `images.js` defines `WA_NUMBER` (digits only) which `script.js` uses for WhatsApp links; `index.html` has its own raw `+6285174074352` hrefs.

## Local storage keys

`cart` (cart array), `admin_token` (JWT), `theme` (dark mode), `saved` (bookmark), `newsletter_email`.

## Key data structures

**Menu** categories: `ramen`/`dry`/`katsu`/`minuman`/`topping`. Fields: `id`, `cat`, `name`, `price` (display string), `priceNum` (numeric for cart), `badge`, `badgeClass`, `desc`, `img` (empty = icon placeholder).

Seed data in `server/db.js` (`menuData`, `galleryData`, `testimonialData` arrays). After seeding, manage via admin panel.

**Tables** (`tableData` in `server/db.js`): 10 tables, `number` (Meja 1-10), `capacity` (2/4/6), `location` (Indoor/Outdoor).

## Admin SPA

`admin/index.html` (shell), `admin/app.js` (logic), `admin/style.css`. All API calls use JWT from `localStorage.admin_token`.

## External assets only

All images from `images.unsplash.com`. Fonts from Google Fonts CDN. No local image files.

## No test/lint/typecheck suite

`package.json` only has `start` and `dev` (both: `node server/index.js`). No test framework, no linter, no type checker.
