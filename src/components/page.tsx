import Meta from '@/components/meta'
import Header from '@/components/header'
import Notification from '@/components/notification'

const DEFAULT_TITLE = 'shnippets'

const Page = ({
  title = DEFAULT_TITLE,
  children,
}: {
  title?: string
  children: React.ReactNode
}) => (
  <div className='flex min-h-screen flex-col bg-cb-dark-blue text-cb-white'>
    <Meta
      title={title === DEFAULT_TITLE ? title : `${title} - ${DEFAULT_TITLE}`}
    />
    <Notification />
    <Header title={DEFAULT_TITLE} />
    {children}
  </div>
)

export default Page
