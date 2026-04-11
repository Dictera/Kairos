// Shared test setup — no DB fixture needed for unit tests (routers tested via caller)
import { beforeAll, afterAll } from 'vitest'

// Keep setup minimal — unit tests mock the db or use in-memory SQLite
beforeAll(() => {
  // future: set up in-memory test DB if needed
})

afterAll(() => {
  // future: teardown
})
