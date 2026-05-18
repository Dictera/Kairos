/**
 * Next.js instrumentation hook — server startup entry point.
 *
 * Called once when the Next.js server starts.
 * NEXT_RUNTIME guard is MANDATORY: node-cron and better-sqlite3 are Node.js-only;
 * importing them in the edge runtime would crash.
 *
 * Source: https://nextjs.org/docs/app/guides/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Dynamic import keeps node-cron and DB out of the edge runtime bundle
    await import('./lib/telegram/cron')
  }
}
