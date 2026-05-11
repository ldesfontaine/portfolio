# syntax=docker/dockerfile:1.6

# ─── Stage 1 : Build ──────────────────────────────────────────────────────────
FROM node:22-slim AS builder

WORKDIR /app

# Native build deps for sharp.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --include=dev

COPY . .

ARG SITE_URL
ENV SITE_URL=$SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1
# next build needs PAYLOAD_SECRET to be present even if fake; real value
# comes from runtime env in production.
ENV PAYLOAD_SECRET=build-time-placeholder-do-not-use-in-prod

RUN npm run build

# Drop dev deps for the runner.
RUN npm prune --omit=dev

# ─── Stage 2 : Run ────────────────────────────────────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Runtime libs for sharp (libvips) + sqlite3 CLI for backups + wget for healthcheck.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips42 sqlite3 wget \
  && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# Persistent data dirs (mounted as volumes by docker-compose).
RUN mkdir -p /data /app/media && chown -R nextjs:nodejs /data /app/media

COPY --from=builder --chown=nextjs:nodejs /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/app ./app
COPY --from=builder --chown=nextjs:nodejs /app/payload.config.ts ./payload.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/payload-types.ts ./payload-types.ts
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --chown=nextjs:nodejs docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["npx", "next", "start"]
