# Progress Log

This tracks what has actually been built and the implementation-level
decisions made along the way — as distinct from `PLAN.md` (the original
phased plan) and `ARCHITECTURE.md` (the high-level stack rationale). Read
this to see how far the build really is and *why* specific things ended up
the way they did, especially where a decision was made mid-implementation
and never fed back into the earlier docs.

**Status: Phases 1-6 done. Phase 7's containerization half is done — the
deploy target changed from Azure Container Apps to Vercel mid-phase (see
below), so the deploy half is being reworked, not finished as originally
planned.**

---

## Phase 1 — Repo & folder structure

Replaced the old single-project Vue scaffold with the `frontend/` +
`backend/` split described in `ARCHITECTURE.md`. Root `.gitignore`,
`.env.example`, `docker-compose.yml` (Postgres only at this stage).

- Postgres runs on host port **5433**, not 5432 — another local project on
  this machine already owns 5432. The container's internal port is still
  5432; only the host mapping differs. `.env.example`'s `DATABASE_URL`
  reflects this.
- `frontend/tsconfig.node.json` needed an explicit `outDir` — without it,
  `vue-tsc --build`'s composite project emitted `vite.config.js`/`.d.ts`
  straight into the repo root next to the real `vite.config.ts`. Fixed via
  `outDir` plus `.gitignore` entries for the stray files and `*.tsbuildinfo`.
- Frontend/backend are two independent npm projects (two `package.json`s,
  two `npm install`s, two `node_modules/`) rather than an npm-workspaces
  monorepo. Deliberate: dependency isolation (server-only packages like
  `bcrypt` can never leak into the browser bundle) mirrors Phase 7's actual
  multi-stage Dockerfile shape, and it avoids introducing a workspace tool
  on top of everything else that's already new to the team. Revisit if
  type-sharing (below) ever becomes painful enough to justify it.

## Phase 2 — Database schema

One model per collection, plus one structural decision that reshaped the
original plan:

- **`Usuario` replaces the originally-planned separate `Representante` and
  `AdminUser` models.** Gerentes, Representantes, and other staff all live
  in one flat, self-referencing table — each row has a nullable
  `superiorId` pointing at another row in the same table (a Representante's
  superior is their Gerente; a team member's superior is the Representante
  they work under). `isAdmin` is a plain flag on the same table, not a
  separate login system. This came out of a chat discussion once real org
  hierarchy requirements (Gerente → Representante → team) surfaced — see
  `ARCHITECTURE.md`'s Auth section for the full reasoning.
- `Cliente.representanteId` is a real FK into `Usuario` (fixes the old
  prototype's string-name match). `Cliente.contato` (contact person's name)
  was added after comparing against `design-frame/client-detail.html`,
  which shows a field the original schema draft didn't have.
- `Lead.clientUuid` is unique (idempotent retries from the future offline
  outbox); `Lead.capturadoPorId` FKs to `Usuario` — replaces the old
  prototype's free-text "atendente" field entirely.
- Catalog: `Categoria` (+`descricao`, added for design parity) → `Grupo`
  (optional — some categorias are flat) → `Tipo` → `Produto`. A `Tipo`
  attaches to *either* `categoriaId` (flat) *or* `grupoId` (nested), never
  both.
- `Indicacao`: generic across restaurantes/farmácias/transporte/passeios.
  `subcategoria` (e.g. cuisine type) and `distanciaMetros` (admin-entered,
  not computed — there's no "hotel location" setting anywhere in the
  schema) were added once the Restaurantes screens needed them.
- `Orientacao.descricao` (list-screen teaser, distinct from the detail
  page's `OrientacaoSecao` bodies) was likewise added once the actual
  screen was built and the original schema draft was missing it.

**Recurring pattern**: several fields (`Cliente.contato`,
`Categoria.descricao`, `Indicacao.subcategoria`/`distanciaMetros`,
`Orientacao.descricao`) were added *during* Phase 4 frontend work, not
up front — each was caught by comparing the schema against
`design-frame/*.html` while actually building the corresponding screen.
Additive, nullable columns via `prisma migrate dev`, no drama.

## Phase 3 — Backend API, auth

- **Login is required for the whole app**, not just the Admin CMS — a
  scope decision made in chat once it became clear leads needed reliable
  per-user attribution. JWT in an httpOnly cookie, 30-day sliding expiry
  refreshed on every `GET /api/auth/me` call, so a rep logs in once
  (ideally during the pre-expo sync) and stays logged in for the event.
- `requireAuth` (any logged-in `Usuario`) and `requireAdmin` (`isAdmin`
  only) middleware. Bulk-read routes use a generic `crudRouter` factory for
  the straightforward collections; `usuarios` (password hashing, strips
  `passwordHash` from every response) and `orientacoes` (nested `secoes`)
  have hand-written routes instead.
- `POST /api/leads` sets `capturadoPorId` from the session, never from
  client input; a duplicate `clientUuid` returns the existing row instead
  of erroring (the future offline outbox will resend on retry).
- **`GET /api/leads` and `/api/leads/export.csv` are scoped to the
  caller's own leads unless `isAdmin`** — a second chat decision: reps see
  only what they personally captured (simpler mental model, matches a
  personal-tracking use case); admins see everything through the same
  routes via the Admin CMS.
- Seed script (`backend/prisma/seed.ts`) only bootstraps one admin account
  for local dev right now. Real CSV-driven seeding for reps/clients/
  products is intentionally deferred to Phase 8 — the ERP export column
  format isn't agreed yet, and guessing it now risks rework.
- 8 smoke tests (`backend/src/app.test.ts`) covering auth accept/reject,
  lead attribution + duplicate handling, leads-scoping (non-admin vs
  admin), and admin-gate rejection. Run against the real local Postgres,
  not a separate test DB — a deliberate simplification, see `PLAN.md`'s
  testing scope note.

## Phase 4 — Frontend (all 6 slices done)

Built in slices rather than one pass, each verified live in a browser
(Chrome via the claude-in-chrome tooling) with seeded-then-deleted test
data before moving on.

**Slice A — foundations.** Tailwind theme ported 1:1 from
`design-frame/styles.css` (colors, radii, shadows); self-hosted Inter
font (not Google Fonts CDN, so the Phase 5 service worker can precache
it). CNPJ checksum validator, phone/CEP masks, and the accent-insensitive
search helper were **implemented fresh from the standard public
algorithms** — `PLAN.md` originally said to port these from the old
prototype, but that source no longer exists in this repo. Shared shell
(`AppHeader`, `BottomNav`), login screen, and a router guard gating every
route except `/login`. Added `GET /api/auth/me` to the backend along the
way — the frontend needed a way to check "am I still logged in" that
Phase 3 hadn't built yet.

**Slice B — Representantes + Clientes.** Shared UI kit (`Avatar`,
`RowCard`, `ContactRow`, `SectionLabel`, `SegmentedControl`, `TextField`,
`SelectField`, `SearchField`, `AppButton`) built here and reused for
every later slice. The "Representante que atende" fallback pattern (if a
client's rep isn't reachable, show their Gerente) resolves through the
same `Usuario.superiorId` hierarchy from Phase 2.

**Slice C — Leads.** No "Quem cadastrou" field shown to regular users at
all (attribution is silent, server-side only — see Phase 3). Implements
SPECS.md's "if a lead's CNPJ matches an existing client, offer to link
it" via a live suggestion banner as the CNPJ field is typed.

**Slice D — Home.** Global search routes to Clientes if the typed text is
CNPJ-shaped (≥4 digits), else to a tipo-agnostic Representantes search.
**Caught a real bug here**: `BottomNav`'s Repres./Cliente tab icons
(`Users`/`Building2`, picked in Slice A) didn't actually match
`design-frame/index.html`'s SVGs once compared path-by-path — the design
uses `Briefcase`/`LayoutGrid`. Fixed in both the nav and the matching icon
in `ClienteDetailView`.

**Slice E — Produtos catalog.** Handles the flat-vs-nested categoria
split explicitly (see Phase 2): a categoria with `Grupo`s shows "Linhas",
one without shows its `Tipo`s directly. The categoria-level search box
searches every product in that categoria's tree by name or código and
jumps straight to flat results — a genuine "deep search," not just a
filter on the immediate list. Every catalog row uses one consistent
`Package` icon rather than per-category icons (the design has bespoke
icons per real category name, which isn't something the schema captures —
hardcoding a name→icon map felt like the wrong kind of coupling).

**Slice F — Programação, Mapa, Indicações, Orientações.** Mapa da Feira
has **real working zoom** (scale + scroll-pan), not decorative buttons —
`PLAN.md` explicitly flags the static mockup's zoom buttons as
non-functional and calls out real pinch-zoom/pan as follow-up work.
Restaurante's "Ver no mapa" prefers an admin-set `mapaUrl`, falling back
to a constructed Google Maps link from lat/long.

### Cross-cutting notes from Phase 4

- **Type sharing between frontend and backend was deferred, on purpose.**
  `frontend/src/types/domain.ts` hand-duplicates the API response shapes
  rather than sharing a package — revisit if the duplication starts
  causing real drift bugs, but two npm projects (see Phase 1) makes a
  shared-types package a bigger lift than it's worth today.
- **Git identity**: commits in this repo use `João Pricing
  <pricing01@goedert.com.br>` via a per-commit `--author` flag plus
  `GIT_COMMITTER_NAME`/`GIT_COMMITTER_EMAIL` env vars — never by editing
  git config (global or local), which stays untouched for other repos on
  this machine.
- **Tooling gotchas hit while seeding test data** (not app bugs): `docker
  exec` silently drops stdin without `-i`, so a heredoc piped into `psql`
  needs `docker exec -i`. Passing accented characters (ç, õ, ã) through
  `curl -d` on Windows Git-Bash corrupts the UTF-8 bytes — real HTTP
  requests from the actual frontend aren't affected, only ad hoc
  command-line test-data creation; fix by editing via SQL directly instead
  of fighting the shell's encoding.
- **Prisma Client regeneration on Windows** fails with `EPERM` if the
  backend dev server is still running (it holds a lock on the generated
  `.dll.node` file) — stop the dev server before `prisma migrate dev`,
  regenerate, then restart it.

## Phase 5 — Offline / PWA layer

Dexie (IndexedDB) mirrors every bulk-read collection locally; screens read
from Dexie, not `fetch`, so the app works with zero connectivity once
synced.

- `lib/db.ts`: one Dexie table per collection + a `leadsOutbox` table.
  `syncAll()` does a full overwrite-local-with-server's-latest per table
  inside one transaction — no merge/conflict logic needed, since only
  admins ever write these collections and they're always online when they
  do. Triggered on login and on the `online` browser event.
- `lib/outbox.ts`: leads are a write-ahead path, not a synced collection —
  `salvarLeadPendente()` writes to `leadsOutbox` first, then tries to POST
  immediately; `enviarPendentes()` drains the outbox in order and stops at
  the first failure (offline-safe retry, no reordering). A red badge on the
  BottomNav's Leads tab shows the pending count.
- **Real bug caught and fixed**: `stores/auth.ts`'s session restore treated
  *any* `/api/auth/me` failure — including a network failure while offline
  — as "not logged in," which would have bounced an already-logged-in rep
  to `/login` the moment they lost signal at the venue. Fixed by checking
  `error.status === 401` specifically for a real logout; anything else
  (offline) falls back to a `localStorage`-cached session instead.
- `vite-plugin-pwa` (Workbox, `generateSW`) for the service worker.
  Its default precache glob excludes `.jpg` — would have silently dropped
  the 1.2MB Mapa da Feira image, defeating that whole screen's offline
  purpose; fixed with an explicit `globPatterns` list. `globIgnores` drops
  unused non-Latin Inter subsets from the precache.
- Verified live: killed the backend mid-session and confirmed the app
  stayed logged in, browsed synced data, queued a lead, then flushed it
  automatically once the backend came back.

## Phase 6 — Admin CMS

- **Catalog CMS UX**: `design-frame/admin.html`'s mockup shows one flat
  "Produtos" tab, but the real catalog is 4 levels deep. Chose a
  drill-down tree that mirrors the public app's own Categoria → Grupo/Tipo
  → Produto navigation (a flat categoria skips straight to Tipos) over
  four independent flat tabs — reuses a pattern already proven in Phase 4
  Slice E instead of inventing a second one.
- **One generic, config-driven CRUD component** (`AdminCrudView.vue`) —
  table + modal form driven by a `campos`/`colunas` config — reused across
  Usuários, Clientes, Indicações, Programação, and all four catalog levels.
  Mirrors the backend's own `crudRouter` factory precedent. Usuários needs
  bespoke field config (password required-only-on-create, `isAdmin`
  checkbox, superior/gerente picker); Orientações' nested `secoes` editor
  doesn't fit the generic shape at all and got its own bespoke view; Leads
  is read-only (no create/edit, just the existing CSV export).
  Admin-only routes and layout are a `meta.admin` flag: `App.vue` swaps out
  the mobile shell (bottom nav, `max-w-shell`) entirely for these routes
  instead of squeezing a desktop CMS into a 460px mobile frame.
- **Real bug caught and fixed while testing live**: the generic form only
  sent fields that had a visible input, silently dropping the
  `categoriaId`/`grupoId`/`tipoId` a drill-down view injects via
  `itemVazio()` to scope a new row to its parent — new Grupos/Tipos/
  Produtos were saving as orphans. Fixed by sending every key present on
  the form (minus `id`/`createdAt`/`updatedAt`, which must never round-trip
  back to the API), not just the ones with a rendered field.
- **A second, more serious bug found the same way**: deleting an
  Orientação that has `secoes` violated the FK
  (`orientacao_secoes_orientacao_id_fkey`) because the delete route never
  removed its sections first — and that unhandled rejection **crashed the
  entire backend process**, taking the API down for everyone, not just a
  500 to that one request. Root cause: Express 4 doesn't forward a
  rejected async-handler promise to error middleware on its own, and
  nothing in this codebase was catching it. Fixed both the immediate bug
  (delete `secoes` in a transaction before the `Orientacao` itself) and the
  systemic one — every route handler across `auth.ts`, `usuarios.ts`,
  `orientacoes.ts`, `leads.ts`, and `crudRouter.ts` is now wrapped in a
  small `lib/asyncHandler.ts` (`ah()`) that forwards failures to `next()`,
  and `app.ts` has a final catch-all error middleware returning a plain
  500 instead of dying. This means any *other* still-undiscovered
  unexpected DB error is now a contained 500, not a full outage — worth
  keeping in mind for Phase 8's pre-expo drill.
- Verified `isAdmin` enforcement isn't just a hidden UI element: created a
  throwaway non-admin `Usuario` and confirmed via `curl` that it gets a
  403 on POST/PUT/DELETE across `categorias`, `usuarios`, and
  `orientacoes` — matches `PLAN.md`'s Phase 6 done-when criterion of
  testing with a *valid* non-admin session, not just a missing one.

## Phase 7 — Containerize (deploy target changed mid-phase)

Built and verified the container packaging exactly as `PLAN.md` describes,
before the deploy target changed:

- Root-level multi-stage `Dockerfile`: frontend build → backend build (+
  `prisma generate`) → a Debian-slim runtime combining both. Debian-slim,
  not Alpine, per `PLAN.md`'s own note — confirmed why the hard way: even
  Debian-slim needs `libssl` installed explicitly (`apt-get install
  openssl`) or Prisma can't detect which engine binary to use at all.
- `backend/src/app.ts` now serves the built frontend as static files with
  an SPA fallback (unmatched non-`/api` paths get `index.html`, unmatched
  `/api/*` paths still 404) — but only when a `public/` dir exists next to
  the compiled `dist/`, so local dev via the Vite proxy is untouched.
- `prisma` moved from a dev dependency to a real one — the container needs
  the CLI, not just `@prisma/client`, to run `prisma migrate deploy` on
  every start (idempotent, safe to re-run).
- `docker-compose.yml` gained an `app` service: builds from the Dockerfile,
  waits on Postgres's healthcheck, and refuses to start without a real
  `JWT_SECRET` (`${JWT_SECRET:?...}` — no insecure default baked in).
- Verified locally end-to-end via `docker compose up`: health check,
  frontend load, SPA routing, login, and the full Admin CMS all worked
  through the one container on `localhost:8080`, backed by the same
  Postgres migrations, no code changes from local dev.

**Deploy target changed from Azure Container Apps to Vercel's free
(Hobby) tier** — a user decision made after the container image was
already built and tested, not something `PLAN.md` anticipated. This is a
real architecture mismatch, not just a hosting swap: Vercel's Hobby tier
has no persistent container runtime — no long-lived Express process, no
arbitrary Dockerfile deploys. It's a static-asset CDN plus short-lived
serverless functions. See the next entry (once the adaptation work
happens) for how the backend gets reshaped to fit that model, and what
changes for Postgres hosting and Prisma connection handling.

---

## What's next

Reworking Phase 7's deploy half for Vercel instead of Azure Container
Apps — adapting the Express backend to run as Vercel serverless
functions, moving Postgres to a serverless-friendly managed provider
(Neon/Supabase/Vercel Postgres), and moving `prisma migrate deploy` out of
server startup into a build-time step. Then **Phase 8** (real content
population from ERP CSVs, create real `Usuario` accounts for all staff,
pre-expo Lighthouse/install drill).
