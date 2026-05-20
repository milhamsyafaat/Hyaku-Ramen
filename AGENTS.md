# webdev — Hyaku Ramen landing page

Vanilla `index.html` + Tailwind v3 CDN + FontAwesome 6 CDN + Inter (Google Fonts) + vanilla JS. No build tools, no backend, no package manager, no `node_modules`.

## Critical load order

The three JS files must load in this exact sequence (`index.html:680-682`):
1. `js/images.js` — all image URL variables (`IMG_*`, `GAL_*`)
2. `js/data.js` — data arrays (`MENU_DATA`, `GALLERY_DATA`, `TESTIMONIALS`)
3. `js/script.js` — all logic (DOM helpers, IIFEs for each feature)

## Stack quirks

- **Tailwind v3** — config is an inline `<script>` block **before** the CDN `<script>` tag (`index.html:61-73`). This order matters.
- **Dark mode** — `darkMode: 'class'` strategy, toggle adds/removes `dark` on `<html>`, persisted in `localStorage('theme')`, defaults to OS preference.
- **JS is ES5** — `var` only, function expressions (not arrow), no modules, no imports. Each feature is a standalone IIFE. Keep new code in the same style.
- **DOM helpers** (in `script.js:2-4`): `$('#id')` for getElementById, `qs()`/`qa()` for querySelector/All. Use these.
- **Cart system** — cart HTML and modal exist (`index.html:111-114, 606-632`) but have **no JS implementation** (`mmAddCartBtn`, `cartCheckoutBtn`, cart badge are non-functional). WA link in menu modal works.

## WhatsApp number

The business number `+6285174074352` is hardcoded in ~7 places (menu modal, reservation form, contact form, footer, WA float button, nav drawer, structured data). If changed, update all. Encoding differs:
- Reservation (`script.js:480-487`): manual `%0A` for newlines
- Contact form (`script.js:506-510`): `encodeURIComponent()` on full message

## Data editing

All data is in `js/data.js`. Fields:
- Menu (`cat` values: `ramen`/`dry`/`katsu`/`minuman`/`topping`): `id`, `cat`, `name`, `price`, `badge`, `badgeClass`, `desc`, `img` (empty string = no image, renders icon placeholder)
- Gallery: `src`, `alt` (both Unsplash CDN URLs)
- Testimonials: `author`, `initial`, `avatarClass`, `role`, `date`, `rating`, `title`, `text`, `ownerReply`

## External assets only

All images are `images.unsplash.com/...`. Fonts from Google Fonts CDN. No local image files.

## Key files

| File | Purpose |
|---|---|
| `index.html` | HTML structure (all sections + modals inline) |
| `css/style.css` | Custom CSS (animations, state classes, print styles) |
| `js/images.js` | Image URL variables (edit these to swap photos) |
| `js/data.js` | Data arrays (menu, gallery, testimonials) |
| `js/script.js` | All JS logic (IIFEs per feature) |
