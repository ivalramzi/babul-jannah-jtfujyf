import webpush from 'web-push'
import { cmd, pipe } from './_redis.js'

let ready = false
export function pushReady() {
  const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return false
  if (!ready) { webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:halo@babuljannah.id', pub, priv); ready = true }
  return true
}

// Kirim ke daftar id langganan. Langganan mati (404/410) otomatis dihapus.
export async function sendTo(ids, payload) {
  if (!pushReady() || !ids.length) return { sent: 0, failed: 0 }
  const raws = await cmd('HMGET', 'bj:subs', ...ids)
  const body = JSON.stringify(payload)
  let sent = 0, failed = 0
  const dead = []
  for (let i = 0; i < ids.length; i += 20) {
    await Promise.all(ids.slice(i, i + 20).map(async (id, n) => {
      const raw = raws[i + n]
      if (!raw) { dead.push(id); return }
      try { await webpush.sendNotification(JSON.parse(raw), body, { TTL: 3600 * 6, urgency: 'high' }); sent++ }
      catch (e) { failed++; if (e.statusCode === 404 || e.statusCode === 410) dead.push(id) }
    }))
  }
  if (dead.length) await pipe([['HDEL', 'bj:subs', ...dead], ['SREM', 'bj:subs:all', ...dead]])
  return { sent, failed }
}
export async function broadcast(payload) {
  const ids = await cmd('SMEMBERS', 'bj:subs:all')
  return sendTo(ids || [], payload)
}
