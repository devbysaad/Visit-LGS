import 'regenerator-runtime/runtime'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ThemeProvider } from '@mui/material/styles'
import { ClerkProvider } from '@clerk/clerk-react'

import './index.scss'
import './PhaserGame'
import muiTheme from './MuiTheme'
import App from './App'
import store from './stores'
import { subscribeGameEvents } from './events/subscribeGameEvents'
import DesktopOnlyGate from './components/DesktopOnlyGate'

subscribeGameEvents()

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined

const container = document.getElementById('root')
const root = createRoot(container!)

const app = (
  <Provider store={store}>
    <ThemeProvider theme={muiTheme}>
      <DesktopOnlyGate>
        <App />
      </DesktopOnlyGate>
    </ThemeProvider>
  </Provider>
)

root.render(
  <React.StrictMode>
    {clerkKey ? (
      <ClerkProvider publishableKey={clerkKey} afterSignOutUrl="/">
        {app}
      </ClerkProvider>
    ) : (
      app
    )}
  </React.StrictMode>
)
