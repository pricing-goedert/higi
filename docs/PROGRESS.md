# Progress Log

This tracks what has actually been built and the implementation-level
decisions made along the way — as distinct from `PLAN.md` (the original
phased plan) and `ARCHITECTURE.md` (the high-level stack rationale). Read
this to see how far the build really is and *why* specific things ended up
the way they did, especially where a decision was made mid-implementation
and never fed back into the earlier docs.

**Status: Phases 1-4 done. Phase 5 (offline/PWA layer) is next.**

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

---

## What's next

Per `PLAN.md`: **Phase 5** (Dexie/IndexedDB offline layer, `leadsOutbox`,
switching reads from `fetch` to Dexie, `vite-plugin-pwa`), then **Phase 6**
(Admin CMS), **Phase 7** (containerize + deploy), **Phase 8** (real content
population from ERP CSVs + pre-expo drill).
