# ═══════════════════════════════════════════════════════════
# Ellaura — Multi-stage Dockerfile
# Stage 1: Build the Vite/React app
# Stage 2: Serve with Nginx Alpine (~25 MB final image)
# ═══════════════════════════════════════════════════════════

# ── Stage 1: Build ────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build-time env vars (Vite embeds VITE_* at build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_ADMIN_PIN
ARG VITE_APP_URL

# Copy dependency files first for better layer caching
COPY package.json package-lock.json ./

# Install dependencies (ci = clean install, production-deterministic)
RUN npm ci

# Copy source code
COPY . .

# Build the production bundle
RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Copy custom Nginx config for SPA routing
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
