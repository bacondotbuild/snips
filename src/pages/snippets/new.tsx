import { type NextPage } from 'next'
import { signIn, signOut, useSession } from 'next-auth/react'
import {
  ArrowDownOnSquareIcon,
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/solid'

import Button from '@/components/design/button'
import Main from '@/components/design/main'
import Page from '@/components/page'
import { api } from '@/lib/api'
import useForm from '@/lib/useForm'
import { useRouter } from 'next/router'

const NewSnippet: NextPage = () => {
  const { push } = useRouter()
  const { data: session } = useSession()

  const {
    mutate: saveSnippet,
    isSuccess,
    data,
  } = api.snippets.save.useMutation()

  const { values, handleChange, handleSubmit, isSubmitting, dirty } = useForm({
    initialValues: {
      name: '',
      snippet: '',
    },
    onSubmit: ({ name: newName, snippet: newSnippet }, { setSubmitting }) => {
      saveSnippet({
        name: newName as string,
        snippet: newSnippet as string,
        author: session?.user?.name as string,
      })
      setSubmitting(false)
    },
  })

  const { name, snippet } = values

  if (isSuccess) {
    const id = data?.id ?? ''
    push(`/snippets/${id}`).catch(err => console.log(err))
  }

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

export default NewSnippet
