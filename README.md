# Laboratorium Fisika Virtual — Versi 1.1.5

Aplikasi praktikum fisika mobile-first berbasis **Vite + React + Three.js** untuk evaluasi pemahaman mahasiswa melalui simulasi 3D, manipulasi variabel, persamaan LaTeX, dan jawaban esai.

## Pembaruan v1.1

- Bottom bar dibuat rata tengah dengan tetap mendukung scroll horizontal di layar HP.
- Link Google Drive tidak lagi menjadi syarat untuk membuka soal.
- Link laporan PDF Google Drive bersifat opsional dan tetap mendukung copy-paste.
- Editor esai WYSIWYG diperbaiki: heading, bold, italic, underline, strike, subscript, superscript, list, quote, alignment, undo/redo, clear format, dan sisip rumus LaTeX.
- Persamaan utama setiap praktikum ditampilkan menggunakan LaTeX via MathJax.
- Panduan ditambah instruksi eksplisit untuk mengamati simulasi dan memanipulasi variabel.
- Tombol/menu Simpan Lokal dihapus dari antarmuka mahasiswa.
- Jawaban mahasiswa tetap bisa diedit dan dikirim ulang sampai admin/dosen memberi nilai.
- Admin dapat upload Excel untuk menambah user massal.
- Template Excel tersedia di `public/templates/template-user-mahasiswa.xlsx`.
- Username admin dan form login awal dikosongkan agar lebih aman saat dipublish.

## Fitur Utama

- Vite + React + Three.js.
- Desain fokus HP/mobile-first.
- Tombol tema **Gelap** dan **Terang**.
- Login role Admin dan Mahasiswa.
- Bottom bar:
  - Panduan.
  - Hukum Ohm.
  - Hukum Lensa.
  - Indeks Bias.
  - Gelombang Stasioner.
  - Resonansi Bunyi.
  - Kapasitor.
  - Prinsip Transformator.
  - Muai Panjang.
- Tiap praktikum memiliki:
  - simulasi 3D,
  - kontrol variabel,
  - hasil perhitungan,
  - rumus utama LaTeX,
  - link laporan opsional,
  - 2 pertanyaan esai,
  - editor WYSIWYG.
- Mode mahasiswa membatasi klik kanan, copy, paste pada jawaban, cut, drag, print, dan beberapa shortcut umum.
- Khusus kolom link Google Drive, copy-paste tetap diizinkan.
- Menu Admin:
  - **User** untuk tambah mahasiswa manual atau upload Excel.
  - **Nilai** untuk melihat submit dan memberi nilai.
- Favicon SVG tersedia di `public/favicon.svg`.
- API Vercel disiapkan di folder `api/` untuk integrasi Neon.

## Template Excel User

File template:

```text
public/templates/template-user-mahasiswa.xlsx
```

Kolom yang digunakan:

```text
Nama | NIM | Kelas | Kode Akses
```

Kolom wajib: **Nama**, **NIM**, dan **Kode Akses**. Kolom **Kelas** boleh kosong.

## Menjalankan Lokal

```bash
npm install
npm run dev
```

Buka:

```text
http://localhost:5173
```

## Build Production

```bash
npm run build
npm start
```

Buka:

```text
http://localhost:3000
```

## Deploy ke Vercel

1. Push project ini ke GitHub.
2. Import repository di Vercel.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Deploy.

File `vercel.json` sudah disiapkan.

## Persiapan Neon Database

Saat Neon sudah dibuat, tambahkan Environment Variable di Vercel:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require
```

Endpoint serverless yang sudah disiapkan:

```text
GET    /api/users
POST   /api/users
DELETE /api/users?id=...
GET    /api/submissions
POST   /api/submissions
PATCH  /api/submissions
```

Schema tabel akan dibuat otomatis oleh fungsi `ensureSchema()` di `api/_db.js` saat endpoint dipanggil dan `DATABASE_URL` tersedia.

## Catatan Penting

- Login masih prototipe frontend. Untuk produksi sungguhan, pindahkan autentikasi admin/mahasiswa ke backend.
- Jika `DATABASE_URL` belum diatur, data berjalan di `localStorage` browser.
- Admin dan mahasiswa di perangkat berbeda baru benar-benar sinkron setelah backend/database Neon aktif.
- Browser tidak dapat memblokir screenshot perangkat secara absolut. Pembatasan yang tersedia bersifat deterrent di sisi browser.

## Perbaikan v1.1.1

- Visual transformator diperbarui: lilitan primer dan sekunder kini ditampilkan sebagai coil/ring 3D yang terlihat jelas, lengkap dengan label Np dan Ns.
- Render rumus LaTeX diperbaiki agar rumus berubah mengikuti topik aktif, misalnya dari Hukum Ohm ke Muai Panjang.
- Layout utama dibuat satu kolom menurun pada semua ukuran layar agar lebih nyaman digunakan di HP.
- Bottom bar tetap diratakan ke tengah dengan scroll horizontal saat menu melebihi lebar layar.

## Perbaikan v1.1.5

- Tiap praktikum pada mode mahasiswa sekarang hanya menampilkan satu tombol aksi utama: **Simpan Jawaban**.
- Tombol lama seperti Kirim Praktikum Ini, Unduh JSON, Payload, Reset, dan Simpan Link laporan dihapus dari tampilan mahasiswa.
- Jawaban yang sudah disimpan akan dimuat kembali ketika mahasiswa membuka lagi topik praktikum yang sama.
- Link Google Drive tetap opsional dan ikut tersimpan melalui tombol **Simpan Jawaban**.
- Admin tetap dapat melihat jawaban yang sudah disimpan melalui menu **Nilai**.


## Perbaikan v1.1.5

- Editor esai diperkuat agar jawaban panjang tidak hilang ketika komponen render ulang.
- Setiap editor menyimpan draft otomatis per mahasiswa, per praktikum, dan per soal di localStorage.
- Tombol Simpan Jawaban membaca isi terbaru dari draft editor sebelum menyimpan ke daftar nilai admin.
