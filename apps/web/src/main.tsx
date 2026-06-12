import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n'
import './styles.css'
import App from './App'
import { SessionProvider } from './state/session'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SessionProvider>
      <App />
    </SessionProvider>
  </React.StrictMode>,
)
