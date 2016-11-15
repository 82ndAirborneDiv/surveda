import React, { PropTypes } from 'react'
import HeaderContainer from './HeaderContainer'
import Footer from './Footer'
import { ConfirmationModal } from '../ui'
import { logout } from '../../api'
import { config } from '../../config'
import { IntlProvider } from 'react-intl'

const App = ({ children, tabs, body }) => (
  <IntlProvider locale='en-US'>
    <div className='wrapper'>
      <HeaderContainer tabs={tabs} logout={logout} user={config.user} />
      <main>
        {body || children}
      </main>
      <Footer />
      <ConfirmationModal modalId='unhandledError' modalText='Please go to the home page' header='Sorry, something went wrong' confirmationText='Click to go to the home page' onConfirm={(event) => onConfirm(event)} />
    </div>
  </IntlProvider>
)

App.propTypes = {
  children: PropTypes.node,
  tabs: PropTypes.node,
  body: PropTypes.node
}

const onConfirm = (event) => {
  event.preventDefault()
  window.location.href = '/'
}

export default App