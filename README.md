# Atlas & Oak — a complete e-commerce application

A full clothing, footwear and accessories store built with Next.js. Browse → cart → checkout →
payment → order placed → tracking, plus an AI shopping assistant, transactional email and an
admin dashboard with full product CRUD.

Everything runs on dummy data. **No database, no real payment gateway, no real mail provider**
is required — but each one has a real integration point if you want to plug one in.

**Live:** https://atlas-and-oak.vercel.app

---

## What is in it

### Storefront
- **Home** — hero, category tiles, featured edit, new arrivals, sale rail, reviews
- **Shop** — filter by category, type, collection, price and sale; sort by price, rating or newest; full-text search
- **Product detail** — colourway switching, size selector with size guide, quantity, wishlist, add to bag, buy now, details/care/reviews accordions, related products
- **Cart** — line quantity, remove, live totals, discount codes (`WELCOME10`, `STYLE20`, `FREESHIP`, `FLAT50`)
- **Wishlist**, **Orders list**, **Order detail** with a live fulfilment timeline
- **Help & policies** and **Our story** pages

### Checkout, payment and orders
Three steps — delivery address, shipping method, payment — with per-field validation.

`POST /api/payment` simulates a real gateway: Luhn check on the card, expiry and CVC format
checks, a processing delay, and deterministic test cards.

| Card | Result |
| --- | --- |
| `4242 4242 4242 4242` | Approved |
| `4000 0000 0000 0002` | Declined by bank |
| `4000 0000 0000 9995` | Insufficient funds |

UPI (`fail@okbank` declines) and cash on delivery are also supported. On success the order is
created, three emails go out, the cart clears, and you land on a **payment successful / order
placed** confirmation with tracking.

### Email
`POST /api/email` renders real, responsive HTML emails — order confirmation, payment receipt,
shipping update, welcome and an ops alert. Every message is captured in the in-app **outbox**
(`/admin/emails`) and rendered exactly as the customer receives it.

Set a `RESEND_API_KEY` environment variable and the identical messages are sent for real
instead of simulated — no code change needed.

### AI assistant (Ora)
A floating chat widget backed by `POST /api/assistant`. It is intent-driven over the live
catalogue, not a canned script. It can:

- search by type, colour, collection, size and budget — *"hoodies under $150"*, *"a black jacket for men"*
- recommend and pick gifts — *"a gift under $500"*
- **add things to your cart** — *"add the first one to my cart"* (it resolves "first", "second", or a product name)
- read your cart back to you and take you to checkout
- answer sizing, shipping, returns, warranty, payment and discount questions from the real policy data
- look up and track your orders by number, and link straight to them

### Admin dashboard (`/admin`)
- **Login:** `admin@atlasandoak.com` / `admin123`
- **Dashboard** — revenue, units, AOV, low stock, best sellers, recent orders, latest email
- **Products** — full CRUD: create, edit, delete, search, filter, reset to the seed catalogue. Multi-colourway editor with swatch picker and image library, pricing, stock, sizes, badges and featured flag
- **Orders** — move an order through placed → confirmed → packed → shipped → delivered; each step emails the customer
- **Email outbox** — every sent message, rendered

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Framer Motion · lucide-react

State lives in React context and persists to `localStorage`, so your cart, orders, wishlist and
any product you add in the admin survive a refresh without a database.

## Product imagery

The 24 product images are generated from a single campaign asset sheet: each garment was cut out
to a transparent PNG, then relit into its other colourways with a luminance-preserving recolour
pass, so every colour variant is a genuinely different image.

## Run locally

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

Optional environment variables:

```bash
RESEND_API_KEY=re_...                       # send the emails for real
MAIL_FROM="Atlas & Oak <you@yourdomain.com>"
```

## A quick tour

1. Open the shop, add a hoodie and a watch to your bag
2. In the cart, apply `WELCOME10`
3. Check out with `4000 0000 0000 0002` to see a decline, then `4242 4242 4242 4242` to succeed
4. Read the confirmation email at `/admin/emails`
5. In `/admin/orders`, mark the order *confirmed* — the customer gets another email
6. In `/admin/products`, add a product and watch it appear in the shop
7. Ask Ora for *"hoodies under $150"*, then *"add the first one to my cart"*
