# Tianetflix (NETFLIX-NELL)

Katalog film responsif dengan frontend Vite modular dan backend Express. Data katalog dan pencarian berasal dari TMDB melalui endpoint server aplikasi. Pemutar film menggunakan embed VidLink; trailer memakai YouTube.

Frontend mencakup film dan serial TV: trending, popular, top-rated, on-air, filter genre, pengurutan katalog, detail, multi-search film/serial/orang, season dan episode, My List lokal, pagination, trailer, serta player VidLink. Subtitle eksternal opsional menerima URL HTTPS langsung ke file `.vtt`; pengaturan disimpan sementara di memori halaman per film/episode.

## Persyaratan

- Node.js 22.12 atau lebih baru
- npm 10 atau lebih baru
- Credential TMDB: API key v3 **atau** API Read Access Token v4

## Instalasi dan konfigurasi

```sh
npm install
cp .env.example .env
```

Isi salah satu dari `TMDB_API_KEY` atau `TMDB_ACCESS_TOKEN` di `.env`. Jangan isi keduanya kecuali ada alasan operasional; access token v4 dikirim sebagai Bearer, API key v3 sebagai query parameter server-side. Sesuaikan `CLIENT_ORIGIN` dengan origin browser yang diizinkan (default `http://localhost:5173`). `PORT` default 3000.

## Menjalankan lokal

Jalankan backend dan frontend di dua terminal:

```sh
npm run server
npm run dev
```

Buka URL Vite yang ditampilkan (default `http://localhost:5173`). Vite meneruskan `/api` ke backend di port 3000. Untuk server pada host/port berbeda, sesuaikan proxy di `vite.config.js` dan origin di `.env`.

## Build dan preview

```sh
npm run build
npm run preview
```

Build menghasilkan frontend statis di `public/`, yang disajikan Vercel lewat CDN. Root `index.js` mengekspor aplikasi Express agar Vercel menjalankan endpoint backend sebagai Function. `vercel.json` memilih framework Express dan menjalankan `npm run build`. Untuk deploy Vercel, import repo, pastikan Node.js 26 (default) atau minimal 22.12, lalu isi environment variables backend di Project Settings. TMDB API key atau access token tetap wajib. Jangan publikasikan `.env` atau menaruh credential TMDB di frontend. CSS dan ikon SVG dibundel lokal; browser hanya meminta sumber eksternal saat memuat gambar TMDB, trailer YouTube, dan player VidLink.

### Shared rate limit di Vercel

Limiter memakai Upstash Redis REST bila dua environment variable ini tersedia:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Buat database Redis di Upstash, lalu salin URL dan token REST ke Vercel Project Settings untuk Production, Preview, dan Development sesuai kebutuhan. Saat kedua variabel belum disetel, deployment tetap bisa berjalan memakai limiter memory lokal per instance; pada Vercel ini hanya fallback dan hitungan tidak dibagi antar instance. Bila Upstash lambat/gagal, backend menggunakan fallback lokal sementara agar katalog tetap merespons. Limiter membatasi 90 request API per menit per IP, memakai IP forwarded dari Vercel, dan fallback dibatasi maksimum 1,5 detik menunggu Upstash.

## Endpoint API

Semua endpoint hanya menerima GET dan berada di bawah `/api`.

| Endpoint | Kegunaan |
| --- | --- |
| `/api/health` | Pemeriksaan backend |
| `/api/movies/trending?page=1` | Film trending harian |
| `/api/movies/popular?page=1` | Film populer |
| `/api/movies/top-rated?page=1` | Film rating tertinggi |
| `/api/movies/discover?genre=28&page=1&sort=vote_average.desc` | Discover, genre dan urutan opsional (`popularity.desc`, `vote_average.desc`, `primary_release_date.desc`) |
| `/api/genres` | Genre film |
| `/api/search/movies?q=alien&page=1` | Pencarian film |
| `/api/movies/:id` | Detail film |
| `/api/movies/:id/videos` | Trailer/video film |
| `/api/search/multi?q=agent%20kim` | Pencarian film, serial TV, dan orang |
| `/api/tv/trending?window=week` | Trending serial (day/week) |
| `/api/tv/popular`, `/api/tv/top-rated` | Serial populer dan rating tertinggi |
| `/api/tv/on-the-air`, `/api/tv/airing-today` | Jadwal serial |
| `/api/tv/genres` | Genre serial TV |
| `/api/tv/discover?genre=18&page=1&sort=first_air_date.desc` | Discover serial dengan filter genre/sort |
| `/api/tv/:id`, `/api/tv/:id/videos` | Detail dan trailer serial |
| `/api/tv/:id/season/:season` | Daftar episode untuk season |
| `/api/tv/:id/season/:season/episode/:episode` | Detail episode |
| `/api/people/:id` | Profil orang beserta kredit film/serial |

Backend memvalidasi parameter, memberi timeout upstream 8 detik, cache memori 60 detik, dan membatasi laju API hingga 90 request per menit per alamat klien. Di Vercel, shared rate limiting tersedia melalui Upstash Redis REST; tanpa konfigurasi Upstash, limiter memory hanya berlaku per instance. Endpoint memakai daftar route dan sort yang diizinkan; tidak ada proxy URL generik. Kegagalan TMDB ditampilkan sebagai pesan aman.

## TMDB, VidLink, dan batasan

TMDB credential digunakan backend saja; respons `/api` tidak berisi credential. Metadata dan ketersediaan dapat berubah sesuai TMDB. VidLink memakai format resmi `https://vidlink.pro/movie/{tmdbId}` dengan warna tema dan autoplay nonaktif. URL subtitle VTT eksternal dikirim ke VidLink melalui `sub_file` dan `sub_label`; aplikasi tidak mengunduh atau meng-host subtitle. Subtitle harus berupa file langsung yang dapat diakses pemutar. VidLink adalah layanan pihak ketiga: ketersediaan, iklan, kualitas, dan waktu operasi tidak dijamin oleh aplikasi. Trailer disediakan oleh YouTube. Browser meminta gambar dari TMDB serta trailer/player dari penyedia masing-masing.

Pesan player hanya dipertimbangkan jika origin persis `https://vidlink.pro` dan bentuk data event valid. Data player tidak disimpan. Iframe tidak diberi `sandbox` karena dapat mengganggu kompatibilitas pemutar; perlakukan konten pihak ketiga sebagai tidak tepercaya.

## Keamanan credential

Kunci TMDB lama pernah disimpan di JavaScript publik. Hapus atau rotasi/revoke key tersebut dari akun TMDB, lalu pasang credential baru hanya di environment backend. `.gitignore` mencegah `.env` baru ikut di-commit; key dalam commit Git lama tetap dapat ditemukan dari riwayat sehingga rotasi diperlukan.
