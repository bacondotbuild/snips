import type { MouseEventHandler } from 'react'
import classnames from 'classnames'

export default function Footer({ children }: { children?: React.ReactNode }) {
  return (
    <footer className='sticky bottom-0 pb-4'>
      <ul className='mx-4 flex items-center divide-x divide-cb-white rounded-lg bg-cb-dusty-blue text-cb-yellow'>
        {children}
      </ul>
    </footer>
  )
}

export function FooterListItem({
  onClick,
  disabled,
  className,
  children,
}: {
  onClick?: MouseEventHandler<HTMLButtonElement>
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}) {
  return (
    <li className='flex-grow'>
      {onClick ? (
        <button
          className={classnames('flex w-full justify-center py-2', className)}
          type='button'
          onClick={onClick}
          disabled={disabled}
        >
          {children}
        </button>
      ) : (
        children
      )}
    </li>
  )
}
