# RuangKreator — AI Video Studio

Website statis + Netlify Functions untuk membuat video AI memakai Nexabot API. Antarmuka berbahasa Indonesia, dengan konsep video affiliate dan AI influencer. Kunci API disimpan hanya di sisi server Netlify.

## Fitur

- Form brief untuk affiliate dan AI influencer, termasuk pembuat prompt dari isian.
- Text-to-video (t2v), image-to-video (i2v), dan reference-video-to-video (r2v), 9:16 / 16:9, 720p / 1080p.
- Unggah 1–3 gambar untuk image-to-video; video-to-video menerima satu MP4 sumber dan satu gambar karakter/produk opsional.
- Character Bible teks untuk persona influencer, disertai gambar referensi visual opsional.
- Status job dipolling sampai selesai, lalu video MP4 dapat dipreview dan diunduh.
- Cek kredit melalui endpoint Nexabot.
- Kode akses opsional di Netlify Functions untuk membatasi penggunaan.
- Layout responsif desktop dan ponsel.

## Jalankan secara lokal

Gunakan Netlify CLI agar serverless functions berjalan:

```bash
npm install -g netlify-cli
netlify dev
```

Atur environment variables pada shell sebelum menjalankan (jangan masukkan nilai rahasia ke file frontend):

```bash
export NEXABOT_API_KEY='API_KEY_BARU'
export SITE_ACCESS_CODE='KODE_AKSES_PANJANG'
netlify dev
```

Buka URL lokal yang ditampilkan Netlify CLI. Tanpa `NEXABOT_API_KEY`, UI dapat dibuka tetapi API akan memberi pesan konfigurasi.

## Deploy ke Netlify

1. Buat repositori Git baru dan unggah seluruh file proyek ini.
2. Di Netlify, pilih **Add new site → Import an existing project** dan hubungkan repositori.
3. Build command boleh dikosongkan. Publish directory: `public` (sesuai `netlify.toml`). Functions directory: `netlify/functions`.
4. Buka **Site configuration → Environment variables**, tambahkan:
   - `NEXABOT_API_KEY` = API key Nexabot yang masih aktif.
   - `SITE_ACCESS_CODE` = kode rahasia panjang untuk akses situs (sangat disarankan).
5. Deploy / trigger deploy ulang setelah mengatur environment.
6. Di situs, klik ikon kunci di kanan atas dan masukkan nilai `SITE_ACCESS_CODE` yang sama. Nilainya disimpan di local storage browser pengguna.

Alternatif: Netlify CLI `netlify deploy --prod` dari folder proyek yang sudah terhubung dengan site.

## Keamanan dan biaya

- **Jangan pernah menaruh API key di `app.js`, HTML, atau variabel `VITE_*` / `NEXT_PUBLIC_*`.** Function server meneruskan key dari `NEXABOT_API_KEY`.
- API key pernah dibagikan di percakapan saat meminta pembuatan ini. Anggap key tersebut sudah terpapar: cabut/rotate di Nexabot, lalu masukkan **key baru** ke Netlify Environment Variables. Jangan salin key lama ke proyek.
- Menurut dokumentasi Nexabot yang dibaca pada 24 Oktober 2026, API memakai `POST /api/v1/api`, polling `GET /api/v1/jobs/{job_id}`, unduh `GET /api/v1/jobs/{job_id}/download`, dan pemeriksaan kredit `GET /api/v1/api/credit`. Dokumentasi menyebut biaya standar 0.15 kredit per request (kecuali API Unlimited aktif), kredit direfund jika job gagal, dan batas paralel tertentu untuk plan Unlimited. Detail bisa berubah; cek [dokumentasi Nexabot](https://nexabot.id/api-docs).
- Jika kamu mengosongkan `SITE_ACCESS_CODE`, endpoint dapat dipanggil siapa saja yang menemukan situs. Situs publik tanpa autentikasi/rate limit bisa menghabiskan kredit API. Atur kode akses sebelum dibuka publik, dan bagikan hanya kepada pengguna tepercaya. Kode akses sederhana ini bukan pengganti sistem akun/kuota produksi.
- Video AI perlu direview sebelum dipublikasikan. Hindari menyamar sebagai orang nyata, klaim produk yang tidak terbukti, atau memakai aset tanpa izin. Tandai konten sintetis sesuai aturan platform yang digunakan.

## Catatan teknis

- Media dikirim ke API Nexabot sebagai data URI Base64. Karena payload function Netlify dibatasi, UI membatasi video sumber MP4 hingga 3 MB dan ukuran gabungan media hingga 4 MB.
- Mode `r2v` mengikuti skema dokumentasi Nexabot: `media[0]` adalah video dan `media[1]` adalah gambar referensi opsional. Dokumen mengestimasi r2v sekitar 380 detik.
- Dukungan r2v di API tidak menjamin penggantian wajah/identitas yang presisi atau hasil karakter identik di setiap frame. Prompt Character Bible dan gambar referensi mengarahkan re-kreasi karakter; uji dulu dengan klip pendek dan review hasilnya.
- API docs yang diperiksa: `https://nexabot.id/api-docs`.
- Proyek tidak mencakup akun pengguna, penyimpanan riwayat job permanen, pembayaran, atau upload storage. Video hasil disimpan sementara di browser selama tab terbuka.
