import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n'
import './styles.css'
import App from './App'
import { SessionProvider } from './state/session'

// Auto-reload once when a newly deployed service worker takes control, so updates
// apply without a manual hard-refresh. The PWA still works offline (cache-first);
// this just picks up the latest version automatically when one is published.
if ('serviceWorker' in navigator) {
  let reloaded = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return
    reloaded = true
    window.location.reload()
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SessionProvider>
      <App />
    </SessionProvider>
  </React.StrictMode>,
)
