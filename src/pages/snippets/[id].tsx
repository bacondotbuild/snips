import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import type { TextReplacement } from '@prisma/client'
import type { Snippet } from '@prisma/client'
import {
  ArrowDownOnSquareIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
  DocumentMagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  VariableIcon,
} from '@heroicons/react/24/solid'
import format from 'date-fns/format'
// import nextDay from 'date-fns/nextDay'
import nextMonday from 'date-fns/nextMonday'
import nextTuesday from 'date-fns/nextTuesday'
import nextWednesday from 'date-fns/nextWednesday'
import nextThursday from 'date-fns/nextThursday'
import nextFriday from 'date-fns/nextFriday'
import nextSaturday from 'date-fns/nextSaturday'
import nextSunday from 'date-fns/nextSunday'
import { toast } from 'react-toastify'
import { Disclosure } from '@headlessui/react'
import classNames from 'classnames'

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

const textTypes = ['text', 'date'] as const
type TextType = (typeof textTypes)[number]

const dateTextFns = {
  today: (date: Date) => format(date, 'eee MMM d yyyy'),
  // tomorrow: (date: Date) => format(nextDay(date), 'eee MMM d yyyy'),
  'next mon': (date: Date) => format(nextMonday(date), 'eee MMM d yyyy'),
  'next tue': (date: Date) => format(nextTuesday(date), 'eee MMM d yyyy'),
  'next wed': (date: Date) => format(nextWednesday(date), 'eee MMM d yyyy'),
  'next thu': (date: Date) => format(nextThursday(date), 'eee MMM d yyyy'),
  'next fri': (date: Date) => format(nextFriday(date), 'eee MMM d yyyy'),
  'next sat': (date: Date) => format(nextSaturday(date), 'eee MMM d yyyy'),
  'next sun': (date: Date) => format(nextSunday(date), 'eee MMM d yyyy'),
}

const dateTextOptions = [
  'today',
  // 'tomorrow',
  'next mon',
  'next tue',
  'next wed',
  'next thu',
  'next fri',
  'next sat',
  'next sun',
] as const

type DateTextOption = (typeof dateTextOptions)[number]
const isDateTextOption = (text: string): text is DateTextOption =>
  dateTextOptions.indexOf(text as DateTextOption) !== -1

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
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const { variable, text } = textReplacement
  const [selectedTextType, setSelectedTextType] = useState<TextType>(() =>
    isDateTextOption(text) ? 'date' : 'text'
  )
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
      <Disclosure>
        {({ open }) => (
          <>
            <Disclosure.Button
              className={classNames(
                'flex w-full border-cb-dusty-blue p-4 text-cb-yellow hover:text-cb-yellow/75',
                open && 'border-b'
              )}
            >
              <span className='flex-grow text-start'>{variable}</span>
              <ChevronRightIcon
                className={classNames(
                  'h-6 w-6 transition-transform',
                  open ? 'rotate-90 transform' : ''
                )}
              />
            </Disclosure.Button>
            <Disclosure.Panel>
              <input
                className='w-full bg-cobalt'
                type='text'
                name='variable'
                value={variable}
                onChange={handleChange}
              />
              <select
                className='w-full bg-cobalt'
                value={selectedTextType}
                onChange={e => setSelectedTextType(e.target.value as TextType)}
              >
                {textTypes.map(textType => (
                  <option key={textType} value={textType}>
                    {textType}
                  </option>
                ))}
              </select>
              {selectedTextType === 'date' ? (
                <select
                  className='w-full bg-cobalt'
                  name='text'
                  value={text}
                  onChange={handleChange}
                >
                  <option>select date text option</option>
                  {dateTextOptions.map(dateTextOption => (
                    <option key={dateTextOption} value={dateTextOption}>
                      {dateTextOption}
                    </option>
                  ))}
                </select>
              ) : (
                <textarea
                  className='w-full bg-cobalt'
                  name='text'
                  value={text}
                  onChange={handleChange}
                />
              )}
              <Button
                onClick={() => {
                  setIsConfirmModalOpen(true)
                }}
                backgroundColorClassName='bg-red-600'
              >
                <TrashIcon className='mx-auto block h-6 w-6' />
              </Button>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
      <Modal
        isOpen={isConfirmModalOpen}
        setIsOpen={setIsConfirmModalOpen}
        title='are you sure you want to delete?'
      >
        <div className='flex space-x-4'>
          <Button
            onClick={() => {
              const newTextReplacements = [...textReplacements]
              // delete item by index
              newTextReplacements.splice(index, 1)
              setTextReplacements(newTextReplacements)
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
    </li>
  )
}

function TextReplacementModal({
  id,
  isTextReplacementModalOpen,
  setIsTextReplacementModalOpen,
  textReplacements,
  setTextReplacements,
  savedSnippet,
  updateSnippet,
}: {
  id: string
  isTextReplacementModalOpen: boolean
  setIsTextReplacementModalOpen: Dispatch<SetStateAction<boolean>>
  textReplacements: TextReplacement[]
  setTextReplacements: (textReplacements: TextReplacement[]) => void
  savedSnippet: Snippet & { textReplacements: TextReplacement[] }
  updateSnippet: (
    snippet: Snippet & { textReplacements: TextReplacement[] }
  ) => void
  snippet: string
}) {
  return (
    <Modal
      isOpen={isTextReplacementModalOpen}
      setIsOpen={setIsTextReplacementModalOpen}
      title='text replacements'
      panelClassName='flex-grow flex flex-col'
      outerPanelClassName='h-full'
      innerPanelClassName='flex-grow flex flex-col'
    >
      <div className='flex-grow'>
        {textReplacements?.length > 0 ? (
          <ul className='divide-y divide-cb-dusty-blue bg-cb-blue'>
            {[...textReplacements].map((textReplacement, index) => (
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
      </div>
      <Button
        onClick={() => {
          setTextReplacements([
            ...textReplacements,
            {
              id: '',
              variable: '$new',
              text: '',
              snippetId: id,
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
            ...savedSnippet,
            // id: id,
            // name: name as string,
            // snippet: snippet as string,
            // author: session?.user?.name as string,
            textReplacements,
          })
        }}
        disabled={arrayEquals(textReplacements, savedSnippet?.textReplacements)}
      >
        <ArrowDownOnSquareIcon className='mx-auto block h-6 w-6' />
      </Button>
    </Modal>
  )
}

export default function Snippet() {
  const [showPreview, setShowPreview] = useState(false)
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

  const snippetWithReplacements =
    textReplacements?.length > 0
      ? textReplacements.reduce((prev, textReplacement) => {
          const { variable, text } = textReplacement
          const now = new Date()
          const replaceText = isDateTextOption(text)
            ? dateTextFns[text](now)
            : text
          return prev?.replaceAll(variable, replaceText)
        }, savedSnippet?.snippet)
      : savedSnippet?.snippet
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
              value={showPreview ? snippetWithReplacements : snippet}
              onChange={handleChange}
              readOnly={showPreview}
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

            <FooterListItem onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? (
                <PencilSquareIcon className='h-6 w-6' />
              ) : (
                <DocumentMagnifyingGlassIcon className='h-6 w-6' />
              )}
            </FooterListItem>

            <FooterListItem
              onClick={() => {
                copyToClipboard(snippetWithReplacements as string)
                toast.success('copied to clipboard')
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
          {savedSnippet && snippet && (
            <TextReplacementModal
              id={id as string}
              isTextReplacementModalOpen={isTextReplacementModalOpen}
              setIsTextReplacementModalOpen={setIsTextReplacementModalOpen}
              textReplacements={textReplacements}
              setTextReplacements={setTextReplacements}
              savedSnippet={savedSnippet}
              updateSnippet={updateSnippet}
              snippet={snippet as string}
            />
          )}
        </>
      )}
    </Page>
  )
}
