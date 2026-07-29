# CLAUDE.md

Instructions for AI coding agents (Claude Code or others) working in this repository.

## What this repo is

The Higiexpo trade-show app for Goedert Group — lets sales reps look up whether a
client already exists (and which representative/seller owns them), capture new
leads offline, and browse a product catalog, all under poor venue connectivity.
See `docs/SPECS.md` for the functional spec and `docs/ARCHITECTURE.md` for the
technical decisions and their reasoning.

## Repo layout (read this before touching anything)

- `docs/design-frame/` — a static HTML/CSS-only visual reference recreated from the
  old prototype's design language (colors, cards, buttons, forms, nav). It has
  **no JavaScript logic and no backend** on purpose — it exists purely so the
  real rebuild has an exact visual target to implement against. Copy the CSS
  values and markup patterns from it; do not build features inside it.
- `docs/` — `ARCHITECTURE.md`, `SPECS.md`, `README.md`. This file (`CLAUDE.md`)
  stays at the repo root by convention (auto-loaded by Claude Code); the rest
  of the docs live in `docs/`.
- Everything else (the real app) does not exist yet — it gets built fresh per
  `docs/ARCHITECTURE.md`.

## Ground rules for new code

- Frontend: Vite + TypeScript + Vue 3 (Vue Router + Pinia) + Tailwind. No
  other frontend framework.
- Backend: a small Node.js REST API, containerized with Docker. Keep it
  boring — bulk read endpoints + a leads endpoint + admin-auth-gated write
  endpoints. No cloud-proprietary managed services (no Azure Functions
  Database Connections, no Cosmos DB, no Firebase) — the whole point is a
  portable stack that runs in any container host.
- Database: PostgreSQL. Object storage: S3-compatible (Azure Blob Storage,
  AWS S3, or MinIO — don't hardcode one).
- Auth: custom JWT + bcrypt in the Node API. No cloud-managed auth service.
- Offline: Dexie.js over IndexedDB for the synced local dataset + a leads
  outbox; `vite-plugin-pwa` for the service worker. Don't hand-roll a service
  worker or an IndexedDB wrapper from scratch.
- Fix the data model issue the old prototype had: a client's linked
  representative must be a real foreign key (`representante_id`), not a
  string name match.
- Keep things as simple as possible — this app is built and maintained by a
  small, non-dedicated team under a hard trade-show deadline. Prefer the
  boring, well-documented option over the clever one.

## Before making architectural changes

Read `docs/ARCHITECTURE.md` for the *why* behind each stack choice — several were
deliberately chosen over more "modern" alternatives (e.g. plain Postgres over
Cosmos DB, custom JWT over a managed auth service) specifically for
portability. Don't reintroduce cloud-specific services without checking with
whoever owns this decision.
