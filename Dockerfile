# ── Dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --fetch-timeout=600000

# ── Build ───────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_PUBLIC_API_BASE_URL=https://afrovision-backend-134538542038.us-central1.run.app

RUN npx next build

# ── Runtime ─────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV NEXT_PUBLIC_API_BASE_URL=https://afrovision-backend-134538542038.us-central1.run.app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy public dir only if it exists (admin may not have one)
RUN mkdir -p /app/public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER appuser
EXPOSE 8080

CMD ["node", "server.js"]
