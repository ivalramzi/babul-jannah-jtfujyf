# Website Majelis Babul Jannah (Vite + React + Redis)

Data **jadwal, acara, artikel, foto, dan jumlah suka** disimpan di **Redis** lewat fungsi serverless di folder `api/`.
Admin (`/admin`) menulis langsung ke Redis, jadi perubahan tampil untuk semua pengunjung tanpa deploy ulang.
Notifikasi memakai **Web Push** sungguhan (masuk ke perangkat walau situs sedang ditutup).

## Deploy (Vercel)
1. Push proyek ke GitHub, impor ke Vercel (build `npm run build`, output `dist`).
2. Buat Redis gratis: Vercel → Storage → **Upstash Redis** (atau upstash.com). Variabel `KV_REST_API_URL/TOKEN` atau `UPSTASH_REDIS_REST_URL/TOKEN` otomatis dikenali.
3. Isi Environment Variables (lihat `.env.example`):
   - `ADMIN_PASSWORD_HASH` → `npm run hash -- PASSWORD_BARU` (default password `babuljannah`, **wajib diganti**)
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` → `npm run vapid`
   - `CRON_SECRET` → string acak panjang
4. Deploy. Data awal (`api/_seed.js`) otomatis masuk ke Redis saat pertama diakses. Tombol **Reset** di admin mengembalikannya.

Hanya Vercel yang didukung (butuh fungsi `/api`); Netlify/Cloudflare Pages statis tidak cukup.

## Jalankan lokal
    npm install
    cp .env.example .env     # isi variabel Redis, dst.
    npm run dev              # /api ikut dijalankan oleh Vite

## Admin
Tambah/edit/hapus **Artikel**, **Acara**, **Jadwal** (maks 4 foto per artikel/acara; foto dikecilkan lalu disimpan di Redis).
Menyimpan artikel/acara **baru** otomatis mengirim notifikasi ke pelanggan pengumuman. Ada juga form **Kirim notifikasi** manual.
Ekspor/Impor = cadangan JSON. Login diperiksa di server (dibatasi 5 percobaan/menit).

## Notifikasi
- Ikon lonceng di navbar: pengumuman acara & artikel baru.
- Tombol **Ingatkan** pada jadwal/acara: pengingat untuk item itu.
- Pengingat dikirim oleh `/api/cron` (waktu WIB): H-1 (sejak 07.00), hari-H (sejak 06.00), dan 1 jam sebelum mulai. Sekali kirim per pengingat.
- `vercel.json` memasang cron **harian** (`0 1 * * *` = 08.00 WIB), batas paket Hobby. Untuk pengingat "1 jam lagi" yang tepat waktu, panggil
  `https://DOMAIN/api/cron?key=CRON_SECRET` tiap 5–10 menit lewat layanan gratis seperti cron-job.org (atau pakai Vercel Pro dengan jadwal lebih rapat).
- iPhone/iPad: push hanya bekerja bila situs ditambahkan ke Layar Utama (Bagikan → Tambah ke Layar Utama) dan dibuka dari ikon tersebut (iOS 16.4+).

## Struktur data Redis
`bj:artikel|acara|jadwal` (hash id→JSON), `bj:likes:<jenis>:<id>` (set perangkat), `bj:likecount`, `bj:foto:<id>`, `bj:subs`, `bj:subs:all`, `bj:rem:<j|a>:<id>`.

## Ubah konten lain
Nama, WhatsApp, alamat, stories, pengikut/mengikuti: `src/data.js` · Warna: `:root` di `src/styles.css`.
Jumlah *postingan* di profil dihitung otomatis dari jumlah acara.
