import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** Skips the app shell's bottom nav (e.g. the login screen). */
    semNav?: boolean
    /** Reachable without a logged-in session (only /login today). */
    publica?: boolean
  }
}
