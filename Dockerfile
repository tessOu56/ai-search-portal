# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

# Copy package files (pnpm-lock.yaml is the reproducible install source)
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

# Stage 2: Runtime
FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 remix

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile && pnpm store prune && rm -rf ~/.local/share/pnpm/store

COPY --from=builder --chown=remix:nodejs /app/build ./build
COPY --from=builder --chown=remix:nodejs /app/public ./public

USER remix

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# npx resolves local remix-serve from node_modules (.bin); same runtime contract as pre-pnpm image
CMD ["npx", "remix-serve", "./build/server/index.js"]
