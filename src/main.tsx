import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Temporary error catcher
try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (error) {
  document.body.innerHTML = `
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; background: red; padding: 20px; z-index: 9999; font-size: 16px; font-family: monospace; max-width: 90%; overflow: auto;">
      <h2>React Mount Error:</h2>
      <pre>${error instanceof Error ? error.message : String(error)}</pre>
      <pre>${error instanceof Error && error.stack ? error.stack : ''}</pre>
    </div>
  `
}
