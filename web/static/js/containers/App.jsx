import React from 'react'
import HeaderContainer from './HeaderContainer'
import Footer from '../components/Footer'
import { ConfirmationModal } from '../components/ConfirmationModal'
import { logout } from '../api'
import { config } from '../config'

export default ({ children, tabs, body }) => (
  <div className='wrapper'>
    <HeaderContainer tabs={tabs} logout={logout} user={config.user} />
    <main>
      {body || children}
    </main>
    <Footer />
    <ConfirmationModal modalId='unhandledError' modalText='Please go to the home page' header='Sorry, something went wrong' confirmationText='Click to go to the home page' onConfirm={(event) => onConfirm(event)} />
  </div>
)

const onConfirm = (event) => {
  event.preventDefault()
  window.location.href = '/'
}