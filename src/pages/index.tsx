import { type NextPage } from 'next'
import { signIn, signOut, useSession } from 'next-auth/react'
import {
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/solid'
import format from 'date-fns/format'

import Button from '@/components/design/button'
import Main from '@/components/design/main'
import Page from '@/components/page'
import { api } from '@/lib/api'
import Link from 'next/link'

const Home: NextPage = () => {
  const { data: session } = useSession()
  const { data: snippets } = api.snippets.getAll.useQuery({
    author: session?.user?.name as string,
  })

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
              <Link
                className='text-cb-yellow hover:underline'
                href='/snippets/new'
              >
                new snippet
              </Link>
              {snippets?.length && snippets?.length > 0 && (
                <ul className='space-y-3 text-center'>
                  {snippets.map(snippet => (
                    <li key={snippet.id}>
                      <Link
                        className='flex items-center space-x-4 text-cb-pink hover:underline'
                        href={`/snippets/${snippet.id}`}
                      >
                        <span>{snippet.name}</span>
                        <span className='text-xs text-cb-white'>
                          {format(snippet.updatedAt, 'eee MMM d yyyy')}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p>sign in to create/view your snippets!</p>
          )}
        </div>
      </Main>
    </Page>
  )
}

export default Home
