import { hasRedis, cmd, pipe, toObj } from './_redis.js'
import { sendTo, pushReady } from './_push.js'
import { send, query } from './_util.js'

/*
  Pengingat terjadwal. Dipanggil oleh Vercel Cron (header Authorization: Bearer CRON_SECRET)
  atau layanan cron luar: GET /api/cron?key=CRON_SECRET (disarankan tiap 5-10 menit untuk pengingat "1 jam lagi").
  Aturan (waktu WIB):
   - "besok"    : acara besok, kirim sejak 07.00 hari sebelumnya
   - "hari ini" : acara/jadwal hari ini, kirim sejak 06.00 selama belum mulai
   - "1 jam"    : 0-75 menit sebelum mulai
  Setiap pengingat hanya dikirim sekali (penanda di Redis).
*/
const WIB = 7 * 3600e3
const pad = (n) => String(n).padStart(2, '0')
const HARI = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const parse = (s) => { try { return JSON.parse(s) } catch { return null } }
const startMs = (ymd, jam) => { const [h, m] = String(jam || '00.00').split(/[.:]/).map(Number); return Date.parse(`${ymd}T${pad(h || 0)}:${pad(m || 0)}:00+07:00`) }

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET
  const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!secret || (bearer !== secret && query(req).key !== secret)) return send(res, 401, { error: 'unauthorized' })
  if (!hasRedis() || !pushReady()) return send(res, 503, { error: 'not_configured' })
  try {
    const now = Date.now(), w = new Date(now + WIB)
    const today = w.toISOString().slice(0, 10), tmr = new Date(now + WIB + 864e5).toISOString().slice(0, 10)
    const hour = w.getUTCHours(), hari = HARI[w.getUTCDay()]
    const r = await pipe([['HGETALL', 'bj:acara'], ['HGETALL', 'bj:jadwal']])
    const acara = Object.values(toObj(r[0])).map(parse).filter(Boolean), jadwal = Object.values(toObj(r[1])).map(parse).filter(Boolean)

    const due = [] // {code, prefix, id, title, body, url}
    for (const e of acara) {
      const st = startMs(e.tanggal, e.jam), left = st - now
      if (e.tanggal === tmr && hour >= 7) due.push({ kind: 'besok', code: 'a:' + e.id, title: 'Besok: ' + e.judul, body: `${e.jam} WIB · ${e.lokasi}`, url: `/acara/${e.id}` })
      if (e.tanggal === today && hour >= 6 && left > 0) due.push({ kind: 'hari', code: 'a:' + e.id, title: 'Hari ini: ' + e.judul, body: `${e.jam} WIB · ${e.lokasi}`, url: `/acara/${e.id}` })
      if (left > 0 && left <= 75 * 60e3) due.push({ kind: 'jam', code: 'a:' + e.id, title: 'Sebentar lagi: ' + e.judul, body: `Mulai ${e.jam} WIB · ${e.lokasi}`, url: `/acara/${e.id}` })
    }
    for (const j of jadwal) {
      if (j.hari !== hari) continue
      const left = startMs(today, j.jam) - now
      if (hour >= 6 && left > 0) due.push({ kind: 'hari', code: 'j:' + j.id, title: 'Kajian hari ini: ' + j.judul, body: `${j.jam} WIB · ${j.pemateri} · ${j.tempat}`, url: '/jadwal' })
      if (left > 0 && left <= 75 * 60e3) due.push({ kind: 'jam', code: 'j:' + j.id, title: 'Sebentar lagi: ' + j.judul, body: `Mulai ${j.jam} WIB · ${j.tempat}`, url: '/jadwal' })
    }
    let sent = 0
    for (const d of due) {
      const mark = `bj:sent:${d.kind}:${d.code}:${d.kind === 'besok' ? tmr : today}`
      if ((await cmd('SET', mark, '1', 'NX', 'EX', 172800)) !== 'OK') continue
      const ids = await cmd('SMEMBERS', 'bj:rem:' + d.code)
      if (!ids?.length) continue
      const out = await sendTo(ids, { title: d.title, body: d.body, url: d.url, tag: `${d.kind}-${d.code}` })
      sent += out.sent
    }
    send(res, 200, { ok: true, checked: due.length, sent }, { 'Cache-Control': 'no-store' })
  } catch { send(res, 500, { error: 'server' }) }
}
