import { hasRedis, cmd, pipe } from './_redis.js'
import { send, readJson, SAFE_ID } from './_util.js'

// Suka nyata: satu perangkat = satu suka per item. Disimpan sebagai SET di Redis.
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method' })
  if (!hasRedis()) return send(res, 503, { error: 'redis_not_configured' })
  try {
    const { kind, id, device, like } = await readJson(req)
    if (!['artikel', 'acara'].includes(kind) || !SAFE_ID.test(String(id)) || !/^[a-zA-Z0-9-]{8,64}$/.test(String(device))) return send(res, 400, { error: 'bad_request' })
    if (!(await cmd('HEXISTS', 'bj:' + kind, id))) return send(res, 404, { error: 'not_found' })
    const key = `${kind}:${id}`, set = 'bj:likes:' + key
    const [, n] = await pipe([[like ? 'SADD' : 'SREM', set, device], ['SCARD', set]])
    await cmd('HSET', 'bj:likecount', key, n)
    send(res, 200, { count: n, liked: !!like }, { 'Cache-Control': 'no-store' })
  } catch (e) { send(res, 500, { error: 'server' }) }
}
