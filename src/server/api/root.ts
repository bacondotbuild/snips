import { createTRPCRouter } from './trpc'
import { snippetsRouter } from './routers/snippets'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  snippets: snippetsRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
