import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    hmr: {
      timeout: 5000 // Timeout disable loops if stuck
    }
  },
  // ... baki config
})
