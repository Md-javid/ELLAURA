import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React + router in one cached vendor chunk
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Icons in their own chunk (large, rarely changes)
          'vendor-icons': ['lucide-react'],
          // Supabase SDK
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
