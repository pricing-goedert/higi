import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** Skips the app shell's bottom nav (e.g. the login screen). */
    semNav?: boolean
    /** Reachable without a logged-in session (only /login today). */
    publica?: boolean
    /** Admin CMS routes: gated on usuario.isAdmin, rendered outside the mobile shell (own topbar+tabs layout). */
    admin?: boolean
  }
}
