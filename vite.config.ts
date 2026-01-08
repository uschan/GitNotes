import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          utils: ['@supabase/supabase-js', 'lucide-react', 'uuid'],
          markdown: ['react-markdown', 'remark-gfm', 'react-syntax-highlighter', 'turndown', 'turndown-plugin-gfm']
        }
      }
    },
    // Raise warning limit slightly to reduce noise for acceptable chunk sizes
    chunkSizeWarningLimit: 600
  }
})