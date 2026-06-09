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

Express serves `frontend/` and `admin/` statically. No build step. No lint/test/typecheck scripts.

## Frontend

Tailwind v3 CDN. Load order: `images.js` → `data.js` → `script.js`.  
`images.js` provides `IMG_*`, `GAL_*`, `WA_NUMBER`, `WA_NUMBER_TESTER`.  
`data.js` provides `MENU_DATA`, `GALLERY_DATA`, `TESTIMONIALS` (fallbacks when API down).  
DOM helpers: `$('#id')`, `qs()`, `qa()`. XSS-safe `esc()` in both `frontend/script.js` and `admin/app.js`.

## Backend

**DB** (`backend/db.js`): `node:sqlite` `DatabaseSync` (sync API). DB at `backend/data/hyaku.db`, auto-created + seeded on first start. Exports `getDb()`, `initialize()`, `validate()`, `sanitize()`, `resetData()`.

**Rate limiting** (15-min windows): `/api/*` 100 req, `/api/auth/login` 5 req, `/api/{contact,reservations,orders}` 10 req.

**Routes**: `backend/routes/*.js` mounted at `backend/index.js:28-40`.

**JWT** (`backend/middleware/auth.js`): fails hard in production without `JWT_SECRET` env; dev fallback `'hyaku-ramen-dev-secret'`. 24h expiry.

**Default admin**: `admin` / `admin123` (auto-seeded on first start).

**.env** (`backend/.env`, gitignored): template exists but no `dotenv` loader — set vars in runtime environment.

**Optional services**: Midtrans payments (`backend/services/midtrans.js`), nodemailer (`backend/services/email.js`). Notif endpoint: `POST /api/payments/notification`.

**Unused deps** (never imported): `pg`, `http-proxy-middleware`.

## Gotchas

- **Image URLs duplicated** in `frontend/images.js` and `backend/db.js` — same `IMG_*`/`GAL_*` vars duplicated across both. Update both.
- **`href="tel:+6285174074352"` hardcoded** at `frontend/index.html:222,276` — update when changing WA number.
- **Forms POST to `/api/*`** AND open WhatsApp via `openWaSelection()`. Fetches to `/api/wa-numbers/active` and `/api/config` are fire-and-forget (`.catch(function() {})`).
- **Root `package-lock.json` is stale** (90 bytes) — `backend/package.json` is the real manifest.
- **Midtrans Snap URL hardcoded to sandbox** in `frontend/script.js:729`; `MIDTRANS_IS_PRODUCTION` only affects server-side.
- **`TODO.md` is stale** — says admin pw changed to `Hyakuadmin` but code still seeds `admin123` (`backend/db.js:60`).
- **`.node-version`** enforces Node 22 (also in `backend/package.json` `engines`).

## WhatsApp

Source of truth: `wa_numbers` table. Frontend fetches from `/api/config`; fallback = `WA_NUMBER`/`WA_NUMBER_TESTER` from `images.js`. All WA links via `openWaSelection()` modal.

## localStorage keys

`cart`, `admin_token` (JWT), `admin_user`, `theme` (dark mode), `saved` (bookmark), `newsletter_email`.

## Deploy

**Procfile** (root): `cd backend && npm install && node index.js`.

**Docker** (`backend/Dockerfile`): Node 22 Alpine, serves all 3 folders. Build with `docker build -f backend/Dockerfile .`

**CI** (`.github/workflows/deploy.yml`): push to `main` → uploads only `frontend/` to GitHub Pages.
