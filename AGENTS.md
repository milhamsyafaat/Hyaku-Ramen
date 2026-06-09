# Hyaku Ramen

| Folder | Deploy | Tech |
|--------|--------|------|
| `frontend/` | GitHub Pages | Vanilla HTML + Tailwind v3 CDN + FA6.4 + ES5 JS |
| `backend/` | VPS (Procfile) | Node >=22 + Express + `node:sqlite` |
| `admin/` | GitHub Pages subdomain | ES5 SPA, calls API via Cloudflare proxy |

## Start

```bash
cd backend && npm install && npm start  # http://localhost:3001
# npm run dev is identical
```

Express serves `frontend/` at root and `admin/` at `/admin/` in both dev and production. No build step. No lint/test/typecheck scripts.

## Frontend

Tailwind v3 CDN. Script load order: `images.js` → `data.js` → `script.js`.  
`images.js`: `IMG_*`, `GAL_*`, `WA_NUMBER`, `WA_NUMBER_TESTER`.  
`data.js`: `MENU_DATA`, `GALLERY_DATA`, `TESTIMONIALS` (fallbacks when API is down).  
DOM helpers: `$('#id')`, `qs()`, `qa()`. XSS-safe `esc()` in both `frontend/script.js` and `admin/app.js`.  
POST helper: `apiPost(url, data)` returns JSON (or `{ok:true}`), throws on HTTP errors.

## Backend

**DB** (`backend/db.js`): `node:sqlite` `DatabaseSync` (sync API). DB at `backend/data/hyaku.db`, auto-created + seeded on first start. Exports `getDb()`, `initialize()`, `validate()`, `sanitize()`, `resetData()`.

**Rate limiting** (15-min windows, production only): `/api/*` 100 req, `/api/auth/login` 5 req, `/api/{contact,reservations,orders}` 10 req. Admin routes (`/api/admin/*`) skip global limiter.

**Routes**: `backend/routes/*.js` — 12 files mounted at `backend/index.js:30-41`.

**JWT** (`backend/middleware/auth.js`): fails hard in production without `JWT_SECRET` env; dev fallback `'hyaku-ramen-dev-secret'`. 24h expiry (`backend/routes/auth.js:22`). Admin stores token as `admin_token` in localStorage. Protected routes have `req.admin` with decoded JWT payload.

**Default admin** (seeded at `backend/db.js:60-61`): `admin` / `admin123`. Startup message at `backend/index.js:74` echoes this.

**.env** (`backend/.env`, gitignored): template only — no `dotenv` loader, set vars in runtime environment.

**Optional services**: Midtrans payments (`backend/services/midtrans.js`), nodemailer (`backend/services/email.js`). Notif endpoint: `POST /api/payments/notification`.

**Unused deps** (never imported): `pg`, `http-proxy-middleware`.

## Admin

ES5 SPA. API wrapper: `api(path, options)` prepends `/api`, injects `authHeaders()`, handles 429/401, and auto-extracts `.data` from array responses. No POST helper — login uses `fetch(API + '/auth/login', ...)` directly. Dashboard polls `/api/admin/stats` every 30s.

## WhatsApp

Source of truth: `wa_numbers` table (fields: `is_default`, `is_tester`, `is_active`). Frontend fetches from `/api/config`; fallback = `WA_NUMBER`/`WA_NUMBER_TESTER` from `images.js`. All WA links via `openWaSelection()` modal.

## localStorage keys

`cart`, `admin_token` (JWT), `admin_user`, `theme` (dark mode).

## Gotchas

- **Image URLs duplicated** in `frontend/images.js` and `backend/db.js` — same `IMG_*`/`GAL_*` vars in both. Always update both files.
- **`href="tel:+6285174074352"` hardcoded** at `frontend/index.html:268` — update when changing WA number.
- **Forms POST to `/api/*`** AND open WhatsApp via `openWaSelection()`. Fetches to `/api/wa-numbers/active` and `/api/config` are fire-and-forget (`.catch(function() {})`).
- **Root `package-lock.json` is stale** (90 B, empty) — `backend/package.json` is the real manifest.
- **Midtrans Snap URL hardcoded to sandbox** in `frontend/script.js:688`; `MIDTRANS_IS_PRODUCTION` only affects server-side.

## Deploy

**Procfile** (root): `cd backend && npm install && node index.js`.

**Docker** (`backend/Dockerfile`): Node 22 Alpine, serves all 3 folders. Build with `docker build -f backend/Dockerfile .`

**CI** (`.github/workflows/deploy.yml`): push to `main` → uploads only `frontend/` to GitHub Pages.
