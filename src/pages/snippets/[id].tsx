import { type NextPage } from 'next'
import { signIn, signOut, useSession } from 'next-auth/react'
import {
  ArrowDownOnSquareIcon,
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/solid'

import Button from '@/components/design/button'
import Main from '@/components/design/main'
import Page from '@/components/page'
import { api } from '@/lib/api'
import useForm from '@/lib/useForm'
import { useRouter } from 'next/router'
import { Snippet } from '@prisma/client'
import copyToClipboard from '@/lib/copyToClipboard'

const Snippet: NextPage = () => {
  const {
    query: { id },
  } = useRouter()
  const { data: session } = useSession()

  const { data: savedSnippet } = api.snippets.get.useQuery({ id: id as string })
  const utils = api.useContext()
  const { mutate: updateSnippet } = api.snippets.save.useMutation({
    // https://create.t3.gg/en/usage/trpc#optimistic-updates
    async onMutate(newSnippet) {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.snippets.get.cancel()

      // Get the data from the queryCache
      const prevData = utils.snippets.get.getData()

      // Optimistically update the data with our new post
      utils.snippets.get.setData(
        { id: id as string },
        () => newSnippet as Snippet
      )

      // Return the previous data so we can revert if something goes wrong
      return { prevData }
    },
    onError(err, newNote, ctx) {
      // If the mutation fails, use the context-value from onMutate
      utils.snippets.get.setData({ id: id as string }, ctx?.prevData)
    },
    async onSettled() {
      // Sync with server once mutation has settled
      await utils.snippets.get.invalidate()
    },
  })

  const { values, handleChange, handleSubmit, isSubmitting, dirty } = useForm({
    initialValues: {
      name: savedSnippet?.name as string,
      snippet: savedSnippet?.snippet as string,
    },
    onSubmit: ({ name: newName, snippet: newSnippet }, { setSubmitting }) => {
      updateSnippet({
        id: id as string,
        name: newName as string,
        snippet: newSnippet as string,
        author: session?.user?.name as string,
      })
      setSubmitting(false)
    },
  })

  const { name, snippet } = values

  return (
    <Page>
      <Main className='flex flex-col p-4'>
        <div className='flex flex-grow flex-col items-center justify-center space-y-4'>
          {session ? (
            <>
              <p>hi {session.user?.name}</p>
              <Button
                onClick={() => {
                  signOut().catch(err => console.log(err))
                }}
              >
                <ArrowLeftOnRectangleIcon className='h-6 w-6' />
              </Button>
            </>
          ) : (
            <Button
              onClick={() => {
                signIn('discord').catch(err => console.log(err))
              }}
            >
              <ArrowRightOnRectangleIcon className='h-6 w-6' />
            </Button>
          )}
          {session ? (
            <>
              <form className='space-y-3'>
                <input
                  className='w-full bg-cobalt'
                  type='text'
                  name='name'
                  placeholder='name'
                  value={name}
                  onChange={handleChange}
                />
                <textarea
                  className='w-full bg-cobalt'
                  name='snippet'
                  placeholder='snippet'
                  value={snippet}
                  onChange={handleChange}
                />
                <Button
                  className='disabled:pointer-events-none disabled:opacity-25'
                  onClick={() => {
                    copyToClipboard(snippet as string)
                  }}
                  disabled={!snippet}
                >
                  <DocumentDuplicateIcon className='mx-auto block h-6 w-6' />
                </Button>
                <Button
                  className='disabled:pointer-events-none disabled:opacity-25'
                  type='submit'
                  onClick={handleSubmit}
                  disabled={!dirty || isSubmitting}
                >
                  <ArrowDownOnSquareIcon className='mx-auto block h-6 w-6' />
                </Button>
              </form>
            </>
          ) : (
            <p>sign in to create/view your snippets!</p>
          )}
        </div>
      </Main>
    </Page>
  )
}

export default Snippet
