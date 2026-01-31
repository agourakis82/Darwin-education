# Darwin Education - Next.js Dockerfile
# Multi-stage build for development and production

# Stage 1: Base
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Stage 2: Dependencies
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 3: Builder
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy source code
COPY . .

# Build shared package first
RUN pnpm --filter @darwin-education/shared build

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

RUN pnpm --filter @darwin-education/web build

# Stage 4: Development
FROM base AS development
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy source
COPY . .

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV development
ENV NEXT_TELEMETRY_DISABLED 1

# Development command (will be overridden by docker-compose)
CMD ["pnpm", "dev", "--filter", "@darwin-education/web"]

# Stage 5: Production Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Copy shared package
COPY --from=builder --chown=nextjs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nextjs:nodejs /app/packages/shared/package.json ./packages/shared/

# Set permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "apps/web/server.js"]
