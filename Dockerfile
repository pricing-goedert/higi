# Debian-slim, not Alpine — Alpine's musl libc has a documented history of
# mismatching Prisma's prebuilt query-engine binary. Same base in every
# stage that compiles/runs native modules (bcrypt, Prisma) to keep them
# consistent with the runtime.
ARG NODE_IMAGE=node:20-bookworm-slim

FROM ${NODE_IMAGE} AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM ${NODE_IMAGE} AS backend-build
# node:20-bookworm-slim has no libssl — Prisma's engine binaries need it to
# even detect which OpenSSL version to target, both here and at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate
RUN npm run build

FROM ${NODE_IMAGE} AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev
# The generated Prisma client's query-engine binary must come from a build
# that ran on this same base image — copying it from backend-build (built
# on the identical ${NODE_IMAGE}) rather than regenerating avoids doing the
# native compile twice.
COPY --from=backend-build /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-build /app/backend/node_modules/@prisma ./node_modules/@prisma
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/prisma ./prisma
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 3000
# `migrate deploy` only applies pending migrations and is safe to re-run on
# every container start — no separate migration step to remember.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
