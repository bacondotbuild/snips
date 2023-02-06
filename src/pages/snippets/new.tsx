import { type NextPage } from 'next'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { ArrowDownOnSquareIcon } from '@heroicons/react/24/solid'

import Main from '@/components/design/main'
import Page from '@/components/page'
import Footer, { FooterListItem } from '@/components/design/footer'
import { api } from '@/lib/api'
import useForm from '@/lib/useForm'

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
        {session ? (
          <form className='flex flex-grow flex-col space-y-3'>
            <input
              className='w-full bg-cobalt'
              type='text'
              name='name'
              placeholder='name'
              value={name}
              onChange={handleChange}
            />
            <textarea
              className='h-full w-full flex-grow bg-cobalt'
              name='snippet'
              placeholder='snippet'
              value={snippet}
              onChange={handleChange}
            />
          </form>
        ) : (
          <p>sign in to create/view your snippets!</p>
        )}
      </Main>
      {session && (
        <>
          <Footer>
            <FooterListItem
              className='disabled:pointer-events-none disabled:opacity-25'
              onClick={handleSubmit}
              disabled={!dirty || isSubmitting}
            >
              <ArrowDownOnSquareIcon className='mx-auto block h-6 w-6' />
            </FooterListItem>
          </Footer>
        </>
      )}
    </Page>
  )
}

export default NewSnippet
