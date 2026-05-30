// lib/trpc/context.ts — client component only; never import lib/db.ts here
// tRPC v11 context: createTRPCContext returns { TRPCProvider, useTRPC, useTRPCClient }
import { createTRPCContext } from '@trpc/tanstack-react-query'
import type { AppRouter } from '@/lib/trpc/routers/_app'

export const { TRPCProvider, useTRPC } =
  createTRPCContext<AppRouter>()
