# Testing

**Rule: every backend route that's added or changed ships with tests in the
same change.** The point isn't coverage for its own sake — it's that a small,
non-dedicated team is going to keep adding features under a deadline, and
nothing should have to remember-by-hand whether some unrelated feature still
works after today's change. That's what these tests check, automatically,
every time.

This intentionally focuses on the backend. It's where a regression is
cheapest to catch (one HTTP request in, one assertion on the response) and
most dangerous to miss (a broken API breaks every client at once — mobile
app, offline sync, everything). Frontend testing conventions are one short
section at the end.

## How backend tests are structured here

Tooling: Node's built-in `node:test` (no extra runner to install) +
`supertest`, driving the real `app` object exported from `backend/src/app.ts`
end-to-end over HTTP — not a mocked router, not a mocked Prisma client.

**Tests run against the real local Postgres** (`docker compose up postgres`),
not a separate test database or an in-memory fake. This is a deliberate
simplification, not an oversight — see `docs/PLAN.md`'s testing-scope note.
It also means tests catch real Prisma/constraint behavior (a bad migration,
a missing `@unique`, an FK that doesn't cascade the way you assumed) that a
mocked DB would happily paper over.

**File placement:** one `*.test.ts` file colocated next to what it tests —
`backend/src/routes/importar.test.ts` next to `importar.ts`,
`backend/src/app.test.ts` for cross-cutting concerns (login, session,
auth-gating in general). Don't centralize tests in a separate `tests/`
tree; the point is that touching a route makes its test file impossible to
miss.

**Test data hygiene** — every test file follows the same shape:

```ts
const PREFIXO = 'algumnomeunico' // distinctive, never matches real seeded data

before(async () => {
  // create whatever fixtures this file's tests need, all named/emailed/
  // cnpj'd under PREFIXO
})

after(async () => {
  // delete everything created under PREFIXO, children before parents
  // (e.g. produto -> tipo -> grupo -> categoria), then prisma.$disconnect()
})
```

Never touch rows that don't start with your prefix. Never rely on a
previous test's leftover data, and never assume a fresh empty database
either — other test files' fixtures may already exist alongside yours.

**What every new/changed route needs, at minimum** (see
`backend/src/routes/importar.test.ts` for a file that does all four):

1. **Happy path** — the route does the thing it's supposed to do.
2. **The auth/permission gate** — a request with no session is rejected;
   if the route is admin-gated, a *logged-in non-admin* is rejected too
   (not just "no session at all" — that's a meaningfully different check).
3. **At least one realistic bad-input case** — a missing required field, a
   duplicate unique key, an FK that doesn't resolve — and assert the
   response is a contained, friendly error, not a raw crash or a
   500-with-a-stack-trace.
4. **If the route processes many independent items** (bulk import, any
   future batch endpoint): one bad item in the batch must not abort the
   rest. Assert the good items still succeed and the bad one reports its
   own error.

Running them: `npm test` inside `backend/` (Postgres must already be up).

## Frontend

Vitest, colocated the same way (`lib/format.test.ts` next to `format.ts`).
Any standalone pure function — a validator, a formatter, a parser — gets a
sibling `.test.ts`. Testing Vue components/views themselves isn't set up
yet (no `@vue/test-utils`) — that's a known gap, not a rule to follow yet.

## What tests here don't catch

Worth knowing rather than assuming tests are a complete safety net: config
issues (body size limits, service-worker caching rules), and anything that
only shows up at real data scale, have both bitten this project already and
neither would've been caught by a unit/integration test. Tests are the
right tool for logic regressions between features; they're not a
substitute for occasionally running the real thing end-to-end.
