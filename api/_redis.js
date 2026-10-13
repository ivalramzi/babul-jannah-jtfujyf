// Klien Redis ringan lewat REST (Upstash / Vercel KV). Tanpa dependensi.
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

export const hasRedis = () => !!(URL_ && TOKEN)

async function post(path, body) {
  const r = await fetch(URL_ + path, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!r.ok) throw new Error(`Redis ${r.status}`)
  return r.json()
}
export async function cmd(...args) {
  const j = await post('', args)
  if (j.error) throw new Error(j.error)
  return j.result
}
export async function pipe(cmds) {
  if (!cmds.length) return []
  const j = await post('/pipeline', cmds)
  return j.map((x) => { if (x.error) throw new Error(x.error); return x.result })
}
// HGETALL (array datar) -> objek
export const toObj = (arr) => { const o = {}; for (let i = 0; i < (arr || []).length; i += 2) o[arr[i]] = arr[i + 1]; return o }
