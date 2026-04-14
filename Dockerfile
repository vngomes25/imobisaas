# ─── Stage 1: Install ALL dependencies (needed for build) ────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

RUN npm install -g pnpm@10.4.1

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile


# ─── Stage 2: Build frontend + server ────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Vite frontend → dist/public/
# Build Express server → dist/index.js
RUN node_modules/.bin/vite build && \
    node_modules/.bin/esbuild server/_core/index.ts \
      --platform=node \
      --packages=external \
      --bundle \
      --format=esm \
      --outdir=dist


# ─── Stage 3: Install only production dependencies ───────────────────────────
FROM node:20-alpine AS prod-deps
WORKDIR /app

RUN npm install -g pnpm@10.4.1

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile


# ─── Stage 4: Final production image ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy production node_modules
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy build output
COPY --from=builder /app/dist ./dist

# Copy migration files (needed for auto-migrate on startup)
COPY --from=builder /app/drizzle ./drizzle

# Copy package.json (needed by some packages)
COPY package.json ./

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node", "dist/index.js"]
