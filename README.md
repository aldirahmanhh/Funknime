<div align="center">
  <img src="public/logo.png" alt="MrFunk" width="120" />
  <h1>MrFunk</h1>
  <p><b>Nonton anime, donghua, & baca komik sub Indo — satu tempat, gratis.</b></p>

  ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
  ![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
  ![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel)
  ![License](https://img.shields.io/badge/License-CC_BY--NC--ND_4.0-lightgrey)
  [![Trakteer](https://img.shields.io/badge/Trakteer-Donasi-red?logo=buymeacoffee&logoColor=white)](https://teer.id/anrizz)

  <br/>
  <a href="https://www.mrfunk.my.id"><b>Live Site</b></a> &nbsp;·&nbsp;
  <a href="https://teer.id/anrizz"><b>Trakteer</b></a> &nbsp;·&nbsp;
  <a href="https://github.com/aldirahmanhh/Funknime/issues"><b>Report Bug</b></a>
</div>

---

## Apa ini?

MrFunk ngambil data dari beberapa provider anime & komik (Otakudesu, Samehadaku, BacaKomik, dll) lewat satu API, terus nampilin semuanya di satu website yang enak dipake.

Fitur utamanya:
- **Multi-provider** — otomatis fallback kalau satu server mati
- **Anime + Donghua + Komik** — tiga konten dalam satu tempat
- **Lanjut nonton** — nyimpen progress sampai menit & detik terakhir
- **Tanpa login** — langsung pake, ga ribet

## Tech

| | |
|---|---|
| Frontend | React 19 + Vite 8 |
| Routing | React Router v7 |
| Hosting | Vercel (serverless) |
| Data | [Sankavollerei API](https://www.sankavollerei.web.id) |
| Donasi | [Trakteer API](https://trakteer.id) |

## Jalanin di lokal

```bash
git clone https://github.com/aldirahmanhh/Funknime.git
cd Funknime
npm install
npm run dev
```

Build production:
```bash
npm run build
```

## Struktur

```
src/
├── components/    # semua halaman & komponen
├── contexts/      # theme context
├── hooks/         # useDebounce, useInfiniteScroll
├── services/      # api.js (fetch + cache + rate limit)
├── utils/         # watch history (localStorage)
├── main.jsx       # entry point
```

## Fitur lengkap

- Search gabungan (Anime + Donghua + Komik)
- Streaming anime multi-server dengan quality selector
- Donghua (ongoing, completed, genre, A-Z)
- Komik — BacaKomik provider (12 endpoint)
  - Terbaru, Populer, Top Peringkat, Rekomendasi
  - Browse by Genre, Type (Manga/Manhwa/Manhua)
  - Komik Berwarna, Chapter Reader (scroll & paginated)
- Jadwal tayang harian
- Browse genre dari 2 provider
- Daftar A-Z (anime & donghua)
- Watch history + resume dari menit terakhir
- Trakteer donasi + leaderboard top donatur
- Anti-ads bawaan buat iframe streaming
- Responsive (mobile, tablet, desktop)
- Dark cinema-lounge UI (satu tema gelap signature, aksen ungu fungsional)

## Credits

- **API** — [Sankavollerei](https://www.sankavollerei.web.id) (gratis, rate limit 50 req/min)
- **Donasi** — [Trakteer](https://teer.id/anrizz)
- **Icons** — Inline SVG set buatan sendiri (tanpa dependency)

## Dukung project ini

Kalau kamu suka MrFunk, dukung lewat Trakteer:

[![Trakteer](https://img.shields.io/badge/Trakteer-Donasi_Sekarang-red?style=for-the-badge&logo=buymeacoffee&logoColor=white)](https://teer.id/anrizz)

Atau cukup kasih star di repo ini — itu juga udah bantu banget.

## Lisensi

Lisensi: **[CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/)** — detail lengkap ada di file `LICENSE`.

## Disclaimer

Project ini dibuat buat belajar. Semua konten disediakan oleh pihak ketiga, MrFunk ga nyimpen file apapun.

---

<div align="center">
  <sub>Made with 💜 by <a href="https://github.com/aldirahmanhh">aldirahmanhh</a></sub>
</div>