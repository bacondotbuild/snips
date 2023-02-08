import type { ChangeEvent } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { type NextPage } from 'next'
import { useSession } from 'next-auth/react'
import type { TextReplacement } from '@prisma/client'
import { Snippet } from '@prisma/client'
import {
  ArrowDownOnSquareIcon,
  DocumentDuplicateIcon,
  PlusIcon,
  TrashIcon,
  VariableIcon,
} from '@heroicons/react/24/solid'

import Button from '@/components/design/button'
import Main from '@/components/design/main'
import Page from '@/components/page'
import Modal from '@/components/modal'
import Footer, { FooterListItem } from '@/components/design/footer'
import { api } from '@/lib/api'
import useForm from '@/lib/useForm'
import copyToClipboard from '@/lib/copyToClipboard'

function arrayEquals(a: unknown, b: unknown) {
  const isEqual =
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => JSON.stringify(val) === JSON.stringify(b[index]))
  return isEqual
}

const TextReplacementListItem = ({
  index,
  textReplacement,
  textReplacements,
  setTextReplacements,
}: {
  index: number
  textReplacement: TextReplacement
  textReplacements: TextReplacement[]
  setTextReplacements: (textReplacements: TextReplacement[]) => void
}) => {
  const { variable, text } = textReplacement
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.currentTarget
    const newTextReplacement = {
      ...textReplacement,
      [name]: value,
    }
    const newTextReplacements = [...textReplacements]
    newTextReplacements[index] = newTextReplacement
    setTextReplacements(newTextReplacements)
  }
  return (
    <li className='space-y-2'>
      <input
        className='w-full bg-cobalt'
        type='text'
        name='variable'
        value={variable}
        onChange={handleChange}
      />
      <textarea
        className='w-full bg-cobalt'
        name='text'
        value={text}
        onChange={handleChange}
      />
    </li>
  )
}

const Snippet: NextPage = () => {
  const [isTextReplacementModalOpen, setIsTextReplacementModalOpen] =
    useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const {
    query: { id },
    push,
  } = useRouter()
  const { data: session } = useSession()

  const { data: savedSnippet } = api.snippets.get.useQuery({ id: id as string })
  const [textReplacements, setTextReplacements] = useState<TextReplacement[]>(
    savedSnippet?.textReplacements ?? []
  )
  useEffect(() => {
    setTextReplacements(savedSnippet?.textReplacements as TextReplacement[])
  }, [savedSnippet])
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
        () => newSnippet as Snippet & { textReplacements: TextReplacement[] }
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
            <FooterListItem onClick={() => setIsConfirmModalOpen(true)}>
              <TrashIcon className='h-6 w-6 text-red-600' />
            </FooterListItem>

            <FooterListItem onClick={() => setIsTextReplacementModalOpen(true)}>
              <VariableIcon className='h-6 w-6' />
            </FooterListItem>

            <FooterListItem
              onClick={() => {
                const copy =
                  textReplacements?.length > 0
                    ? textReplacements.reduce((prev, textReplacement) => {
                        const { variable, text } = textReplacement
                        return prev?.replace(variable, text)
                      }, savedSnippet?.snippet)
                    : savedSnippet?.snippet
                copyToClipboard(copy as string)
              }}
            >
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
          <Modal
            isOpen={isTextReplacementModalOpen}
            setIsOpen={setIsTextReplacementModalOpen}
            title='text replacements'
          >
            {textReplacements?.length > 0 ? (
              <ul className='space-y-3'>
                {textReplacements.map((textReplacement, index) => (
                  <TextReplacementListItem
                    key={index}
                    index={index}
                    textReplacement={textReplacement}
                    textReplacements={textReplacements}
                    setTextReplacements={setTextReplacements}
                  />
                ))}
              </ul>
            ) : (
              <p>you have no text replacements</p>
            )}
            <Button
              onClick={() => {
                setTextReplacements([
                  ...textReplacements,
                  {
                    id: '',
                    variable: '',
                    text: '',
                    snippetId: id as string,
                  },
                ])
              }}
            >
              <PlusIcon className='mx-auto block h-6 w-6' />
            </Button>
            <Button
              className='disabled:pointer-events-none disabled:opacity-25'
              onClick={() => {
                updateSnippet({
                  id: id as string,
                  name: name as string,
                  snippet: snippet as string,
                  author: session?.user?.name as string,
                  textReplacements,
                })
              }}
              disabled={arrayEquals(
                textReplacements,
                savedSnippet?.textReplacements
              )}
            >
              <ArrowDownOnSquareIcon className='mx-auto block h-6 w-6' />
            </Button>
          </Modal>
        </>
      )}
    </Page>
  )
}

export default Snippet
