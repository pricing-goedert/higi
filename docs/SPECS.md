# Functional Specification

What the Higiexpo app needs to do. See `ARCHITECTURE.md` for how it's built,
and `design-frame/` for the visual reference of every screen listed here.

## Purpose

Sales reps use this app during the Higiexpo trade show to: look up whether a
visiting company is already a client (and if so, who their assigned
representative is), capture new leads when it isn't, and browse Goedert's
product catalog — all while venue connectivity is poor to nonexistent.

## Login (required for the whole app, not just admin)

Every screen requires a logged-in `usuarios` account — Gerentes,
Representantes, and other staff all log in with the same email/password
flow, and only people provisioned in the database can use the app at all.
Access inside the app is identical regardless of role; the only exception is
the separate Admin CMS, gated by an `isAdmin` flag on the same account. To
avoid repeated logins at the show, the session is long-lived and refreshes
automatically whenever the app is online, so in practice a rep logs in once
(ideally during the pre-expo sync) and stays logged in for the event —
reinforced by the existing "open the app at least once daily" operational
rule (see Lead capture & offline sync below), which also keeps the session
alive. Accounts are provisioned by an admin (via the CMS or the
Representante CSV import), not self-service.

## Screens

Bottom tab navigation: **Home**, **Repres.**, **Cliente**, **Leads**.

- **Home** — hero header, global search box (routes to client or
  representative results depending on what's typed), a rotating highlight
  carousel (Mapa da Feira, Cadastre um Lead, Programação), and a menu grouped
  into three colored sections: Comercial (blue), Produtos (green), Conteúdo
  (orange).
- **Representantes**: search (by CNPJ, or city/UF for national reps, or
  country for export reps) → result list → detail (responsible person, team,
  phone/WhatsApp/email/address contact rows). A Representante's team (people
  who work under them) and their own Gerente are both drawn from the same
  `usuarios` hierarchy — if the assigned rep isn't at the show, the detail
  screen surfaces their Gerente as a fallback contact.
- **Clientes**: search by CNPJ → result list → detail (company data, contact
  rows, and — if a representative is linked — a highlighted "Representante
  que atende" box that jumps straight to that rep's detail screen, with the
  same Gerente fallback described above if that rep is unreachable). A
  "Cadastrar Lead vinculado" button pre-fills the lead form from this client.
- **Leads**: a form (tipo: Revenda/Empresas/Fornecedor — required; CNPJ —
  required and validated; razão social, contato, telefone — required; CEP,
  endereço, email, observações — optional) and a list of previously captured
  leads with CSV export. The user who captured the lead is recorded
  automatically from the logged-in session (no manual "atendente" field
  needed anymore).
- **Programação** — the event schedule, grouped by day.
- **Mapa da Feira** — a large zoomable floor-plan image.
- **Indicações** — a hub screen; currently only "Restaurantes" is active
  (list sorted by distance from the hotel → detail with address, hours,
  phone, "ver no mapa" link). Farmácias/Mercados, Transporte, and Passeios
  are placeholders for later.
- **Orientações** — topic list (Uniforme, Guarda Volumes, Catálogo e
  Brindes, Segurança) → detail screen with one or more titled sections of
  text.
- **Produtos** — entry point with "Produtos em destaque" (categorias →
  linhas/grupos → tipos → produto, 4 levels deep, each level searchable by
  name/code) and a link to external fichas técnicas.
- **Admin CMS** (separate, gated by the `isAdmin` flag on the same account
  used to log into the main app — not a separate login) — tabs for each
  editable collection (Usuários — Gerentes/Representantes/staff, Clientes,
  Indicações, Programação, Produtos) with list/create/edit/delete, plus a
  read-only Leads tab with CSV export.

## Lead capture & offline sync (the core reliability requirement)

1. A rep fills the lead form and taps Salvar. The lead is written to the
   local IndexedDB `leadsOutbox` immediately — no spinner, no waiting for a
   network round-trip.
2. If the device is online at that moment, the outbox flushes to the backend
   right away.
3. If not, the lead sits queued. It only flushes when the app is next opened
   *and* online at that moment (no true background sync on iOS Safari) — the
   UI must show a visible "N leads pending sync" count so this is never
   silent.
4. **Operational rule, not just a technical one:** reps sync/open the app
   before the expo starts (so the first full data load happens over reliable
   wifi, not at the congested venue), and are required to open the app at
   least once a day during the expo (so queued leads actually flush, even if
   the booth itself never gets a usable signal).
5. If a lead's CNPJ matches an existing client, the rep is offered the choice
   to link the lead to that client record.

## Client ↔ Representante relationship

Every client that has an assigned representative stores a real
`representante_id` foreign key into `usuarios` (fixing the old prototype's
plain string-name match, which silently failed if names didn't match
exactly). The client detail screen's "Representante que atende" box uses
this ID to jump straight to that representative's detail screen — or, if
that representative isn't reachable at the show, to their Gerente via the
`usuarios` hierarchy (see Screens above).

## Product catalog structure

Four levels: **categoria** (e.g. Dispensers, Químicos) → **grupo/linha**
(e.g. Linha Brave — optional level, some categories are flat) → **tipo**
(e.g. Toalheiros, Saboneteiras) → **produto** (código, nome, descrição,
quantidade por caixa master, dimensões, composição, foto). Searchable by
name or código at the categoria level and below.

## Tax simulator (planned, not yet built)

A separate tool will simulate taxes for specific product/client
combinations. It's being built independently and integrated later. Preferred
integration: its rate tables sync into the app's local IndexedDB like every
other collection, so the calculation runs fully on-device/offline. See
`ARCHITECTURE.md` for the fallback options if that's not feasible.

## Non-functional requirements

- Must be usable with no connectivity after the first sync (client/rep/
  product lookup, lead capture).
- Must install like a native app via "Add to Home Screen" (PWA), no app
  store review.
- Must run on both Android and iOS — see `ARCHITECTURE.md` for the iOS
  background-sync limitation and its operational mitigation.
- Content (client/rep/product data, indicações, orientações, programação)
  must be editable by admins without a code deploy, via the admin CMS.
