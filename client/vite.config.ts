import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: [
        'drizzle-orm',
        'drizzle-orm/sqlite-core',
        'drizzle-orm/mysql-core',
        'drizzle-orm/pg-core',
        'drizzle-zod',
        'better-sqlite3',
        'sqlite3',
        'mysql2',
        'pg'
      ],
    },
  },
  server: {
    port: 3000,
  },
  base: './',
})
