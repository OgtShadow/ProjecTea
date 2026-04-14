import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// SockJS / some libs may expect `global` (node-style); in browser use globalThis.
declare global {
  interface Window {
    global?: Window
    process?: { env: { NODE_ENV: string } }
  }
}

window.global = window
window.process = { env: { NODE_ENV: 'development' } }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
