import { useState } from 'react'
import { type NextPage } from 'next'
import { signIn, signOut, useSession } from 'next-auth/react'
import {
  ArrowDownOnSquareIcon,
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from '@heroicons/react/24/solid'

import Button from '@/components/design/button'
import Main from '@/components/design/main'
import Page from '@/components/page'
import { api } from '@/lib/api'
import useForm from '@/lib/useForm'
import { useRouter } from 'next/router'
import { Snippet } from '@prisma/client'
import copyToClipboard from '@/lib/copyToClipboard'
import Modal from '@/components/modal'
import Footer, { FooterListItem } from '@/components/design/footer'

const Snippet: NextPage = () => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const {
    query: { id },
    push,
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

  const { mutate: deleteNote } = api.snippets.delete.useMutation()

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
              </form>
            </>
          ) : (
            <p>sign in to create/view your snippets!</p>
          )}
        </div>
      </Main>
      {session && (
        <>
          <Footer>
            <FooterListItem onClick={() => setIsConfirmModalOpen(true)}>
              <TrashIcon className='h-6 w-6 text-red-600' />
            </FooterListItem>
            <FooterListItem onClick={() => copyToClipboard(snippet as string)}>
              <DocumentDuplicateIcon className='h-6 w-6' />
            </FooterListItem>

            <FooterListItem
              className='disabled:pointer-events-none disabled:opacity-25'
              onClick={handleSubmit}
              disabled={!dirty || isSubmitting}
            >
              <ArrowDownOnSquareIcon className='h-6 w-6' />
            </FooterListItem>
          </Footer>
          <Modal
            isOpen={isConfirmModalOpen}
            setIsOpen={setIsConfirmModalOpen}
            title='are you sure you want to delete?'
          >
            <div className='flex space-x-4'>
              <Button
                onClick={() => {
                  deleteNote({ id: id as string })
                  push('/').catch(err => console.log(err))
                }}
              >
                yes
              </Button>
              <Button
                onClick={() => {
                  setIsConfirmModalOpen(false)
                }}
              >
                no
              </Button>
            </div>
          </Modal>
        </>
      )}
    </Page>
  )
}

export default Snippet
