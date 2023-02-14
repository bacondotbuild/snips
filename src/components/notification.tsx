import { ToastContainer } from 'react-toastify'

export default function Notification() {
  return (
    <ToastContainer
      autoClose={1000}
      toastClassName='bg-cb-off-blue text-cb-white rounded-lg'
      bodyClassName=''
      pauseOnFocusLoss={false}
    />
  )
}
