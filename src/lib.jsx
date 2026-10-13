import { useState, useEffect, useCallback, useRef } from 'react'
import { useContent, sendLike, likeKey } from './store.js'

export function useStored(key, init) {
  const read = () => { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init } catch { return init } }
  const [v, setV] = useState(read)
  useEffect(() => {
    const h = (e) => e.detail === key && setV(read())
    window.addEventListener('bj-store', h)
    return () => window.removeEventListener('bj-store', h)
  }, [key])
  const set = useCallback((n) => {
    const nv = typeof n === 'function' ? n(read()) : n
    try { localStorage.setItem(key, JSON.stringify(nv)) } catch {}
    setV(nv)
    window.dispatchEvent(new CustomEvent('bj-store', { detail: key }))
  }, [key])
  return [v, set]
}

export const toast = (m) => window.dispatchEvent(new CustomEvent('toast', { detail: m }))
export const toggleIn = (set, id) => set((x) => (x.includes(id) ? x.filter((i) => i !== id) : [...x, id]))
export const tones = ['green', 'leaf', 'ink']

/* tanggal & warna */
export const fmt = (iso, o = { day: 'numeric', month: 'long', year: 'numeric' }) => new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', o)
const startOfToday = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t }
export const isUpcoming = (iso) => new Date(iso + 'T00:00:00') >= startOfToday()
export const daysLeft = (iso) => {
  const d = Math.round((new Date(iso + 'T00:00:00') - startOfToday()) / 864e5)
  return d <= 0 ? 'Hari ini' : d === 1 ? 'Besok' : `${d} hari lagi`
}
export const upcoming = (a) => a.filter((e) => isUpcoming(e.tanggal)).sort((x, y) => x.tanggal.localeCompare(y.tanggal))
export const past = (a) => a.filter((e) => !isUpcoming(e.tanggal)).sort((x, y) => y.tanggal.localeCompare(x.tanggal))
export const byDate = (a) => [...a].sort((x, y) => y.tanggal.localeCompare(x.tanggal))
export const inkOn = (hex) => { const n = parseInt((hex || '#0a6b30').slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150 ? '#12251a' : '#f4f8ec' }
export const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item'
export const uid = () => Math.random().toString(36).slice(2, 9)
export const fotos = (x) => (Array.isArray(x?.foto) ? x.foto.filter(Boolean) : [])
export const MAX_FOTO = 4
// Kecilkan foto di browser (maks 1000px, JPEG) supaya ringan disimpan di Redis
export function compressImage(file, max = 1000, q = 0.74) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image()
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', q))
    }
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('gagal')) }
    img.src = url
  })
}
export const paras = (t = '') => t.split(/\n\s*\n/).filter(Boolean)

/* ikon Google (Material Symbols) */
export const Icon = ({ n, fill, size }) => (
  <span className={fill ? 'ms fill' : 'ms'} style={size ? { fontSize: size } : undefined} aria-hidden="true">{n}</span>
)

export const useTitle = (t) => useEffect(() => { document.title = t ? `${t} — Babul Jannah` : 'Babul Jannah — Majelis Ta’lim' }, [t])
export function Head({ title, sub }) {
  useTitle(title)
  return <div className="head"><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
}

export const Loading = () => <div className="wrap page"><p className="empty" role="status">Memuat…</p></div>

/* ---------- Suka nyata (Redis) ---------- */
export function useLike(kind, id) {
  const [mine, setMine] = useStored('bj-likes2', [])
  const { likes } = useContent()
  const busy = useRef(false)
  const k = likeKey(kind, id), liked = mine.includes(k)
  const toggle = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    const next = !liked
    toggleIn(setMine, k)
    const ok = await sendLike(kind, id, next)
    if (!ok) { toggleIn(setMine, k); toast('Gagal menyimpan suka. Periksa koneksi lalu coba lagi.') }
    busy.current = false
  }, [liked, k, kind, id, setMine])
  return { liked, count: likes[k] || 0, toggle }
}

/* ---------- Scroll ke paling atas: halus tapi ringan (durasi singkat, berhenti bila pengguna menggulir) ---------- */
export function scrollToTop() {
  const y0 = window.scrollY
  if (y0 < 2) return
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return window.scrollTo(0, 0)
  const dur = Math.min(520, 240 + y0 / 8), t0 = performance.now()
  let raf = 0
  const stop = () => { cancelAnimationFrame(raf); removeEventListener('wheel', stop); removeEventListener('touchstart', stop) }
  addEventListener('wheel', stop, { passive: true }); addEventListener('touchstart', stop, { passive: true })
  const step = (t) => {
    const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3)
    window.scrollTo(0, Math.round(y0 * (1 - e)))
    if (p < 1) raf = requestAnimationFrame(step); else stop()
  }
  raf = requestAnimationFrame(step)
}

/* ---------- Notifikasi push (Web Push + service worker) ---------- */
const b64 = (s) => { const r = atob((s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, (c) => c.charCodeAt(0)) }
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
const post = (body) => fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const PUSH_MSG = {
  ios: 'Di iPhone/iPad: buka menu Bagikan → “Tambah ke Layar Utama”, lalu buka dari ikon itu dan aktifkan notifikasi.',
  unsupported: 'Browser ini belum mendukung notifikasi.', denied: 'Notifikasi diblokir. Aktifkan lewat pengaturan situs di browser.',
  server: 'Notifikasi belum aktif di server. Hubungi pengurus.', error: 'Gagal mengaktifkan notifikasi. Coba lagi.',
}
// Pastikan perangkat ini berlangganan push. all: true/false = ikut pengumuman acara & artikel baru.
export async function ensurePush(all) {
  if (!pushSupported()) return { ok: false, why: isIOS() && !standalone() ? 'ios' : 'unsupported' }
  try {
    if (Notification.permission === 'denied') return { ok: false, why: 'denied' }
    if (Notification.permission !== 'granted' && (await Notification.requestPermission()) !== 'granted') return { ok: false, why: 'denied' }
    const reg = await navigator.serviceWorker.register('/sw.js'); await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      const r = await fetch('/api/push'); if (!r.ok) return { ok: false, why: 'server' }
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64((await r.json()).key) })
    }
    const r = await post({ action: 'subscribe', sub: sub.toJSON(), all })
    return r.ok ? { ok: true, endpoint: sub.endpoint } : { ok: false, why: 'server' }
  } catch { return { ok: false, why: 'error' } }
}
export async function currentEndpoint() {
  try { if (!pushSupported() || Notification.permission !== 'granted') return ''; const reg = await navigator.serviceWorker.getRegistration('/sw.js'); return (await reg?.pushManager.getSubscription())?.endpoint || '' } catch { return '' }
}
export async function setReminder(id, on) {
  const r = await ensurePush(); if (!r.ok) return r
  try { const x = await post({ action: 'remind', endpoint: r.endpoint, id, on }); return x.ok ? { ok: true } : { ok: false, why: 'server' } } catch { return { ok: false, why: 'error' } }
}
export async function setAnnounce(on) {
  if (on) return ensurePush(true)
  try { const e = await currentEndpoint(); if (e) { const reg = await navigator.serviceWorker.getRegistration('/sw.js'); const sub = await reg.pushManager.getSubscription(); const s = sub.toJSON(); await post({ action: 'subscribe', sub: s, all: false }) } return { ok: true } } catch { return { ok: false, why: 'error' } }
}
