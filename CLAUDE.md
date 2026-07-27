# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run from the repo root:

```sh
npm install          # install deps
npm run dev           # start Vite dev server
npm run build         # type-check (vue-tsc) + production build
npm run preview       # preview the production build
npm run lint          # oxlint --fix, then eslint --fix --cache
npm run format        # prettier --write on src/
```

There is no test script/framework configured in this project.

### Known install issue

`package.json` currently pins `oxlint@~1.74.0` while `eslint-plugin-oxlint@~1.73.0` peer-depends on `oxlint@~1.73.0`, so a plain `npm install` fails with `ERESOLVE`. Use `npm install --legacy-peer-deps`, or align the two version ranges in `package.json`, if you hit this.

## Architecture

- **Stack**: Vue 3 (`<script setup>` SFCs) + TypeScript, Vite 8, Pinia, Tailwind CSS v4 (via `@tailwindcss/vite`) + DaisyUI.
- **Front-end only**: there is no backend, no API layer, and no database. Form submissions are validated and built client-side, then logged and displayed — nothing is persisted or sent over the network.
- **Entry point**: `src/main.ts` creates the app, installs Pinia and the router, and mounts `src/App.vue` to `#app`. `App.vue` is a thin layout shell: `<AppHeader />` plus `<RouterView />`.
- **Routing**: `src/router/index.ts` (`createWebHistory`) defines `/` → `views/HomeView.vue` (the "Comercial" card grid) and `/leads/novo` → `views/LeadFormView.vue` (lazy-loaded lead registration form), with a catch-all redirect to `/`. The two "Pesquisa" cards on the home screen are intentionally `disabled` until those screens exist.
- **Directory layout**: `src/components/` (shared UI, e.g. `AppHeader.vue`), `src/views/` (route components), `src/types/` (domain interfaces, e.g. `lead.ts`), `src/constants/` (`defaults.ts` — holds `DEFAULT_ID`, a **temporary placeholder** used as the lead `id` until the real database schema exists; change it freely when testing).
- **State**: Pinia stores live under `src/stores/` (e.g. `counter.ts` is the default scaffold store, using the setup-store syntax with `ref`/`computed`). Form state is local component state (`ref`), not a store.
- **Styling**: Tailwind utility classes are used directly in templates (see `App.vue`); global styles are in `src/assets/main.css`/`base.css`. The brand color `#193A4C` (dark blue) is used for headers/accents.
- **Path alias**: `@` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).
- **TypeScript project layout**: `tsconfig.json` is a root pointer referencing `tsconfig.app.json` (app/browser code, extends `@vue/tsconfig`) and `tsconfig.node.json` (Vite/tooling config, Node types). Type-checking uses `vue-tsc --build`, not plain `tsc`.
- **Linting**: dual setup — `oxlint` (config in `.oxlintrc.json`) runs first as a fast linter, then ESLint (`eslint.config.ts`) picks up `eslint-plugin-oxlint` findings plus Vue/TypeScript rules, with Prettier formatting rules disabled via `eslint-config-prettier`.
- **Content language**: UI copy is in Portuguese (pt-BR) — this is a "GoHub Higiexpo" internal tool for Grupo Goedert.
