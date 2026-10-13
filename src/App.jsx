import { Component, lazy, Suspense, useEffect, useLayoutEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { site } from './data.js'
import { startSync } from './store.js'
import { Cursor, Toast, Nav } from './components.jsx'
import Home from './home.jsx'
// Halaman publik dimuat langsung (bukan lazy) supaya pindah halaman tidak bergantung pada unduhan chunk
// yang bisa gagal / usang di jaringan seluler. Hanya Admin yang di-lazy-load.
import { Jadwal, Acara, AcaraDetail, Artikel, ArtikelDetail, Tentang, Kontak } from './pages.jsx'

const Admin = lazy(() => import('./Admin.jsx').catch(() => { reloadOnce(); return new Promise(() => {}) }))
function reloadOnce() {
  try { if (sessionStorage.getItem('bj-reloaded') === '1') return; sessionStorage.setItem('bj-reloaded', '1') } catch {}
  location.reload()
}

// Jika satu halaman error, tampilan tidak membeku: pengguna bisa lanjut pindah halaman tanpa refresh manual.
class Boundary extends Component {
  state = { err: false, path: this.props.path }
  static getDerivedStateFromError() { return { err: true } }
  static getDerivedStateFromProps(p, s) { return p.path !== s.path ? { err: false, path: p.path } : null }
  render() {
    return this.state.err
      ? <div className="wrap page"><h1>Ada kendala memuat halaman</h1><p className="muted">Silakan coba lagi.</p><div className="actions"><button type="button" className="btn" onClick={() => this.setState({ err: false })}>Coba lagi</button><Link className="btn ghost" to="/">Ke beranda</Link></div></div>
      : this.props.children
  }
}

export default function App() {
  const { pathname } = useLocation()
  useLayoutEffect(() => window.scrollTo(0, 0), [pathname])
  useEffect(() => {
    startSync()
    addEventListener('vite:preloadError', reloadOnce)
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})
    return () => removeEventListener('vite:preloadError', reloadOnce)
  }, [])
  return (
    <>
      <Cursor />
      <div key={'bar' + pathname} className="routebar" aria-hidden="true" />
      <Toast />
      <Nav />
      <main key={pathname} className="route">
        <Boundary path={pathname}>
          <Suspense fallback={<div className="wrap page" />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/jadwal" element={<Jadwal />} />
              <Route path="/acara" element={<Acara />} />
              <Route path="/acara/:id" element={<AcaraDetail />} />
              <Route path="/artikel" element={<Artikel />} />
              <Route path="/artikel/:slug" element={<ArtikelDetail />} />
              <Route path="/tentang" element={<Tentang />} />
              <Route path="/kontak" element={<Kontak />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<div className="wrap page"><h1>Halaman tidak ditemukan</h1><Link className="btn" to="/">Kembali ke beranda</Link></div>} />
            </Routes>
          </Suspense>
        </Boundary>
      </main>
      <footer className="footer">
        <p><b>{site.nama}</b> · {site.tagline}</p>
        <p>{site.alamat} · {site.email}</p>
        <p className="socials">
          <a href={site.instagram} target="_blank" rel="noreferrer">Instagram</a>
          <a href={site.youtube} target="_blank" rel="noreferrer">YouTube</a>
        </p>
        <p>© {new Date().getFullYear()} {site.nama} · <Link to="/admin">Admin</Link></p>
      </footer>
    </>
  )
}
