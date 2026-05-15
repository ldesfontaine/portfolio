# syntax=docker/dockerfile:1.6

# ─── Stage 1 : Build Next/Payload ─────────────────────────────────────────────
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

# ─── Stage 2 : Fetch + verify GoatCounter binary ──────────────────────────────
FROM debian:bookworm-slim AS goatcounter-dl

ARG GOATCOUNTER_VERSION=2.7.0
ARG TARGETARCH
# SHA256 of upstream linux-{amd64,arm64}.gz release assets. Bump alongside the version.
ARG SHA256_AMD64=98d221cb9c8ef2bf76d8daa9cca647839f8d8b0bb5bc7400ff9337c5da834511
ARG SHA256_ARM64=ff5b2670b858bbe48802dfdc74130b6dcde2de9f5c1229b838eb9132769307dd

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /tmp
RUN set -eux; \
    case "${TARGETARCH}" in \
      amd64) SHA="${SHA256_AMD64}" ;; \
      arm64) SHA="${SHA256_ARM64}" ;; \
      *) echo "Unsupported TARGETARCH: ${TARGETARCH}" >&2; exit 1 ;; \
    esac; \
    curl -fsSL "https://github.com/arp242/goatcounter/releases/download/v${GOATCOUNTER_VERSION}/goatcounter-v${GOATCOUNTER_VERSION}-linux-${TARGETARCH}.gz" -o goatcounter.gz; \
    echo "${SHA}  goatcounter.gz" | sha256sum -c -; \
    gunzip goatcounter.gz; \
    chmod +x goatcounter

# ─── Stage 3 : Run ────────────────────────────────────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Loopback URL used internally by Next.js when proxying to the bundled GoatCounter.
ENV GOATCOUNTER_INTERNAL_URL=http://127.0.0.1:8080

# Runtime libs for sharp (libvips) + sqlite3 CLI for backups + wget for healthcheck
# + tini so we can run both Next.js and GoatCounter under a proper PID 1.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips42 sqlite3 wget tini \
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
COPY --from=goatcounter-dl /tmp/goatcounter /usr/local/bin/goatcounter
COPY --chown=nextjs:nodejs docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod 0755 /usr/local/bin/entrypoint.sh /usr/local/bin/goatcounter

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/entrypoint.sh"]
CMD ["npx", "next", "start"]
