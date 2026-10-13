import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Saat `npm run dev`, fungsi di folder /api dijalankan langsung oleh Vite (di produksi dijalankan Vercel).
const devApi = () => ({
  name: 'dev-api',
  configureServer(server) {
    for (const [k, v] of Object.entries(loadEnv('development', process.cwd(), ''))) if (!(k in process.env)) process.env[k] = v
    server.middlewares.use(async (req, res, next) => {
      const m = /^\/api\/([a-z]+)(?:\?|$)/.exec(req.url || '')
      if (!m) return next()
      try { await (await server.ssrLoadModule(`/api/${m[1]}.js`)).default(req, res) }
      catch (e) { console.error(e); res.statusCode = 500; res.setHeader('Content-Type', 'application/json'); res.end('{"error":"dev"}') }
    })
  },
})
export default defineConfig({ plugins: [react(), devApi()] })
