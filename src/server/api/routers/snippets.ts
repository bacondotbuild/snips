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
          include: {
            textReplacements: true,
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
        textReplacements: z
          .array(
            z.object({
              id: z.string().nullish(),
              variable: z.string(),
              text: z.string(),
            })
          )
          .nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const name = input.name ?? 'untitled'
      const snippet = input.snippet ?? 'snippet'
      const author = input.author
      const textReplacements = input.textReplacements ?? []

      const newSnippet = {
        name,
        snippet,
        author,
      }

      try {
        const snippetResult = await ctx.prisma.snippet.upsert({
          where: {
            id: input.id ?? '',
          },
          update: newSnippet,
          create: newSnippet,
        })

        const textReplacementsResult = await ctx.prisma.$transaction(
          textReplacements.map(textReplacement =>
            ctx.prisma.textReplacement.upsert({
              where: {
                id: textReplacement.id ?? '',
              },
              update: {
                variable: textReplacement.variable,
                text: textReplacement.text,
                snippetId: snippetResult.id,
              },
              create: {
                variable: textReplacement.variable,
                text: textReplacement.text,
                snippetId: snippetResult.id,
              },
            })
          )
        )

        return { ...snippetResult, textReplacements: textReplacementsResult }
      } catch (error) {
        console.log(error)
      }
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.session.user.name

      const noteToBeUpdated = await ctx.prisma.snippet.findFirst({
        where: {
          id: input.id ?? '',
        },
        select: {
          author: true,
        },
      })

      if (input.id && noteToBeUpdated?.author !== currentUser) {
        return null
      }

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
