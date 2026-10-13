import crypto from 'node:crypto'
import { hasRedis, cmd, pipe } from './_redis.js'
import { send, readJson, SAFE_ID } from './_util.js'

const subId = (endpoint) => crypto.createHash('sha256').update(endpoint).digest('hex').slice(0, 24)
const validSub = (s) => s && typeof s.endpoint === 'string' && s.endpoint.startsWith('https://') && s.endpoint.length < 600 && s.keys?.p256dh && s.keys?.auth
const remKey = (id) => { const m = /^([ja]):(.+)$/.exec(String(id)); return m && SAFE_ID.test(m[2]) ? 'bj:rem:' + id : null }

export default async function handler(req, res) {
  const H = { 'Cache-Control': 'no-store' }
  if (req.method === 'GET') {
    const key = process.env.VAPID_PUBLIC_KEY
    return key ? send(res, 200, { key }, H) : send(res, 503, { error: 'push_not_configured' }, H)
  }
  if (req.method !== 'POST') return send(res, 405, { error: 'method' })
  if (!hasRedis()) return send(res, 503, { error: 'redis_not_configured' }, H)
  try {
    const b = await readJson(req)
    if (b.action === 'subscribe') {
      if (!validSub(b.sub)) return send(res, 400, { error: 'bad_sub' }, H)
      const id = subId(b.sub.endpoint)
      const cmds = [['HSET', 'bj:subs', id, JSON.stringify({ endpoint: b.sub.endpoint, keys: b.sub.keys })]]
      if (b.all === true) cmds.push(['SADD', 'bj:subs:all', id]); else if (b.all === false) cmds.push(['SREM', 'bj:subs:all', id])
      await pipe(cmds)
      return send(res, 200, { ok: true, id }, H)
    }
    if (b.action === 'unsubscribe') {
      const id = subId(String(b.endpoint || ''))
      await pipe([['HDEL', 'bj:subs', id], ['SREM', 'bj:subs:all', id]])
      return send(res, 200, { ok: true }, H)
    }
    if (b.action === 'remind') {
      const k = remKey(b.id), id = subId(String(b.endpoint || ''))
      if (!k || !(await cmd('HEXISTS', 'bj:subs', id))) return send(res, 400, { error: 'bad_request' }, H)
      await cmd(b.on ? 'SADD' : 'SREM', k, id)
      return send(res, 200, { ok: true }, H)
    }
    send(res, 400, { error: 'unknown_action' }, H)
  } catch { send(res, 500, { error: 'server' }, H) }
}
