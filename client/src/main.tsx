import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// SockJS / some libs may expect `global` (node-style); in browser use globalThis.
;(window as any).global = window as any
;(window as any).process = { env: { NODE_ENV: 'development' } }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
