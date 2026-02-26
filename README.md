<p align="center">
  <img src="public/favicon.svg" alt="Ellaura Logo" width="64" height="64" />
</p>

<h1 align="center">ELLAURA — Own The Night</h1>

<p align="center">
  <strong>Premium custom-stitched womenswear for nightlife, cocktails & city culture</strong>
</p>

<p align="center">
  <a href="https://ellaura.in">Live Site</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-docker">Docker</a> •
  <a href="#-deployment">Deployment</a>
</p>

---

## ✨ Overview

**Ellaura** is a modern, full-featured e-commerce platform for premium custom-stitched womenswear — specifically designed for India's nightlife, cocktail, and pub culture scene. Every piece is custom-stitched to order within 48–72 hours.

The storefront is a single-page React application with a luxurious dark/light theme, AI-powered personal stylist, Stripe payments, and a Supabase backend for auth, orders, and product management.

---

## 🎯 Features

| Feature | Description |
|---------|-------------|
| **Product Gallery** | Filterable gallery with smooth animations and quick-view modals |
| **AI Stylist (Ella)** | Chat with an AI personal stylist powered by OpenAI (GPT-4o-mini) |
| **Cart & Checkout** | Persistent cart with coupon codes and Stripe payment integration |
| **Auth System** | Sign up / sign in with Supabase Auth (+ demo mode fallback) |
| **Admin Dashboard** | PIN-protected admin panel for managing products, orders & coupons |
| **Lookbook** | Curated editorial lookbook page |
| **Dark / Light Mode** | Glassmorphism-based theme toggle with smooth transitions |
| **Demo Mode** | Full functionality without any backend — perfect for evaluation |
| **Responsive** | Mobile-first design optimised for all screen sizes |
| **SEO Ready** | Open Graph, Twitter Cards, meta tags, structured data |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router 7, Vite 5 |
| **Styling** | Tailwind CSS 3, custom glassmorphism design system |
| **Icons** | Lucide React |
| **Backend** | Supabase (PostgreSQL + Auth + Edge Functions) |
| **Payments** | Stripe (React Stripe.js) |
| **AI** | OpenAI GPT-4o-mini via Supabase Edge Functions |
| **Deployment** | Vercel / Docker |

---

## 📁 Project Structure

```
ellaura.in/
├── public/                     # Static assets
│   └── favicon.svg
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── AIStylist.jsx       # AI chat widget (Ella)
│   │   ├── CartSidebar.jsx     # Slide-out cart drawer
│   │   ├── Header.jsx          # Navigation header
│   │   ├── Hero.jsx            # Landing hero section
│   │   ├── ProductGallery.jsx  # Main product grid
│   │   ├── ProductModal.jsx    # Product detail quick-view
│   │   ├── SearchModal.jsx     # Search overlay
│   │   └── Toast.jsx           # Toast notifications
│   ├── context/
│   │   └── AppContext.jsx      # Global state (cart, auth, UI)
│   ├── lib/
│   │   ├── products.js         # Product data & helpers
│   │   └── supabase.js         # Supabase client + demo mode
│   ├── pages/
│   │   ├── AdminPage.jsx       # Admin dashboard
│   │   ├── CheckoutPage.jsx    # Checkout flow
│   │   ├── HomePage.jsx        # Landing page
│   │   ├── LoginPage.jsx       # Auth page
│   │   ├── LookbookPage.jsx    # Editorial lookbook
│   │   ├── NotFoundPage.jsx    # 404 page
│   │   └── OrderSuccessPage.jsx# Order confirmation
│   ├── App.jsx                 # Root app component & routes
│   ├── main.jsx                # React entry point
│   └── index.css               # Global styles & design tokens
├── supabase/
│   └── functions/              # Supabase Edge Functions
│       ├── ai-stylist/         # AI styling recommendations
│       └── create-payment-intent/ # Stripe payment intent
├── docker/
│   └── nginx.conf              # Nginx config for Docker
├── .env.example                # Environment variable template
├── supabase_schema.sql         # Database schema (safe to re-run)
├── Dockerfile                  # Production Docker image
├── docker-compose.yml          # Docker Compose for local dev
├── index.html                  # HTML entry point
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── vite.config.js              # Vite build configuration
├── vercel.json                 # Vercel deployment config
└── package.json                # Dependencies & scripts
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9 (or yarn/pnpm)
- *(Optional)* Docker & Docker Compose

### 1. Clone the repository

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

Edit `.env` with your credentials. **The app works in Demo Mode without any real keys** — you only need real credentials when you're ready to go live.

| Variable | Required? | Description |
|----------|-----------|-------------|
| `VITE_SUPABASE_URL` | Optional | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Optional | Supabase anon/public key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Optional | Stripe publishable key |
| `VITE_ADMIN_PIN` | Optional | 6-digit admin PIN (default: `230703`) |
| `VITE_APP_URL` | Optional | Your production domain |

### 4. Start the development server

```bash
npm run dev
```

Open **http://localhost:5173** in your browser. 🎉

---

## 🐳 Docker

### Quick Run (Production Build)

```bash
# Build the image
docker build -t ellaura .

# Run the container
docker run -p 8080:80 ellaura
```

Open **http://localhost:8080**

### Docker Compose (Recommended)

```bash
# Build and start
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop
docker-compose down
```

Open **http://localhost:8080**

### Environment Variables in Docker

Pass environment variables at build time:

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=your-key \
  --build-arg VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx \
  -t ellaura .
```

Or use a `.env` file with Docker Compose (already configured in `docker-compose.yml`).

---

## 🗄️ Supabase Setup

> **Skip this section if you want to run in Demo Mode** — the app works fully without Supabase.

1. Create a free project at [app.supabase.com](https://app.supabase.com)
2. Go to **Settings → API** and copy your **Project URL** and **anon key**
3. Paste them into `.env`:
   ```
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
4. Open **SQL Editor → New Query** and paste the contents of `supabase_schema.sql`, then click **Run**
5. *(Optional)* Deploy Edge Functions:
   ```bash
   supabase functions deploy ai-stylist
   supabase functions deploy create-payment-intent
   supabase secrets set OPENAI_API_KEY=sk-...
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   ```

---

## 💳 Stripe Setup

> **Skip this if you want to run in Demo Mode.**

1. Create an account at [dashboard.stripe.com](https://dashboard.stripe.com)
2. Go to **Developers → API Keys**
3. Copy the **publishable key** into `.env`:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxx
   ```
4. Set the **secret key** as a Supabase secret:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxxxxx
   ```

---

## 🌐 Deployment

### Vercel (Recommended)

1. Push the code to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add environment variables in **Settings → Environment Variables**
4. Deploy — Vercel auto-detects Vite and builds accordingly

### Docker (Any Cloud)

```bash
docker build -t ellaura .
docker run -p 80:80 ellaura
```

Works on AWS ECS, Google Cloud Run, Azure Container Apps, DigitalOcean App Platform, Fly.io, Railway, etc.

---

## 🧪 Demo Mode

When Supabase credentials are missing or invalid, the app automatically switches to **Demo Mode**:

- ✅ Full UI browsing & interactions
- ✅ Cart persists in localStorage
- ✅ Mock sign up / sign in (localStorage)
- ✅ Hardcoded demo coupons: `ELLAURA10`, `LAUNCH20`, `BANDRA500`, `VIP15`
- ✅ AI Stylist works with built-in responses
- ⚠️ No real payment processing
- ⚠️ No persistent user data across devices

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 5173 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Made with ❤️ by the Ellaura team</strong><br/>
  <a href="https://ellaura.in">ellaura.in</a>
</p>
