import { createHash, timingSafeEqual } from 'crypto'

// Brute-force guard for the single-password login.
//
// Kairos is a single-user app, so failures are counted globally rather than
// per client (there is no trustworthy client IP behind `next start`). After
// MAX_FAILURES wrong passwords the login is locked; each further lock doubles
// in length up to MAX_LOCK_MS. Worst case an attacker on the network keeps the
// owner locked out for a few minutes, but can only try ~20 passwords an hour.
//
// State is in-memory: a server restart clears it, which is acceptable here.
const MAX_FAILURES = 5
const BASE_LOCK_MS = 60_000
const MAX_LOCK_MS = 15 * 60_000

let failures = 0
let lockCount = 0
let lockedUntil = 0

export function loginLockRemainingMs(now = Date.now()): number {
  return Math.max(0, lockedUntil - now)
}

export function recordLoginFailure(now = Date.now()): void {
  failures++
  if (failures >= MAX_FAILURES) {
    lockedUntil = now + Math.min(BASE_LOCK_MS * 2 ** lockCount, MAX_LOCK_MS)
    lockCount++
    failures = 0
  }
}

export function recordLoginSuccess(): void {
  failures = 0
  lockCount = 0
  lockedUntil = 0
}

/** Test helper — resets the in-memory counters. */
export function resetLoginRateLimit(): void {
  recordLoginSuccess()
}

/** Constant-time password comparison (hashing first equalises the lengths). */
export function passwordMatches(given: string, expected: string): boolean {
  const a = createHash('sha256').update(given).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}
