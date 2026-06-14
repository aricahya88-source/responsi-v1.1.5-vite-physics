export default function GuidePage({ role }) {
  return (
    <section className="guide-page">
      <div className="panel guide-hero">
        <p className="eyebrow">Panduan Praktikum</p>
        <h2>Cara Mengerjakan</h2>
        <p>
          Ikuti urutan kerja berikut agar observasi simulasi, jawaban esai, dan proses penilaian berjalan rapi.
        </p>
      </div>

      <div className="guide-list">
        <article className="panel guide-step">
          <span className="step-number">1</span>
          <h3>Pilih topik praktikum</h3>
          <p>
            Gunakan bottom bar untuk membuka topik praktikum. Setiap topik memiliki simulasi 3D, parameter yang dapat diubah, persamaan utama, hasil perhitungan, dan dua soal esai.
          </p>
        </article>

        <article className="panel guide-step">
          <span className="step-number">2</span>
          <h3>Amati simulasi 3D</h3>
          <p>
            Putar, perbesar, dan amati objek simulasi. Perhatikan perubahan visual saat variabel digeser, misalnya perubahan arus, posisi bayangan, pembiasan cahaya, pola gelombang, atau pertambahan panjang.
          </p>
        </article>

        <article className="panel guide-step">
          <span className="step-number">3</span>
          <h3>Manipulasi variabel</h3>
          <p>
            Ubah parameter percobaan secara bertahap. Bandingkan sebelum dan sesudah perubahan, lalu catat pola yang muncul dari hasil perhitungan serta persamaan LaTeX yang ditampilkan.
          </p>
        </article>

        <article className="panel guide-step">
          <span className="step-number">4</span>
          <h3>Kerjakan 2 soal esai</h3>
          <p>
            Jawab dengan bahasa sendiri. Jelaskan hubungan antara konsep, persamaan, hasil angka, dan fenomena yang terlihat pada simulasi. Hindari jawaban yang hanya menyalin rumus.
          </p>
        </article>

        <article className="panel guide-step">
          <span className="step-number">5</span>
          <h3>Link laporan bersifat opsional</h3>
          <p>
            Jika dosen meminta laporan PDF, tempel link Google Drive pada kolom laporan. Khusus kolom link Google Drive, copy-paste tetap diizinkan agar mahasiswa tidak perlu mengetik URL panjang secara manual.
          </p>
        </article>

        <article className="panel guide-step">
          <span className="step-number">6</span>
          <h3>Simpan dan perbarui jawaban</h3>
          <p>
            Tekan Simpan Jawaban setelah dua esai terisi. Jika kembali ke topik praktikum yang sama, jawaban yang sudah tersimpan akan dimuat kembali dan masih dapat diedit selama admin/dosen belum memberikan nilai.
          </p>
        </article>
      </div>

      {role === "student" ? (
        <p className="guard-note panel">
          Mode mahasiswa membatasi paste pada jawaban, klik kanan, print, dan beberapa shortcut umum. Screenshot perangkat tidak dapat diblokir sepenuhnya oleh browser, sehingga pembatasan ini bersifat pencegahan awal.
        </p>
      ) : null}
    </section>
  );
}
