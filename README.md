<p align="center">
  <img src="public/favicon.svg" alt="Ellaura Logo" width="64" height="64" />
</p>

<h1 align="center">ELLAURA — Own The Night</h1>

<p align="center">
  <strong>Premium custom-stitched womenswear for nightlife, cocktails & city culture</strong><br/>
  Every piece stitched to your exact measurements. Delivered in 48–72 hours.
</p>

<p align="center">
  <a href="https://ellaura.in">🌐 Live Site</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-supabase-setup">Supabase</a> •
  <a href="#-deployment">Deployment</a>
</p>

---

## ✨ Overview

**Ellaura** is a full-featured e-commerce storefront built for India's nightlife and fashion scene. Customers can browse a curated womenswear collection, enter custom body measurements at checkout, and receive their outfits custom-stitched within 48–72 hours.

Built as a React SPA with a Supabase backend, Razorpay + COD payments, WhatsApp order notifications, and a Google Sheets sync for order tracking — all deployable on Vercel in minutes.

---

## 🎯 Features

| Feature | Description |
|---------|-------------|
| **Product Gallery** | Filterable grid with vibe/category tags and quick-view modals |
| **Custom Fit** | Customers enter bust/waist/hips + 7 optional measurements + freeform extras |
| **AI Stylist (Ella)** | Built-in chat assistant for outfit recommendations |
| **Cart & Wishlist** | Persistent across devices — survives logout/login |
| **Checkout** | COD + Razorpay online payment, coupon codes, saved addresses |
| **Order Notifications** | WhatsApp message + Google Sheets row on every order |
| **Saved Measurements** | One-click save measurements to profile for future orders |
| **Auth System** | Supabase Auth (email/password) with full demo mode fallback |
| **Admin Dashboard** | Password-protected panel — add/edit products, manage orders & coupons |
| **Coming Soon Mode** | Toggle a full-screen waitlist page before launch |
| **Dark / Light Mode** | Glassmorphism-based theme toggle |
| **Responsive** | Mobile-first, tested on all screen sizes |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router 7, Vite 5 |
| **Styling** | Tailwind CSS 3, glassmorphism design system |
| **Icons** | Lucide React |
| **Backend** | Supabase (PostgreSQL + Auth + Row Level Security) |
| **Payments** | Razorpay (online), Cash on Delivery |
| **Notifications** | WhatsApp Business API, Google Sheets via Apps Script webhook |
| **Deployment** | Vercel (recommended), Docker |

---

## 📁 Project Structure

```
ellaura.in/
├── public/
│   ├── favicon.svg
│   └── 404.html                # SPA fallback for direct URL access
├── src/
│   ├── components/
│   │   ├── AIStylist.jsx       # AI chat widget (Ella)
│   │   ├── CartSidebar.jsx     # Slide-out cart drawer
│   │   ├── Header.jsx          # Navigation header
│   │   ├── Hero.jsx            # Landing hero section
│   │   ├── ProductGallery.jsx  # Main product grid
│   │   ├── ProductModal.jsx    # Product detail + Custom Fit form
│   │   ├── SearchModal.jsx     # Search overlay
│   │   └── Toast.jsx           # Toast notifications
│   ├── context/
│   │   └── AppContext.jsx      # Global state — cart, auth, wishlist, UI
│   ├── lib/
│   │   ├── products.js         # Product catalogue, size charts, filters
│   │   ├── razorpay.js         # Razorpay checkout integration
│   │   └── supabase.js         # Supabase client, demo mode, notifications
│   ├── pages/
│   │   ├── AdminPage.jsx       # Admin dashboard
│   │   ├── CheckoutPage.jsx    # Checkout flow
│   │   ├── ComingSoonPage.jsx  # Pre-launch waitlist page
│   │   ├── HomePage.jsx        # Landing page
│   │   ├── LoginPage.jsx       # Auth page
│   │   ├── LookbookPage.jsx    # Editorial lookbook
│   │   ├── NotFoundPage.jsx    # 404 page
│   │   ├── OrdersPage.jsx      # Order history
│   │   └── OrderSuccessPage.jsx
│   ├── App.jsx                 # Root component & routes
│   ├── coming-soon-entry.jsx   # Entry point for coming-soon build
│   ├── main.jsx                # React entry point
│   └── index.css               # Global styles & design tokens
├── scripts/
│   ├── coming-soon.js          # Toggles coming-soon mode in App.jsx
│   └── fresh-start.sql         # Wipes Supabase data (dev/reset use only)
├── supabase/
│   └── functions/              # Edge Functions (deploy when needed)
│       ├── ai-stylist/
│       ├── create-payment-intent/
│       ├── create-phonepe-payment/
│       └── create-shiprocket-order/
├── docker/
│   └── nginx.conf              # Nginx SPA config for Docker
├── .env.example                # Environment variable template
├── supabase_schema.sql         # Full DB schema — safe to re-run
├── coming-soon.html            # Standalone coming-soon HTML entry
├── Dockerfile                  # Multi-stage production Docker image
├── docker-compose.yml          # Docker Compose for local testing
├── vite.config.js              # Vite build config (with code splitting)
├── vite-cs.config.js           # Vite config for coming-soon build
├── vercel.json                 # Vercel headers, rewrites, caching
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### 1. Clone

```bash
git clone https://github.com/Md-javid/ELLAURA.git
cd ELLAURA
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` — the app runs in **Demo Mode** without real credentials, so you can explore everything locally right away.

### 4. Start the dev server

```bash
npm run dev
```

Open **http://localhost:5173** 🎉

---

## 🔑 Environment Variables

| Variable | Required for live | Description |
|----------|------------------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `VITE_RAZORPAY_KEY_ID` | ✅ | Razorpay live key (`rzp_live_...`) |
| `VITE_ADMIN_EMAIL` | ✅ | Admin login email |
| `VITE_ADMIN_PASSWORD` | ✅ | Admin login password |
| `VITE_APP_URL` | ✅ | `https://ellaura.in` |
| `VITE_SHEETS_WEBHOOK_URL` | Recommended | Google Apps Script webhook for order sync |
| `VITE_WHATSAPP_NUMBER` | Recommended | WhatsApp Business number (e.g. `919XXXXXXXXX`) |
| `VITE_DEMO_MODE` | — | Set `false` in production |

---

## 🗄️ Supabase Setup

> Skip if running in Demo Mode — the app works fully without Supabase locally.

1. Create a free project at [app.supabase.com](https://app.supabase.com)
2. Go to **Settings → API** → copy **Project URL** and **anon key** into `.env`
3. Go to **SQL Editor → New Query**, paste the contents of `supabase_schema.sql`, click **Run**
   - ✅ Safe to re-run — all statements use `IF NOT EXISTS`
   - Creates: `profiles`, `orders`, `cart_items`, `addresses`, `products`, `wishlists`, `reviews`, `coupons`, `waitlist`
4. Go to **Authentication → URL Configuration** → set Site URL to `https://ellaura.in`

---

## 💳 Razorpay Setup

1. Create an account at [razorpay.com](https://razorpay.com)
2. Go to **Settings → API Keys** → generate a **Live Key**
3. Add to `.env`:
   ```
   VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
   ```

> Test mode: use `rzp_test_...` key locally. Switch to `rzp_live_...` before going live.

---

## 📲 Coming Soon Mode

Toggle a full-screen waitlist page before your public launch:

```bash
# Enable coming-soon mode
npm run coming-soon:on

# Run the coming-soon dev server (port 4000)
npm run coming-soon

# Disable and switch back to main app
npm run coming-soon:off
```

---

## 🐳 Docker

```bash
# Build and run
docker-compose up --build

# Or manually
docker build -t ellaura .
docker run -p 8080:80 ellaura
```

Open **http://localhost:8080**

---

## 🌐 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Add all environment variables in **Settings → Environment Variables**
4. Deploy — Vercel auto-detects Vite (`npm run build` → `dist/`)
5. Add your domain in **Settings → Domains** and point DNS to Vercel

### Docker (Any Cloud)

```bash
docker build -t ellaura .
docker run -p 80:80 ellaura
```

Works on AWS ECS, Google Cloud Run, DigitalOcean App Platform, Fly.io, Railway, etc.

---

## 🧪 Demo Mode

When Supabase credentials are absent or invalid, the app auto-switches to Demo Mode:

- ✅ Full browsing, cart, wishlist
- ✅ Mock sign up / sign in via localStorage
- ✅ Demo coupons: `ELLAURA10`, `LAUNCH20`, `BANDRA500`, `VIP15`
- ✅ AI Stylist with built-in responses
- ⚠️ No real payments or persistent data across devices

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 5173 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run coming-soon` | Coming-soon dev server on port 4000 |
| `npm run coming-soon:on` | Enable coming-soon gate in App.jsx |
| `npm run coming-soon:off` | Disable coming-soon gate in App.jsx |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Made with ❤️ for Ellaura</strong><br/>
  <a href="https://ellaura.in">ellaura.in</a>
</p>
