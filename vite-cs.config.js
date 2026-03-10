import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    {
      name: 'coming-soon-root',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/' || req.url === '') {
            req.url = '/coming-soon.html'
          }
          next()
        })
      },
    },
  ],
  build: {
    rollupOptions: {
      input: 'coming-soon.html',
    },
  },
  server: {
    host: '0.0.0.0',
    port: 4000,
  },
})
