import crypto from 'node:crypto'

export const send = (res, status, obj, headers = {}) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v)
  res.end(JSON.stringify(obj))
}
export async function readJson(req) {
  if (req.body !== undefined && req.body !== null) return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body
  const chunks = []
  for await (const c of req) chunks.push(c)
  const t = Buffer.concat(chunks).toString('utf8')
  return t ? JSON.parse(t) : {}
}
export const query = (req) => Object.fromEntries(new URL(req.url, 'http://x').searchParams)
export const ip = (req) => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'x').split(',')[0].trim()
export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex')

/* ---------- Auth admin (token bertanda tangan HMAC, berlaku 12 jam) ---------- */
const DEFAULT_HASH = 'df33c437524285d8db5749d5ff820d461387fc3a64bd1c54cae64edd245040c8' // password: babuljannah
export const ADMIN_HASH = process.env.ADMIN_PASSWORD_HASH || process.env.VITE_ADMIN_HASH || DEFAULT_HASH
const SECRET = process.env.SESSION_SECRET || sha256('bj-session:' + ADMIN_HASH)
const sign = (p) => crypto.createHmac('sha256', SECRET).update(p).digest('base64url')
export const makeToken = () => { const p = String(Date.now() + 12 * 3600e3); return `${p}.${sign(p)}` }
export function verifyToken(t = '') {
  const [p, s] = String(t).split('.')
  if (!p || !s || Number(p) < Date.now()) return false
  const a = Buffer.from(sign(p)), b = Buffer.from(s)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
export const isAuthed = (req) => verifyToken(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''))

export const KINDS = ['artikel', 'acara', 'jadwal']
export const SAFE_ID = /^[a-zA-Z0-9_-]{1,120}$/
