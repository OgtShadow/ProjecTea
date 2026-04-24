// @ts-nocheck
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// https://vite.dev/config/
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Paths where the dev certs are mounted in the frontend container
const certPath = path.resolve(__dirname, './certs/localhost.pem')
const keyPath = path.resolve(__dirname, './certs/localhost-key.pem')

let httpsConfig: any = false
try {
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    httpsConfig = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    }
    console.log('Vite HTTPS: using certs from', certPath)
  }
} catch (e) {
  console.warn('Vite HTTPS: could not load certs, falling back to HTTP', e)
}

export default defineConfig({
 plugins: [react()],
 define: {
   global: 'globalThis',
 },
  server: {
    host: '0.0.0.0',
    port: 8080,
    https: httpsConfig,
    watch: {
      usePolling: true,
      interval: 100,
    },
    proxy: {
      '/api': {
        target: 'https://java-backend:8082',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'https://java-backend:8082',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})
