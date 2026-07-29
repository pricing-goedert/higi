# Architecture

This describes the decided technical architecture for the Higiexpo PWA rebuild,
and the reasoning behind each choice. See `SPECS.md` for what the app needs to
do, and `CLAUDE.md` for repo-specific rules when writing code.

## Why a PWA at all

The app needs to be installable and usable in ~2 months, with no time for App
Store/Play Store review, and needs to work with little-to-no connectivity at
the trade-show venue. A PWA (installed via "Add to Home Screen" from the
browser) satisfies both: no store review, and full control over offline
behavior via a service worker + local database.

## Frontend: Vite + TypeScript + Vue 3 + Tailwind

- **Vite**: build tool only. Produces static HTML/JS/CSS with no server
  required to run it. Same tool regardless of UI framework — the choice of
  UI approach doesn't affect how Vite bundles.
- **Vue 3** (with Vue Router + Pinia): chosen over staying vanilla-JS because
  the app has 20+ screens plus an admin CMS that repeats near-identical CRUD
  forms six times — Vue's component model (write "client card" once, reuse
  everywhere) removes most of the copy-paste vanilla DOM manipulation needs.
  Preact was the original candidate for this same reason at a much smaller
  bundle size (~3kb vs. Vue's ~20-34kb runtime, before router/state), which
  mattered given the slow-connection requirement — Vue was adopted instead
  because the official, integrated Vue Router + Pinia ecosystem and `v-model`
  template ergonomics were judged worth the extra weight. This is a
  consciously accepted tradeoff, not an oversight: the extra ~30kb is a fixed
  app-shell cost (it doesn't grow with data/catalog size, and shrinks to a
  rounding error once real content is synced), and it only adds friction at
  specific moments — first install/pre-expo sync and app updates — not to
  steady-state offline use once the service worker has cached the shell.
- **TypeScript**: catches data-shape mismatches (e.g. a `cliente` object
  missing a field, or a `representante_id` treated as a string) at build
  time instead of live on a device at the expo.
- **Tailwind**: utility-class CSS, scans the files you point it at and only
  ships the CSS actually used. Independent of the frontend framework choice.

Both Vue and TypeScript are new to the team relative to the old prototype
(which was vanilla JS) — budget ramp-up time early, not mid-crunch.

## Offline/PWA layer

- **`vite-plugin-pwa`** (wraps Workbox) generates the service worker —
  precaches the app shell so the app loads with zero network after the first
  visit. Don't hand-roll this.
- **Dexie.js** (IndexedDB wrapper) stores the synced copies of
  clientes/representantes/produtos/indicações/orientações/programação. All
  search/filter happens against this local data — the backend never needs to
  support search queries, only bulk sync.
- **Leads outbox pattern**: every lead created writes to an IndexedDB
  `leadsOutbox` table immediately (instant, no spinner, no wait for network).
  A listener on the `online` event, plus a manual "Sync now" button, flushes
  the outbox to the backend and clears synced rows. A visible "N leads
  pending sync" indicator keeps this from being invisible to the rep.
- **Web App Manifest**: `display: standalone`, Goedert icon, `#143C52` theme
  color, for "Add to Home Screen" install.

### iOS is the platform risk to know about

There is no true Background Sync API on iOS Safari — the outbox only flushes
while the app is open and online at that moment, never silently in the
background. Operational mitigation: reps are required to open the app at
least once a day during the expo (flushes pending leads daily) and to
sync/download the app before the expo starts (avoids relying on a first sync
at the congested venue). Safari's storage eviction (ITP) can also clear
IndexedDB/localStorage after ~7 days of disuse — always re-sync on app open
when online to cover this too.

## Backend: Node.js REST API in Docker

Node.js exists here for one reason: leads and admin-edited content have to
live in a shared place every rep's device reads from — a static frontend
alone cannot receive a write from one phone and make it visible on another.
*Something* server-side has to hold that data and accept writes to it.

Cloud-managed options exist that avoid hand-written backend code entirely
(e.g. Azure's Database Connections + role-based rules). Those were
deliberately **not** chosen, because the requirement is a **portable Docker
container** that isn't locked to Azure — it happens to deploy there today but
must be runnable on any container host later with no rewrite. A real running
server process in the container is the honest way to satisfy that, and
Node.js is a reasonable, boring choice for it — mainly because it's already
in the considered stack and shares a language with the frontend, not because
any cloud provider requires it.

The API stays intentionally narrow, since search happens entirely
client-side against synced data:
- `POST /api/auth/login` — the one genuinely public, unauthenticated route;
  everything else requires the resulting session.
- `GET /api/auth/me` — returns the current session's user, since the JWT
  lives in an httpOnly cookie the frontend can't read directly; this is how
  the app knows "am I still logged in" after a refresh.
- `GET /api/clientes`, `/api/usuarios`, `/api/produtos`, etc. — bulk reads
  for the sync layer, gated behind "is there a valid logged-in session" (any
  `usuarios` row, not admin-only — see Auth below for why the whole app now
  requires login).
- `POST /api/leads` — lead capture, also behind a logged-in session (so
  `capturado_por_id` can be set from the session rather than trusted client
  input).
- `GET /api/leads` and `GET /api/leads/export.csv` — scoped to the caller's
  own `capturado_por_id` unless `isAdmin` is set, in which case every lead
  is returned. This is what both the main app's personal Leads tab and the
  Admin CMS's read-only Leads tab (all leads) read from — same route, the
  scope just depends on who's asking.
- `isAdmin`-gated write endpoints for the CMS (usuarios, clientes, produtos,
  indicações, programação, orientações).

No real-time listeners, no WebSockets — the old prototype never used
Firestore's `onSnapshot` either, so plain REST is sufficient.

## Data store: PostgreSQL

Chosen over Azure Cosmos DB specifically because Postgres runs anywhere
(local Docker Compose for dev, a container or managed instance on any cloud
for production) — Cosmos DB is Azure-only and would break the portability
goal. Product/map images go in S3-compatible object storage (works against
Azure Blob Storage, AWS S3, or self-hosted MinIO without app code changes).

Schema highlights:
- `usuarios`, `clientes`, `produtos`, `leads`, `indicacoes`,
  `orientacoes`, `programacao` — one table (or small set of tables) per
  collection from the old prototype, plus `usuarios` (new — see Auth below).
- `usuarios` holds every person who can log into the app — Gerentes,
  Representantes, and other staff — as one flat, self-referencing table
  rather than separate tables per role. Each row has a nullable
  `superiorId` pointing at another row in the same table: a Representante's
  `superiorId` is their Gerente, and a team member working under a
  Representante points `superiorId` at that Representante — the same column
  handles both hierarchy levels without a fixed-depth schema. Access inside
  the app itself does not differ by role; the only role-based gate is
  `isAdmin`, which unlocks the Admin CMS's write routes.
- `clientes.representante_id` is a real foreign key to `usuarios.id`. The
  old prototype matched a plain string name — this silently breaks if names
  don't match exactly. Fix it in the new schema. If a client's assigned
  Representante isn't reachable at the show, the client/rep detail screens
  resolve up via `superiorId` to that Representante's Gerente as a fallback
  contact.
- `leads.capturado_por_id` is a foreign key to `usuarios.id` — the logged-in
  user who saved the lead, replacing the old prototype's free-text
  "atendente" field with a real link.
- No migration needed: the old prototype's Firestore data is sample/test
  data only. The new schema starts empty and gets populated through the new
  admin CMS.

## Auth: custom JWT + bcrypt in the Node API, required app-wide

A cloud-managed auth service (Azure AD, Static Web Apps auth) was considered
and rejected for the same portability reason as the database. A hand-rolled
email/password + bcrypt hash + JWT session token is a modest amount of code,
not a framework to adopt. This also closes a real gap in the old prototype,
where "is this user an admin" was checked only in client-side JavaScript (a
hardcoded email map) with no server-side enforcement — anyone could bypass
it by editing the page.

Unlike the old prototype (where only the separate Admin CMS had a login),
**every screen in the main app now requires a logged-in `usuarios` account**
— only people who exist in that table can use the app at all, not just
admins. This is what makes `leads.capturado_por_id` a reliable link instead
of a typed name: whoever is logged in when a lead is saved is who gets
credited. `isAdmin` is a separate flag on the same table that additionally
unlocks the CMS's write routes — it does not gate anything in the main app.

To keep this from adding login friction at the show, the JWT is issued with
a long expiry and stored in an httpOnly cookie, refreshed automatically
whenever the app is online — in practice a rep logs in once (during the
pre-expo sync, over reliable wifi) and stays logged in for the whole event.
This piggybacks on the operational rule already in place for offline sync
(open the app at least once daily): the same daily open that flushes the
leads outbox also keeps the session refreshed. Provisioning is admin-only —
accounts are created through the CMS (or the CSV import for bulk
Representante onboarding), not self-service signup.

## Tax simulator (future integration)

A tax simulator for products/clients is being built separately and will be
integrated later. Three ways to do it, in order of preference:
1. **Rules-as-data (preferred)**: the simulator's rate tables sync into
   IndexedDB like every other collection, and the calculation runs on-device
   — fully offline, no dependency on the separate tool being reachable at
   the expo.
2. **Same-origin API call**: the app calls a backend endpoint that proxies to
   the separate simulator — works, but needs connectivity at the moment of
   use (offline-first breaks only for this one feature).
3. **iframe/deep-link** to the separately hosted tool: simplest to wire up,
   but fully requires connectivity and won't feel native. Fine as a stopgap.

Don't lock this in before the simulator's own architecture is known.

## What's deliberately out of scope for now

- Real-time sync/live updates (not used by the old prototype, not needed
  here).
- Any cloud-proprietary managed service (Azure Functions Database
  Connections, Cosmos DB, Azure Static Web Apps built-in auth, Firebase).
- A frontend framework heavier than Vue (e.g. Angular) — the bundle-size
  cost isn't justified given the slow-connection requirement.
