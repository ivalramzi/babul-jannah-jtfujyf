import { Link } from 'react-router-dom'
import { site, nilai } from './data.js'
import { useContent } from './store.js'
import { Icon, useTitle, upcoming, byDate, tones } from './lib.jsx'
import { Stories, Post, JadwalCard, EventCard, EventPopup, Logo } from './components.jsx'

export default function Home() {
  useTitle('')
  const { jadwal, acara, artikel } = useContent()
  const next = upcoming(acara)
  return (
    <>
      <EventPopup />
      <section className="hero">
        <div className="blob b1" /><div className="blob b2" />
        <div className="wrap hero-in">
          <div className="hero-text">
            <Logo size={96} />
            <h1>Ngaji jadi lebih seru bareng {site.nama}.</h1>
            <p>Kajian rutin tiap pekan, terbuka untuk semua dan gratis. Cek jadwal, ikuti acara, dan baca artikel dari para pemateri.</p>
            <div className="actions">
              <Link to="/jadwal" className="btn">Lihat jadwal</Link>
              <Link to="/acara" className="btn ghost">Acara terdekat</Link>
            </div>
          </div>
          {(next[0] || jadwal[0]) && <ul className="hero-card">{next[0] ? <EventCard e={next[0]} /> : <JadwalCard j={jadwal[0]} />}</ul>}
        </div>
      </section>

      <section className="wrap sec tight"><h2 className="h2">Sorotan</h2><Stories /></section>

      {next.length > 0 && (
        <section className="wrap sec">
          <div className="row-h"><h2 className="h2">Acara akan datang</h2><Link className="link" to="/acara">Semua acara</Link></div>
          <ul className="list">{next.slice(0, 2).map((e) => <EventCard e={e} key={e.id} />)}</ul>
        </section>
      )}

      <section className="wrap sec">
        <div className="grid3">
          {nilai.map((n, i) => (
            <div className="card val" key={n.judul}>
              <span className={`emo t-${tones[i]}`}><Icon n={n.icon} size={28} fill /></span>
              <h3>{n.judul}</h3><p>{n.teks}</p>
            </div>
          ))}
        </div>
      </section>

      {jadwal.length > 0 && <section className="wrap sec">
        <div className="row-h"><h2 className="h2">Jadwal pekan ini</h2><Link className="link" to="/jadwal">Semua</Link></div>
        <ul className="list">{jadwal.slice(0, 3).map((j) => <JadwalCard j={j} key={j.id} />)}</ul>
      </section>}

      {artikel.length > 0 && <section className="wrap sec">
        <div className="row-h"><h2 className="h2">Artikel terbaru</h2><Link className="link" to="/artikel">Semua</Link></div>
        <div className="grid3">{byDate(artikel).slice(0, 3).map((a, i) => <Post a={a} i={i} key={a.id} />)}</div>
      </section>}

      <section className="wrap sec">
        <div className="cta">
          <h2>Ada yang mau ditanyakan?</h2>
          <p>Kirim pesan lewat WhatsApp, pengurus akan membalas secepatnya.</p>
          <Link to="/kontak" className="btn inv">Hubungi kami</Link>
        </div>
      </section>
    </>
  )
}
