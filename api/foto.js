import { hasRedis, cmd } from './_redis.js'
import { query } from './_util.js'

// Menyajikan foto yang tersimpan di Redis (diunggah dari admin). Dicache lama karena id = hash isi.
export default async function handler(req, res) {
  const id = String(query(req).id || '')
  if (!hasRedis() || !/^[a-f0-9]{16,40}$/.test(id)) { res.statusCode = 404; return res.end() }
  try {
    const d = await cmd('GET', 'bj:foto:' + id)
    const m = /^data:(image\/[a-z+.-]+);base64,(.+)$/s.exec(d || '')
    if (!m) { res.statusCode = 404; return res.end() }
    res.statusCode = 200
    res.setHeader('Content-Type', m[1])
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable')
    res.end(Buffer.from(m[2], 'base64'))
  } catch { res.statusCode = 500; res.end() }
}
