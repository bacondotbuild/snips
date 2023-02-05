import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '../trpc'

export const snippetsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.prisma.snippet.findFirstOrThrow({
          where: {
            id: input.id,
          },
        })
      } catch (error) {
        console.log(error)
      }
    }),
  getAll: protectedProcedure
    .input(
      z.object({
        author: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.prisma.snippet.findMany({
          where: {
            author: input.author,
          },
        })
      } catch (error) {
        console.log(error)
      }
    }),
  save: protectedProcedure
    .input(
      z.object({
        id: z.string().nullish(),
        name: z.string().nullish(),
        snippet: z.string().nullish(),
        author: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const name = input.name ?? 'untitled'
      const snippet = input.snippet ?? 'snippet'
      const author = input.author

      const newSnippet = {
        name,
        snippet,
        author,
      }

      try {
        return await ctx.prisma.snippet.upsert({
          where: {
            id: input.id ?? '',
          },
          update: newSnippet,
          create: newSnippet,
        })
      } catch (error) {
        console.log(error)
      }
    }),
  delete: protectedProcedure
    .input(
      z
        .object({
          id: z.string().nullish(),
        })
        .nullish()
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.prisma.snippet.delete({
          where: {
            id: input?.id ?? '',
          },
        })
      } catch (error) {
        console.log(error)
      }
    }),

  // getSecretMessage: protectedProcedure.query(() => {
  //   return 'you can now see this secret message!'
  // }),
})
