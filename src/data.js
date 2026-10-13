// Data tetap situs. Jadwal, acara, dan artikel diatur lewat /admin (lihat src/content.json).
export const site = {
  nama: 'Babul Jannah',
  tagline: 'Ngaji bareng, hati jadi tenang.',
  wa: '6281234567890', // format internasional tanpa +
  email: 'halo@babuljannah.id',
  alamat: 'Jl. Contoh No. 12, Bandung, Jawa Barat',
  instagram: 'https://www.instagram.com/potret.babuljannah/',
  youtube: 'https://www.youtube.com/@babul_jannahtv',
}
// Profil (ubah angka pengikut & mengikuti di sini). Jumlah postingan dihitung otomatis dari data acara.
export const profil = { bio: 'Majelis ta’lim untuk semua usia. Ngaji bareng, hati jadi tenang.', pengikut: '1,2K', mengikuti: '12' }

// tone: green | leaf | ink
export const stories = [
  { id: 'jadwal', label: 'Jadwal', icon: 'calendar_month', slides: [
    { tone: 'green', icon: 'calendar_month', title: 'Jadwal pekan ini', text: 'Ada 5 kajian untuk kamu, dari Senin sampai Ahad.', to: '/jadwal', cta: 'Lihat jadwal' },
    { tone: 'leaf', icon: 'schedule', title: 'Datang lebih awal', text: '15 menit sebelum mulai biar dapat tempat paling nyaman.' } ] },
  { id: 'acara', label: 'Acara', icon: 'event', slides: [
    { tone: 'ink', icon: 'event', title: 'Acara terdekat', text: 'Cek tanggal dan lokasi acara berikutnya, lalu nyalakan pengingat.', to: '/acara', cta: 'Lihat acara' } ] },
  { id: 'doa', label: 'Doa harian', icon: 'favorite', slides: [
    { tone: 'leaf', icon: 'favorite', title: 'Doa sebelum belajar', text: 'Ya Allah, tambahkanlah aku ilmu dan berilah aku pemahaman.' },
    { tone: 'green', icon: 'star', title: 'Doa sebelum tidur', text: 'Bismika Allahumma ahya wa bismika amut.' } ] },
  { id: 'tahu', label: 'Tahukah kamu', icon: 'star', slides: [
    { tone: 'green', icon: 'star', title: 'Tahukah kamu?', text: 'Senyum kepada saudaramu bernilai sedekah.' },
    { tone: 'ink', icon: 'article', title: 'Mulai dari kecil', text: 'Satu ayat sehari, setahun jadi 365 ayat.', to: '/artikel', cta: 'Baca artikel' } ] },
  { id: 'infaq', label: 'Infaq Jumat', icon: 'campaign', slides: [
    { tone: 'leaf', icon: 'campaign', title: 'Infaq Jumat', text: 'Untuk operasional kajian dan beasiswa TPA. Hubungi pengurus untuk info rekening.', to: '/kontak', cta: 'Hubungi pengurus' } ] },
]
export const nilai = [
  { judul: 'Ilmu yang bersanad', teks: 'Kajian disampaikan pemateri yang berpegang pada rujukan para ulama.', icon: 'article' },
  { judul: 'Terbuka untuk semua', teks: 'Laki-laki, perempuan, dan anak-anak. Datang saja, tanpa daftar.', icon: 'person' },
  { judul: 'Suasana hangat', teks: 'Ada tanya jawab dan teh hangat setelah kajian selesai.', icon: 'favorite' },
]
