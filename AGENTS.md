# Hyaku Ramen — full stack landing page

Vanilla `index.html` + Tailwind v3 CDN + FontAwesome 6 CDN + Inter (Google Fonts) + vanilla JS (ES5). Backend: **Node.js + Express + SQLite** (`server/`). Admin dashboard at `/admin/`.

## Quick start

```bash
npm install
npm start   # → http://localhost:3001
```

Admin panel: `http://localhost:3001/admin/` — default login `admin` / `HyakuAdmin123!`.

## JS load order matters (landing page)

Three files loaded in exact sequence from `index.html` (~lines 677-679):

1. `images.js` — image URL variables (`IMG_*`, `GAL_*`)
2. `data.js` — data arrays (used as API fallback)
3. `script.js` — all logic (DOM helpers, IIFEs per feature)

Files at root level are the source of truth. `js/` and `css/` subdirectories are exact duplicates — do **not** edit them.

## JS style (frontend)

ES5 only — `var`, function expressions, no arrow functions, no modules, no imports. Each feature is a standalone IIFE.

DOM helpers (`script.js:2-4`): `$('#id')` for `getElementById`, `qs()`/`qa()` for querySelector/All.

## Server architecture

`server/index.js` — Express app. Serves:
- Static files from root (landing page at `/`)
- Admin panel at `/admin/`
- JSON API at `/api/*`

All routes in `server/routes/`. DB auto-creates + seeds on first start at `data/hyaku.db`. Password hashing via bcryptjs (`server/db.js`).

### API endpoints

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET/POST | `/api/menu` | POST requires auth | List / create menu items |
| PUT/DELETE | `/api/menu/:id` | Auth required | Update / delete menu |
| GET | `/api/orders` | Auth required | List orders |
| POST | `/api/orders` | Public | Submit order (from cart) |
| PUT/DELETE | `/api/orders/:id` | Auth required | Update / delete order |
| GET | `/api/reservations` | Auth required | List reservations |
| POST | `/api/reservations` | Public | Submit reservation |
| PUT/DELETE | `/api/reservations/:id` | Auth required | Update / delete |
| GET | `/api/contact` | Auth required | List messages |
| POST | `/api/contact` | Public | Submit contact form |
| PUT/DELETE | `/api/contact/:id` | Auth required | Mark read / delete |
| GET/POST | `/api/testimonials` | POST requires auth | List / create |
| PUT/DELETE | `/api/testimonials/:id` | Auth required | Update / delete |
| GET/POST | `/api/gallery` | POST requires auth | List / create |
| PUT/DELETE | `/api/gallery/:id` | Auth required | Update / delete |
| POST | `/api/auth/login` | Public | Returns JWT token |
| GET | `/api/auth/me` | Auth required | Verify token |
| GET | `/api/admin/stats` | Auth required | Dashboard counters |

## Frontend API integration

Render functions (`renderMenu`, `renderGallery`, `testimonialsCarousel`) fetch from `/api/*` on page load, falling back to global variables (`MENU_DATA`, `GALLERY_DATA`, `TESTIMONIALS`) if the API is unreachable.

Forms (reservation, contact, cart checkout) POST to `/api/*` **and** open WhatsApp — the API submission is fire-and-forget.

## Admin dashboard

`admin/index.html` + `admin/app.js` — single-page app with views for each entity. Styled with Tailwind CDN (no build step). JWT token stored in `localStorage('admin_token')`.

## Tailwind config

Inline `<script>` block **after** the CDN `<script>` (`index.html:~61-72`). `darkMode: 'class'` strategy.

Dark mode toggle adds/removes `dark` on `<html>`, persisted in `localStorage('theme')`, defaults to OS preference.

## Cart

Full cart system in `script.js` — `__cart` array, persisted in `localStorage('cart')`. Cart modal (`#cartModal`), badge (`#cartBadge`), `mmAddCartBtn` wired up. Checkout sends order to API + WhatsApp.

Other localStorage keys: `saved` (bookmark toggle), `newsletter_email`, `theme`.

## WhatsApp number

`+6285174074352` hardcoded in ~10 places across `index.html` and `script.js`. If changed, update all. Encoding differs by context:

| Context | Encoding | Location |
|---|---|---|
| Pure WA links (nav, footer, float button) | no text param | `index.html` |
| Menu modal | `encodeURIComponent()` | `script.js` in `renderMenu` |
| Reservation form | manual `%0A` for newlines | `script.js` in `reservationForm` |
| Contact form | `encodeURIComponent()` on full message | `script.js` in `contactForm` |
| Cart checkout | manual `%0A` | `script.js` in `cartUI` |
| Structured data | `telephone` field | `index.html` JSON-LD |

## Data editing

All seed data in `server/db.js` (menuData, galleryData, testimonialData arrays). After seeding, manage data via admin panel at `/admin/`.

Fields:
- **Menu** (`cat`: `ramen`/`dry`/`katsu`/`minuman`/`topping`): `id`, `cat`, `name`, `price` (display), `priceNum` (numeric for cart), `badge`, `badgeClass`, `desc`, `img` (empty = icon placeholder)
- **Gallery**: `src`, `alt`
- **Testimonials**: `author`, `initial`, `avatarClass`, `role`, `date`, `rating`, `title`, `text`, `ownerReply`

## External assets only

All images from `images.unsplash.com`. Fonts from Google Fonts CDN. No local image files.

## Key files

| File | Purpose |
|---|---|
| `server/index.js` | Express app entrypoint |
| `server/db.js` | Schema, seed data, DB connection |
| `server/routes/*.js` | API route handlers |
| `admin/index.html` | Admin dashboard HTML |
| `admin/app.js` | Admin dashboard JS |
| `index.html` | Landing page HTML |
| `style.css` | Custom CSS (animations, state classes) |
| `images.js` | Image URL variables |
| `data.js` | Static data arrays (API fallback) |
| `script.js` | Frontend logic (IIFEs per feature) |
