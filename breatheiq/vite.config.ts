import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // single offline bundle for the demo laptop; recharts + framer-motion make it ~0.9 MB
  build: { chunkSizeWarningLimit: 1000 },
})
