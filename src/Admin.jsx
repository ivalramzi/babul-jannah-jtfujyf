import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useContent, refresh, applyItem, removeItem, adminCall, tryLogin, isAdmin, logout } from './store.js'
import { Icon, useTitle, toast, fmt, isUpcoming, slugify, uid, fotos, compressImage, MAX_FOTO } from './lib.jsx'
import { Logo } from './components.jsx'

const today = () => new Date().toISOString().slice(0, 10)
const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad']
const JENIS = ['Umum', 'Muslimah', 'Anak', 'Remaja']
const CFG = {
  artikel: {
    label: 'Artikel', icon: 'article', foto: true, sort: (a, b) => b.tanggal.localeCompare(a.tanggal),
    sub: (x) => `${x.penulis} · ${fmt(x.tanggal)}`,
    blank: () => ({ id: uid(), judul: '', penulis: '', tanggal: today(), ringkas: '', isi: '', warna: '#0a6b30', foto: [] }),
    fields: [['judul', 'Judul', 'text'], ['penulis', 'Penulis', 'text'], ['tanggal', 'Tanggal terbit', 'date'], ['warna', 'Warna sampul artikel', 'color'],
      ['ringkas', 'Ringkasan / deskripsi (tampil di kartu & tombol komentar)', 'textarea', 3], ['isi', 'Isi artikel (pisahkan paragraf dengan baris kosong)', 'textarea', 10]],
  },
  acara: {
    label: 'Acara', icon: 'event', foto: true, sort: (a, b) => b.tanggal.localeCompare(a.tanggal),
    sub: (x) => `${fmt(x.tanggal)} · ${x.lokasi}`,
    blank: () => ({ id: uid(), judul: '', tanggal: today(), jam: '19.30', lokasi: '', pemateri: '', deskripsi: '', laporan: '', peserta: 0, foto: [] }),
    fields: [['judul', 'Nama acara', 'text'], ['tanggal', 'Tanggal (tanggal ke depan = akan datang, lewat = selesai)', 'date'], ['jam', 'Jam', 'text'], ['lokasi', 'Lokasi', 'text'],
      ['pemateri', 'Pemateri / panitia', 'text'], ['deskripsi', 'Deskripsi acara', 'textarea', 5], ['laporan', 'Laporan (isi setelah acara selesai)', 'textarea', 5], ['peserta', 'Jumlah peserta', 'number']],
  },
  jadwal: {
    label: 'Jadwal', icon: 'calendar_month', sort: (a, b) => HARI.indexOf(a.hari) - HARI.indexOf(b.hari),
    sub: (x) => `${x.hari}, ${x.jam} WIB · ${x.pemateri}`,
    blank: () => ({ id: uid(), hari: 'Senin', jam: '19.30', judul: '', pemateri: '', tempat: '', jenis: 'Umum' }),
    fields: [['judul', 'Nama kajian', 'text'], ['hari', 'Hari', 'select', HARI], ['jam', 'Jam', 'text'], ['pemateri', 'Pemateri', 'text'], ['tempat', 'Tempat', 'text'], ['jenis', 'Kategori', 'select', JENIS]],
  },
}

function Login({ onOk }) {
  const [pw, setPw] = useState(''), [show, setShow] = useState(false), [err, setErr] = useState(''), [shake, setShake] = useState(0), [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setBusy(true)
    const r = await tryLogin(pw); setBusy(false)
    if (r.ok) onOk(); else { setErr(r.msg); setShake((s) => s + 1); setPw('') }
  }
  return (
    <div className="wrap page login-wrap">
      <div className="card login">
        <Logo size={72} />
        <h1>Masuk admin</h1>
        <p className="muted">Kelola artikel, acara (lengkap dengan foto), dan jadwal Babul Jannah. Semua data tersimpan di Redis.</p>
        <form key={shake} className={shake ? 'form shake' : 'form'} onSubmit={submit}>
          <label>Password
            <span className="pw">
              <input type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} autoFocus required autoComplete="current-password" />
              <button type="button" className="ib" aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'} onClick={() => setShow(!show)}><Icon n={show ? 'visibility_off' : 'visibility'} size={22} /></button>
            </span>
          </label>
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn" type="submit" disabled={busy || !pw}>{busy ? 'Memeriksa…' : 'Masuk'}</button>
        </form>
      </div>
    </div>
  )
}

function PhotoPicker({ value, onChange }) {
  const [busy, setBusy] = useState(false)
  const add = async (files) => {
    const room = MAX_FOTO - value.length
    const list = [...files].filter((f) => f.type.startsWith('image/'))
    if (!list.length) return toast('Pilih file gambar (JPG/PNG/WebP)')
    if (list.length > room) toast(`Maksimal ${MAX_FOTO} foto per item`)
    setBusy(true)
    try { const out = await Promise.all(list.slice(0, Math.max(room, 0)).map((f) => compressImage(f))); onChange([...value, ...out]) }
    catch { toast('Sebagian foto gagal dibaca') }
    setBusy(false)
  }
  const cover = (i) => onChange([value[i], ...value.filter((_, n) => n !== i)])
  const del = (i) => onChange(value.filter((_, n) => n !== i))
  return (
    <div className="photos">
      <span className="plabel">Foto <small className="muted">(foto pertama jadi sampul · maks {MAX_FOTO})</small></span>
      <div className="pgrid">
        {value.map((src, i) => (
          <div className="pitem" key={i}>
            <img src={src} alt={`Foto ${i + 1}`} />
            {i === 0 && <span className="pbadge">Sampul</span>}
            <div className="pbtns">
              {i > 0 && <button type="button" className="ib" aria-label="Jadikan sampul" title="Jadikan sampul" onClick={() => cover(i)}><Icon n="star" size={18} /></button>}
              <button type="button" className="ib danger" aria-label="Hapus foto" title="Hapus foto" onClick={() => del(i)}><Icon n="delete" size={18} /></button>
            </div>
          </div>
        ))}
        {value.length < MAX_FOTO && (
          <label className={busy ? 'padd busy' : 'padd'}>
            <Icon n={busy ? 'hourglass_empty' : 'add_photo_alternate'} size={30} />
            <span>{busy ? 'Memproses…' : 'Tambah foto'}</span>
            <input type="file" accept="image/*" multiple hidden disabled={busy} onChange={(e) => { add(e.target.files); e.target.value = '' }} />
          </label>
        )}
      </div>
    </div>
  )
}

function Editor({ cfg, item, onSave, onClose }) {
  const [d, setD] = useState(item)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    addEventListener('keydown', k); document.body.style.overflow = 'hidden'
    return () => { removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [])
  const submit = async (e) => { e.preventDefault(); if (saving) return; setSaving(true); const ok = await onSave({ ...d, ...(d.peserta !== undefined && { peserta: Number(d.peserta) || 0 }) }); if (!ok) setSaving(false) }
  return (
    <div className="overlay" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="sheet editor form" onSubmit={submit}>
        <div className="ed-head"><h2>{item._exists ? 'Edit' : 'Tambah'} {cfg.label.toLowerCase()}</h2>
          <button type="button" className="ib" aria-label="Tutup" onClick={onClose}><Icon n="close" /></button></div>
        {cfg.fields.map(([k, l, t, x]) => (
          <label key={k}>{l}
            {t === 'textarea' ? <textarea rows={x} value={d[k] || ''} onChange={(e) => setD({ ...d, [k]: e.target.value })} required={k === 'isi' || k === 'ringkas'} />
              : t === 'select' ? <select value={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.value })}>{x.map((o) => <option key={o}>{o}</option>)}</select>
              : t === 'color' ? <span className="colorrow"><input type="color" value={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.value })} /><code>{d[k]}</code></span>
              : <input type={t} min={t === 'number' ? 0 : undefined} value={d[k] ?? ''} onChange={(e) => setD({ ...d, [k]: e.target.value })} required={k === 'judul' || t === 'date'} />}
          </label>
        ))}
        {cfg.foto && <PhotoPicker value={fotos(d)} onChange={(foto) => setD((p) => ({ ...p, foto }))} />}
        <div className="actions"><button className="btn" type="submit" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</button><button type="button" className="btn ghost" onClick={onClose} disabled={saving}>Batal</button></div>
      </form>
    </div>
  )
}

function Dashboard({ onOut }) {
  const c = useContent()
  const [tab, setTab] = useState('artikel')
  const [edit, setEdit] = useState(null)
  const [st, setSt] = useState(null)
  const [bc, setBc] = useState({ title: '', body: '', url: '/' })
  const [sending, setSending] = useState(false)
  const cfg = CFG[tab]
  const list = [...c[tab]].sort(cfg.sort)

  const fail = (e) => { if (e.code === 401) { onOut(); toast(e.message) } else toast(e.code === 503 ? 'Redis belum terhubung (lihat README).' : 'Gagal menyimpan. Periksa koneksi lalu coba lagi.') }
  const loadStats = () => adminCall('stats').then(setSt).catch(() => {})
  useEffect(() => { loadStats(); refresh(true) }, [])

  const save = async (it) => {
    const arr = c[tab], exists = arr.some((x) => x.id === it.id)
    it = { ...it }; delete it._exists
    if (!exists && tab === 'artikel') { const base = slugify(it.judul); let id = base, n = 2; while (arr.some((x) => x.id === id)) id = `${base}-${n++}`; it.id = id }
    try {
      // foto baru (data URL) diunggah dulu ke Redis, item hanya menyimpan tautannya
      if (fotos(it).length) it.foto = await Promise.all(fotos(it).map(async (f) => (f.startsWith('data:') ? (await adminCall('foto', { dataUrl: f })).url : f)))
      const r = await adminCall('save', { kind: tab, item: it })
      applyItem(tab, r.item); setEdit(null)
      toast(r.pushed ? `Tersimpan & notifikasi terkirim ke ${r.pushed.sent} perangkat` : 'Tersimpan di Redis')
      refresh(true); return true
    } catch (e) { fail(e); return false }
  }
  const del = async (it) => {
    if (!confirm(`Hapus "${it.judul}"? Tindakan ini tidak bisa dibatalkan.`)) return
    try { await adminCall('delete', { kind: tab, id: it.id }); removeItem(tab, it.id); toast('Dihapus'); refresh(true) } catch (e) { fail(e) }
  }
  const exp = () => {
    const a = document.createElement('a'), { jadwal, acara, artikel } = c
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ jadwal, acara, artikel }, null, 2)], { type: 'application/json' })); a.download = 'content.json'; a.click(); URL.revokeObjectURL(a.href)
  }
  const imp = (e) => {
    const f = e.target.files[0]; if (!f) return
    f.text().then((t) => adminCall('import', { data: JSON.parse(t) })).then(() => { toast('Konten diimpor ke Redis'); refresh(true) }).catch(() => toast('File tidak valid'))
    e.target.value = ''
  }
  const reset = async () => { if (!confirm('Kembalikan semua konten di Redis ke data awal? Data saat ini akan terhapus.')) return; try { await adminCall('reset'); toast('Konten dikembalikan'); refresh(true) } catch (e) { fail(e) } }
  const kirim = async (e) => {
    e.preventDefault(); setSending(true)
    try { const r = await adminCall('broadcast', bc); toast(`Notifikasi terkirim ke ${r.sent} perangkat`); setBc({ title: '', body: '', url: '/' }) }
    catch (er) { er.code === 503 ? toast('Push belum dikonfigurasi (kunci VAPID, lihat README).') : fail(er) }
    setSending(false)
  }
  return (
    <div className="wrap page">
      <div className="adm-head">
        <div><h1>Dashboard admin</h1><p className="muted">Kelola konten yang tampil di website.</p></div>
        <div className="adm-tools">
          <button className="btn sm ghost" onClick={exp}><Icon n="download" size={18} />Ekspor</button>
          <label className="btn sm ghost"><Icon n="upload" size={18} />Impor<input type="file" accept="application/json" hidden onChange={imp} /></label>
          <button className="btn sm ghost" onClick={reset}><Icon n="restart_alt" size={18} />Reset</button>
          <button className="btn sm" onClick={() => { logout(); onOut() }}><Icon n="logout" size={18} />Keluar</button>
        </div>
      </div>
      <p className="note"><Icon n="check" size={18} /> Semua perubahan langsung tersimpan di Redis dan tampil untuk seluruh pengunjung, tanpa deploy ulang.{c.offline && <> <b>Server tidak terjangkau, data yang tampil bukan data terbaru.</b></>}</p>
      <div className="chips">
        {Object.entries(CFG).map(([k, v]) => <button key={k} className={tab === k ? 'chip on' : 'chip'} aria-pressed={tab === k} onClick={() => setTab(k)}><Icon n={v.icon} size={18} />{v.label} ({c[k].length})</button>)}
        <button className="btn sm add" onClick={() => setEdit(cfg.blank())}><Icon n="add" size={20} />Tambah {cfg.label.toLowerCase()}</button>
      </div>
      <ul className="arows">
        {list.map((x) => (
          <li key={x.id} className="arow">
            {fotos(x).length > 0 ? <img className="athumb" src={fotos(x)[0]} alt="" /> : tab === 'artikel' && <span className="dot" style={{ background: x.warna }} />}
            <div className="grow"><b>{x.judul}</b><span className="muted">{cfg.sub(x)}</span></div>
            {tab === 'acara' && <span className="chip soft">{isUpcoming(x.tanggal) ? 'Akan datang' : 'Selesai'}</span>}
            <button className="ib" aria-label={`Edit ${x.judul}`} onClick={() => setEdit({ ...x, _exists: true })}><Icon n="edit" size={22} /></button>
            <button className="ib danger" aria-label={`Hapus ${x.judul}`} onClick={() => del(x)}><Icon n="delete" size={22} /></button>
          </li>
        ))}
        {!list.length && <li className="empty">Belum ada data. Klik “Tambah”.</li>}
      </ul>

      <h2 className="h3">Kirim notifikasi</h2>
      <form className="card form bcast" onSubmit={kirim}>
        <p className="muted">{st ? (st.push ? `${st.all} perangkat menerima pengumuman · ${st.subs} perangkat terdaftar` : 'Push belum dikonfigurasi di server (kunci VAPID belum diisi).') : 'Memuat…'} Acara & artikel baru otomatis diumumkan saat disimpan.</p>
        <label>Judul<input required maxLength={80} value={bc.title} onChange={(e) => setBc({ ...bc, title: e.target.value })} /></label>
        <label>Pesan<textarea required rows="2" maxLength={200} value={bc.body} onChange={(e) => setBc({ ...bc, body: e.target.value })} /></label>
        <label>Buka halaman (opsional, mis. /acara)<input value={bc.url} onChange={(e) => setBc({ ...bc, url: e.target.value })} /></label>
        <button className="btn" type="submit" disabled={sending}>{sending ? 'Mengirim…' : 'Kirim ke semua pelanggan'}</button>
      </form>
      {edit && <Editor key={edit.id} cfg={cfg} item={edit} onSave={save} onClose={() => setEdit(null)} />}
    </div>
  )
}

export default function Admin() {
  useTitle('Admin')
  const [ok, setOk] = useState(isAdmin())
  return ok ? <Dashboard onOut={() => setOk(false)} /> : <Login onOk={() => setOk(true)} />
}
