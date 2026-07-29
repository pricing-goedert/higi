# Build Plan

This is the detailed build-out plan for the real Higiexpo app, agreed on
after the feasibility discussion in `ARCHITECTURE.md`/`SPECS.md`. Those two
files say **what** the app is and **what stack** was chosen; this file says
**why each piece of that stack won over its alternatives**, **in what order
to build it and why that order**, and **what "done" looks like at each step**
so progress can be checked against expectations rather than guessed at.

Nothing has been built yet as of this writing — `design-frame/` (visual
reference) is the only thing that exists besides docs.

---

## Part 1 — Why each technology, over its alternatives

### Frontend

**Vite** — a build tool, nothing more. In development it serves files and
hot-reloads the browser on save; for production it bundles everything into
static HTML/JS/CSS that needs no server to run. It doesn't care whether the
code is vanilla JS, Preact, or React — that choice is separate and below.
Chosen simply because it's the standard, best-documented build tool for
this kind of frontend today.

**Vue 3** (with Vue Router + Pinia) — chosen over two alternatives:
- *vs. staying vanilla JS* (like the old prototype): vanilla means
  hand-writing DOM-update code for every screen. With ~20+ screens plus an
  admin CMS that repeats the same list/create/edit pattern six times, that's
  a lot of copy-paste, and copy-paste is where "I fixed it in one place but
  not the other three" bugs come from. Vue's components let you write
  "client card" or "form field" once and reuse it everywhere.
  **Disadvantage of Vue here:** it's new to a team whose only existing code
  (the old prototype) is vanilla JS — real ramp-up time, not free.
- *vs. Preact*: Preact ships a much smaller runtime (~3kb vs. Vue's
  ~20-34kb before router/state), which matters given the slow-connection
  requirement — every kilobyte is something a rep's phone has to download
  before the app even starts working on bad venue wifi. Preact was the
  original candidate for this app for exactly that reason. Vue was adopted
  instead because its official, integrated Vue Router + Pinia ecosystem and
  `v-model` template ergonomics were judged worth the extra weight — a
  consciously accepted tradeoff, not an oversight. The extra ~30kb is a
  fixed app-shell cost that doesn't grow with data/catalog size and shrinks
  to a rounding error once real content is synced; it only adds friction at
  specific moments (first install/pre-expo sync, app updates), not to
  steady-state offline use once the service worker has cached the shell.
  **Disadvantage of Vue vs. Preact:** more JavaScript to download on that
  first load.

**TypeScript** — catches data-shape mistakes (a typo'd field name, a numeric
ID accidentally treated as a string) at build time, before the mistake ever
reaches a rep's phone at the expo. Since the backend is also TypeScript
(below), the frontend and backend can share one set of type definitions for
`Cliente`, `Produto`, etc. — no risk of two hand-maintained copies drifting
apart. **Disadvantage:** another new concept for a team that's absorbing
several new things at once (see Blind Spots). **Alternative rejected:**
plain JavaScript — zero learning curve, matches the old prototype exactly,
but no safety net.

**Tailwind** — utility CSS classes applied directly in markup; it scans the
project and only outputs CSS for classes actually used. Decoupled entirely
from the Preact/TypeScript decision — it would work identically with any of
them. Chosen because `design-frame/styles.css` already has the exact
approved values (colors, radii, spacing) to translate into Tailwind's theme
config — this is a direct port of already-approved design values, not a
new design exercise.

### Backend

**Node.js, at all** — the one reason a backend exists: leads and
admin-edited content have to live in one shared place every rep's device
reads from. A purely static frontend cannot receive a write from one phone
and make it show up on another phone — something server-side has to hold
that shared data and accept writes to it. Node was picked for this role
specifically because it's already in the stack and now shares TypeScript
types with the frontend — not because any cloud provider requires it.

**Express** — chosen over two alternatives:
- *vs. Fastify*: Fastify is measurably faster at very high request volumes.
  This app will see dozens of reps' devices syncing occasionally, nowhere
  near the traffic where that speed difference would ever be noticed.
  Express has the deepest documentation/tutorial base and largest
  middleware ecosystem of any Node framework — the "boring, well-documented"
  choice wins when the performance difference is irrelevant at this scale.
- *vs. a raw Node `http` server*: maximum control, zero framework, but you
  end up re-implementing routing, body parsing, and middleware patterns
  Express already provides — no benefit at this project's size.

**Prisma** — chosen over two alternatives:
- *vs. Drizzle*: Drizzle is a lighter-weight, more SQL-like typed query
  builder with less generated "magic" than Prisma — arguably more
  transparent about the exact query it runs. But Drizzle is younger, with a
  smaller community and far fewer tutorials to lean on when stuck. Prisma
  additionally ships **Prisma Studio**, a visual database browser/editor —
  genuinely useful for a team that isn't backend-specialist to inspect data
  without writing SQL by hand.
- *vs. raw `pg` + node-pg-migrate*: raw `pg` means hand-writing every SQL
  query as a string and hand-writing migration files — total transparency,
  but zero type safety. Rename a column and nothing warns you that three
  other files still reference the old name; it fails silently until
  runtime. Prisma's schema file generates both migrations and a fully-typed
  client, so `prisma.cliente.findMany(...)` autocompletes and errors at
  build time on a typo. Given the team isn't backend-specialist, that
  safety net is worth more here than raw SQL's transparency.
  **Disadvantage of Prisma either way:** one extra command (`prisma
  generate`) to remember after schema changes, and a real Docker packaging
  gotcha (see Blind Spots #4 below).

**PostgreSQL** — chosen over Azure Cosmos DB specifically because Postgres
runs anywhere (a container on a laptop, a container on Azure, a managed
instance on any other cloud) — Cosmos DB is Azure-proprietary and would
quietly reintroduce the vendor lock-in the whole "package it in Docker"
requirement exists to avoid. It's also simply the most mature, best
understood relational database, supported by every hosting provider without
exception.

**JWT + bcrypt hand-rolled in the API** — chosen over a managed auth service
(Azure AD, Auth0, Firebase Auth) for the same portability reason as the
database: a managed auth service is another cloud-specific dependency.
Even though every staff member (Gerentes, Representantes, other staff) now
needs an account — not just a small number of admins, once login became
required app-wide — hand-rolled auth is still a modest, extremely
well-trodden amount of code at this scale. bcrypt specifically because it's
a deliberately slow password-hashing algorithm, which resists brute-force
attacks far better than a fast hash like SHA-256. This also fixes a real
gap in the old prototype, where "is this person an admin" was a client-side
JavaScript check only, with no server enforcement at all — anyone could
bypass it by editing the page.

**JWT stored in an httpOnly cookie, long-lived** — chosen over
`localStorage` because an httpOnly cookie cannot be read by JavaScript at
all, even if a malicious script somehow got injected into the page.
`localStorage` is fully readable by any script running on the page, making
a stolen session far easier if that ever happened. Costs almost nothing
extra given frontend and backend share one origin (see below). The token's
expiry is set long and refreshed on every online request specifically so a
rep logs in once (ideally during the pre-expo sync) and isn't prompted
again for the rest of the event — see `SPECS.md`'s Login section.

### Offline layer

**Dexie.js** — chosen over using the browser's raw IndexedDB API directly.
Raw IndexedDB is callback-based, verbose, and notoriously easy to get
subtly wrong. Dexie wraps it in a promise-based, well-documented API used
by thousands of production PWAs. There is no upside to hand-rolling this
from scratch, only risk.

**`vite-plugin-pwa` (built on Workbox)** — chosen over hand-writing a
service worker. Service worker bugs (stale caches, broken update flows,
cache corruption) are famously hard to debug. Workbox is the
industry-standard library Google itself maintains for exactly this
purpose — using it is the "boring, well-documented" choice, not the
clever one.

### Infrastructure

**Docker, at all** — the hard requirement behind several choices above:
whatever gets built has to run in a container on any host, since it will
land on Azure first but must not be *locked* to Azure.

**Single container for frontend + backend** (a recommendation, flaggable) —
the Node API serves its own REST routes and the built frontend's static
files, in one Docker image. Advantage: one thing to deploy, and no CORS
configuration needed since both are served from the same origin.
**Alternative considered:** two containers (a separate static file server
for the frontend + the API container) — more conventional, and would allow
scaling frontend and backend independently. That benefit doesn't apply at
trade-show scale (dozens of concurrent reps, not a public consumer
product), so it would only add deployment complexity without a matching
gain here. This choice only affects the *deployed* artifact — during local
development, Vite's own dev server still runs separately for hot-reload and
proxies API calls to the backend on another port.

**CSV as the data-loading mechanism** — chosen over connecting live to the
ERP's own database or API. This is a simplification, not a shortcut: a CSV
export is something any ERP can produce without involving that system's own
IT/security team, and it avoids building and maintaining a live integration
to a system outside this project's control. The import is written as a
**one-off, safely re-runnable script** (upserts by CNPJ/código, so running
it twice never creates duplicates) rather than a polished recurring admin
feature — because it's expected to run rarely, by a developer, not by
admins day-to-day.

**Deferred: real photo upload.** Product photos start as a plain URL text
field (matching the old prototype's own schema, where `foto` was already
just a URL or null). This was confirmed to be genuinely free to defer: real
upload later is purely additive — one new upload endpoint plus swapping a
text input for a file-picker that fills the same field — the database
schema, the product detail screen, and the offline sync layer never need to
change either way.

**Deferred: automated testing beyond a minimal set.** A handful of smoke
tests get written alongside the highest-risk logic as it's built (lead
creation + duplicate prevention, auth, CNPJ validation, CSV import upsert
logic) rather than a full test suite. Unlike the photo-upload deferral,
this one does have a real (if small) cost the longer it's postponed — bugs
in this exact logic are cheapest to catch the week they're written, not the
week before the expo.

---

## Part 2 — Build order: what, why this order, and what "done" looks like

Each phase depends on the previous one existing and working — that
dependency is the reason for this order. "Done when" is written so you can
check what's been built against what was expected, without needing to read
code.

### Phase 1 — Repo & folder structure

**What:** create `frontend/` (Vite + Vue 3 + TypeScript + Tailwind) and
`backend/` (Node + TypeScript + Express + Prisma) folders in this same
repo, plus a root `docker-compose.yml` and `.env.example`. One repo, not
separate repos, to match "small non-dedicated team, keep it simple."

**Why first:** every later phase needs to know where its files go.

**Done when:** the folders exist with empty/skeleton projects
(`package.json` in each, no real features yet); `docker compose up`
starts a local PostgreSQL container without errors (nothing else needs to
work yet).

### Phase 2 — Database schema + local Postgres

**What:** write `backend/prisma/schema.prisma` with one model per
collection — `Usuario` (Gerentes, Representantes, and other staff in one
self-referencing table via a nullable `superiorId`, plus an `isAdmin` flag
— replaces the separately-planned `Representante`/`AdminUser` models, see
`ARCHITECTURE.md`'s Auth section), `Cliente` (with a real
`representanteId` foreign key into `Usuario`, fixing the old prototype's
plain string-name match), `Produto`, `Lead` (with a unique `clientUuid`
column for safe retries, and `capturadoPorId` linking to the `Usuario` who
saved it), `Indicacao`, `Orientacao`, `Programacao`. Run `prisma migrate dev`
to create the tables.

**Why before backend code:** the API's routes and TypeScript types are
shaped by what's in the schema — writing routes first means guessing at
data shapes and redoing them once the schema is final.

**Done when:** `prisma migrate dev` runs cleanly against the local
Postgres from Phase 1; `npx prisma studio` opens and shows all the
(currently empty) tables; every field named in `SPECS.md` for each screen
has a home in some table.

### Phase 3 — Backend API skeleton, auth, and the CSV seed script

**What:** an Express app with a Prisma client; `POST /api/auth/login`
(bcrypt + JWT, the one genuinely public route) issuing a long-lived httpOnly
cookie; a `requireAuth` middleware guarding every other route (any logged-in
`Usuario`, matching the app-wide login requirement in `SPECS.md`) and a
`requireAdmin` middleware layered on top of it for CMS write routes only;
bulk-read endpoints (`GET /api/clientes`, `/api/usuarios`, `/api/produtos`,
etc.) behind `requireAuth`; `POST /api/leads` behind `requireAuth` too,
setting `capturadoPorId` from the session rather than trusting client input,
and rejecting duplicate `clientUuid`s; basic rate limiting on
`/api/auth/login` (the remaining public route); the CSV seed script
(`backend/prisma/seed.ts`), written to upsert by natural key so re-running
it is safe; the minimal smoke tests for this phase's logic.

**Why before the frontend:** the frontend needs real endpoints to call.
Building UI against a backend that doesn't exist yet means mocking it and
then rewiring everything once the real API exists — this skips that
rework entirely.

**Done when:** `GET /api/health` returns success with no auth; every
bulk-read endpoint returns valid JSON (even if empty) when called with a
valid session and is rejected without one; posting a lead twice with the
same `clientUuid` only creates one row, and the created row's
`capturadoPorId` matches the session that posted it; logging in with a real
`Usuario`'s credentials returns a working JWT, and a wrong password or no
credentials is rejected; a write attempt to an `isAdmin`-gated route by a
logged-in but non-admin `Usuario` (not just a missing/invalid JWT) is
rejected by the API itself (test with `curl`, not just by checking the UI
hides the button); running the seed script twice against a freshly reset
database produces the exact same row counts both times; the smoke tests
pass.

### Phase 4 — Frontend scaffold, connected online-only (no offline layer yet)

**What:** scaffold Vite + Vue 3 + TypeScript, add Tailwind using
`design-frame/styles.css`'s values, and build every screen from
`SPECS.md` — including the login screen now required in front of everything
else (see `SPECS.md`'s Login section) — calling the Phase 3 backend
directly with `fetch` — **no IndexedDB, no service worker yet.** Implement
the CNPJ checksum validator, phone/CEP masks, and the accent-insensitive
`norm()` search helper from the standard public algorithms (the old
prototype's source no longer exists in this repo to port from).

**Why online-only before offline:** offline-first (service worker +
local database + a sync/outbox layer) is a second, independent layer of
complexity. Building both at once means any bug could be in the network
code, the caching code, or the sync code, with no way to isolate which.
Verifying plain client-server behavior works first means Phase 5's bugs
are guaranteed to be about caching/sync specifically, not about whether
the basic feature works at all. This is the single most important
sequencing decision in the whole plan, and the one most tempting to skip
under time pressure.

**Done when:** an unauthenticated visitor is sent to the login screen and
every other screen is unreachable without logging in first; once logged in,
every screen in `SPECS.md` is reachable via the bottom-tab navigation;
searching for a representative or client actually hits the real backend
and shows real results; submitting the lead form creates a real row with
`capturadoPorId` set to the logged-in user (checked via `GET`/Prisma
Studio); CNPJ validation rejects an invalid number and accepts a valid one;
searching "Sao Paulo" (no accent) still finds "São Paulo" in results — with
the app fully broken/blank the moment there's no network connection
(expected at this phase; that gap closes in Phase 5).

### Phase 5 — Offline layer

**What:** a Dexie (IndexedDB) schema mirroring the synced collections plus
a `leadsOutbox` table; a `syncAll()` function that pulls each bulk
endpoint into Dexie on app load (and via a manual "Atualizar dados"
button); the app's data-reading code switched from Phase 4's direct
`fetch` calls to reading from Dexie instead; leads now write to
`leadsOutbox` immediately and flush to the backend whenever the device
comes online, a manual sync is triggered, or the app is opened, with a
visible pending-count indicator; `vite-plugin-pwa` wired up with a web app
manifest and Workbox precaching.

**Why after Phase 4:** this phase's bugs are now isolated to "the
sync/cache layer," since the underlying API and UI already work on their
own. Note there's no merge/conflict logic to build for the synced
collections — reps never edit them locally, only admins do (always
online), so every sync is simply "overwrite local with the server's
latest."

**Done when:** turning on airplane mode, a previously logged-in session
stays logged in and every previously-synced screen still shows data (no
forced re-login just because there's no network to reach `/api/auth/login`);
creating a lead offline
shows it immediately with a visible "pending" indicator; reconnecting (or
tapping "sync now") clears the pending indicator and the lead is
confirmed present via the backend; a Lighthouse PWA audit reports the app
as installable; "Add to Home Screen" actually installs and opens the app
standalone on a real Android phone and a real iPhone.

### Phase 6 — Admin CMS

**What:** list/create/edit/delete screens for every collection except
leads (read-only + CSV export, same as the old prototype), matching
`design-frame/admin.html`'s visual pattern, calling Phase 3's `isAdmin`-gated
routes directly — **no Dexie involved**, since admins are assumed to
always be online when editing content, unlike reps browsing the show
floor. Reuses the same login screen and session from Phase 4 (no separate
CMS login) — a logged-in `Usuario` without `isAdmin` simply can't reach
this area or its routes. Product photo field is a plain URL text input.

**Why after Phase 5, not before:** the CMS's data model and API routes
were already built in Phase 3; this phase is "just" UI on top of routes
that already work, and it benefits from the same design patterns
(list/detail/form components) already built for the public app in Phase 4.

**Done when:** a logged-in `Usuario` with `isAdmin` can reach the CMS and a
logged-in `Usuario` without it cannot; a wrong password at login is
rejected same as always; every collection's create/edit/delete actually
persists to Postgres (verify in Prisma Studio); a CSV export of leads
downloads and opens correctly; attempting any write via `curl` with a
valid non-admin session (not just no session at all) is rejected by the
API, not just hidden by the UI.

### Phase 7 — Containerize + deploy

**What:** a multi-stage `Dockerfile` — one stage builds the frontend,
the next stage builds the backend and serves the built frontend's static
files alongside its own API routes. Use a Debian-slim Node base image (not
Alpine) to avoid a known Prisma-in-Docker binary-mismatch gotcha. Extend
`docker-compose.yml` to include the app container plus Postgres, wired via
env vars. Deploy the same image to Azure Container Apps.

**Why after the app works locally:** there's no reason to debug Docker
packaging issues at the same time as debugging application logic — get
the app right first, then package something that already works.

**Done when:** `docker build` succeeds and produces a single image;
`docker compose up` serves the complete working app (frontend + API +
Postgres) with no code changes from local dev; the same image, deployed to
Azure Container Apps, is reachable over HTTPS (required for the service
worker/PWA install to work at all) and installs there too; no secret
values are hardcoded anywhere in the image or the repo.

### Phase 8 — Content population + pre-expo drill

**What:** obtain real ERP CSV exports (representantes, clientes, produtos
at minimum) in the agreed column format; run the seed script once against
the production database; create real `Usuario` accounts for every Gerente,
Representante, and other staff member who'll use the app (via CSV import
or the CMS), with `isAdmin` set on the actual admin accounts; run a full
pre-expo
QA pass (Lighthouse, airplane-mode QA on every screen, real device
installs) and a **rehearsed drill** with actual reps of the "sync before
the expo starts" and "open the app at least once daily during the expo"
habits.

**Why last:** everything before this needs to already work before it's
worth loading real data and involving the actual sales team's time.

**Done when:** the production database's row counts match the source CSV
files; every real staff member can log in with their own account; the
airplane-mode QA checklist passes
on both a real Android phone and a real iPhone; at least one rep has
successfully completed the full drill (sync at the hotel → go offline →
create a test lead → reconnect → confirm it synced) without help.

---

## Part 3 — Blind spots, risks & limitations

Worth knowing about before starting, not discovering mid-build or at the
event itself:

1. **Service worker update lifecycle during a live, one-time event.** If a
   bug is found *during* the expo, how does an already-installed PWA get
   the fix? Needs a deliberate update-and-reload strategy, tested before
   the event — arguably the single biggest operational risk specific to
   using a PWA at a live event.
2. **`POST /api/auth/login` is public and unauthenticated by necessity** (you
   need it to get a session in the first place). Mitigated with basic rate
   limiting (Phase 3), but the app accepts a small residual abuse risk
   rather than eliminating it entirely (no CAPTCHA, no account lockout).
   `POST /api/leads` is no longer in this category — requiring login
   app-wide (see `SPECS.md`) means it's authenticated like everything else,
   which incidentally closes what used to be the bigger of the two risks
   here.
3. **Secrets management is a process gap, not just a technical one.**
   `JWT_SECRET` and `DATABASE_URL` must never be committed to the repo —
   decide who holds the real production values and how they get into the
   Azure Container Apps environment.
4. **IndexedDB schema versioning.** Once reps' devices have synced data
   before the expo, any later schema change needs a proper Dexie version
   bump with an upgrade path, or devices with a stale local schema can
   break mid-event. The same discipline applies to Postgres via Prisma
   migrations — never hand-edit the schema without one.
5. **Storage quota / eviction on mobile browsers.** Request persistent
   storage on first load to reduce eviction risk, and keep the total
   cached payload (product photos + the map image) modest — a concrete
   target like "well under ~30MB total" is worth setting.
6. **Single-container topology is a deliberate, accepted limitation, not an
   oversight** — frontend and backend can't scale independently. Irrelevant
   at trade-show scale, but worth knowing it was a conscious tradeoff.
7. **CSV re-import being a manual, undocumented process is its own risk.**
   Since it's a script a developer runs by hand, write a short runbook
   (exact command, expected output, how to verify success) so it isn't
   tribal knowledge if the original developer is unavailable when it needs
   to happen again.
8. **Team knowledge gap, not a technology gap.** Vue, TypeScript, Prisma,
   Docker, and JWT auth are all new simultaneously to a team that mostly
   built the old prototype with marketing + AI assistance. Budget real
   ramp-up time in Phases 1–2, not just "read the docs as you go."
9. **iOS platform limitations, summarized:** no true background sync
   (Phase 5), Safari-only rendering engine even inside an installed PWA (so
   all iOS testing must specifically be on Safari/WebKit), no native
   hardware access (barcode/NFC) if that's ever wanted later, and no
   forced-update mechanism — updates rely entirely on the service worker's
   own check cadence (ties back to blind spot #1).
10. **Distribution is a communication task, not a technical one.** Without
    an app store listing, reps need a direct install URL or QR code and
    clear "Add to Home Screen" instructions — decide who sends that and
    when (ties to the Phase 8 drill).

---

## Part 4 — Final verification checklist

- Smoke tests from Phase 3 pass, run continuously as code changes, not
  just once at the end.
- Seed script re-run twice against a fresh database produces zero
  duplicates.
- Lighthouse PWA audit passes (installability, offline start_url, manifest
  validity) on the deployed app.
- Manual offline QA: airplane mode, every screen, create a lead, confirm
  it queues with a visible pending count; reconnect and confirm it reaches
  the backend and the count clears.
- Real Android phone and real iPhone installs tested (not just desktop
  DevTools emulation) — this is where the iOS-specific blind spots
  actually show up.
- Admin write permissions confirmed enforced by the API itself (attempt a
  write with no/invalid JWT via `curl`, not just checking the UI hides the
  button).
- The Docker image runs identically outside Azure (`docker compose up`
  locally) to validate the portability goal.
- Deploy a trivial change and confirm the service worker's update flow
  actually prompts a reload on an already-installed device — the one blind
  spot that's easy to assume works without ever having tested it.
