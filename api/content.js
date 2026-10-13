import { hasRedis } from './_redis.js'
import { readAll } from './_content.js'
import { send } from './_util.js'

export default async function handler(req, res) {
  if (!hasRedis()) return send(res, 503, { error: 'redis_not_configured' }, { 'Cache-Control': 'no-store' })
  try {
    // CDN menyimpan 10 dtk agar Redis tidak dipukul tiap pengunjung; admin memakai ?t= untuk melewati cache
    send(res, 200, await readAll(), { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' })
  } catch (e) { send(res, 500, { error: 'redis_error' }, { 'Cache-Control': 'no-store' }) }
}
