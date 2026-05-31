# ── Stage 1: Dependencies ─────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files first — Docker caches this layer separately.
# If only source code changes, npm install is skipped on rebuild.
COPY package*.json ./
RUN npm ci --only=production

# ── Stage 2: Final image ──────────────────────────────────────
FROM node:20-alpine

RUN apk add --no-cache dumb-init

WORKDIR /app

# Non-root user — satisfies Kyverno policy
USER node

COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .

EXPOSE 50051

# dumb-init handles SIGTERM correctly and reaps zombie processes.
# Without it, Node.js running as PID 1 doesn't handle signals properly.
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
