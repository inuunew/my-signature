// database-blog.js
const databaseBlog = [
    {
        id: "1",
        kategori: "Teknologi",
        warna: "#2D3E50",
        judulBanner: "Belajar Laravel untuk Pemula",
        judulArtikel: "Belajar Laravel untuk Pemula #1",
        tanggal: "23 Des 2025",
        durasi: "4 Min Read",
        deskripsi: "Artikel ini membahas dasar-dasar Laravel untuk pengembang web.",
        isi: "<p>Laravel adalah framework PHP yang tangguh dan elegan yang dirancang untuk pengembang web yang membutuhkan toolkit sederhana namun kaya fitur.</p><p>Dalam seri panduan ini, kita akan membahas cara menginstal Laravel, mengatur koneksi database, dan membuat sistem routing pertama Anda. Memahami konsep MVC (Model-View-Controller) sangat krusial di sini.</p>"
    },
    {
        id: "2",
        kategori: "Tips",
        warna: "#7B61FF",
        judulBanner: "Tips Belajar Pemrograman",
        judulArtikel: "Tips Belajar Pemrograman Efektif #2",
        tanggal: "28 Des 2025",
        durasi: "3 Min Read",
        deskripsi: "Bagaimana cara belajar pemrograman dengan cepat dan menyenangkan.",
        isi: "<p>Belajar coding bisa terasa mengintimidasi pada awalnya. Namun, dengan pendekatan yang tepat, siapa pun bisa menguasainya.</p><h3>1. Mulai dari Fundamental</h3><p>Jangan terburu-buru belajar framework. Pahami dulu dasar-dasar logika, variabel, dan struktur kontrol.</p><h3>2. Konsistensi adalah Kunci</h3><p>Lebih baik ngoding 1 jam setiap hari daripada 10 jam di akhir pekan. Otak butuh waktu untuk memproses informasi baru.</p>"
    },
    {
        id: "3",
        kategori: "Teknologi",
        warna: "#007BFF",
        judulBanner: "Mengenal ReactJS Lebih Dekat",
        judulArtikel: "Mengenal ReactJS Lebih Dekat #3",
        tanggal: "05 Jan 2026",
        durasi: "5 Min Read",
        deskripsi: "Pengenalan dasar ReactJS dan mengapa library ini sangat populer.",
        isi: "<p>ReactJS telah mengubah cara kita membangun antarmuka pengguna di web. Dibuat oleh Facebook, React menggunakan konsep komponen yang dapat digunakan ulang.</p><p>Salah satu kekuatan utama React adalah <strong>Virtual DOM</strong>, yang membuatnya sangat cepat dalam memperbarui tampilan tanpa harus me-reload seluruh halaman. Di artikel ini kita akan belajar cara membuat komponen pertama kita.</p>"
    },
    {
        id: "4",
        kategori: "Tutorial",
        warna: "#0EA5E9", // Warna Biru Tailwind
        judulBanner: "Styling Cepat dengan Tailwind",
        judulArtikel: "Membuat UI Modern Lebih Cepat dengan Tailwind CSS",
        tanggal: "15 Jan 2026",
        durasi: "4 Min Read",
        deskripsi: "Mengapa Tailwind CSS menjadi pilihan utama developer modern untuk membangun antarmuka web.",
        isi: "<p>Dulu, menulis CSS kustom untuk setiap elemen bisa memakan waktu berjam-jam. Kini, dengan pendekatan <em>utility-first</em> dari Tailwind CSS, kita bisa menata gaya langsung di dalam HTML.</p><p>Kelebihan utamanya adalah tidak ada lagi file CSS yang membengkak, dan kamu tidak perlu lagi memikirkan nama class yang ribet. Cukup gunakan class seperti <code>flex</code>, <code>pt-4</code>, dan <code>text-center</code>, tampilanmu akan langsung berubah seketika.</p>"
    },
    {
        id: "5",
        kategori: "Tips",
        warna: "#000000", // Warna Hitam Vercel
        judulBanner: "Deploy Web Gratis di Vercel",
        judulArtikel: "Panduan Lengkap Deploy Website HTML ke Vercel",
        tanggal: "10 Feb 2026",
        durasi: "3 Min Read",
        deskripsi: "Cara mudah dan cepat mengunggah proyek web statis kamu ke internet secara gratis menggunakan Vercel.",
        isi: "<p>Punya portofolio keren di laptop tapi bingung cara menayangkannya ke internet? Vercel adalah jawabannya.</p><p>Kamu hanya perlu mengunggah kodemu ke GitHub, lalu menyambungkannya ke dashboard Vercel. Dalam hitungan detik, website kamu akan mendapatkan link aktif (URL) yang bisa diakses oleh siapa saja di seluruh dunia. Tanpa perlu setting server yang rumit!</p>"
    },
    {
        id: "6",
        kategori: "Desain",
        warna: "#F43F5E", // Warna Rose
        judulBanner: "Dasar UI/UX Web Design",
        judulArtikel: "5 Aturan Emas Desain UI/UX untuk Pemula",
        tanggal: "25 Feb 2026",
        durasi: "6 Min Read",
        deskripsi: "Meningkatkan pengalaman pengguna di website kamu dengan prinsip desain yang benar.",
        isi: "<p>Sebuah website tidak hanya harus bekerja dengan baik (kodenya), tapi juga harus mudah dan nyaman digunakan oleh manusia.</p><ul><li><strong>Hierarki Visual:</strong> Gunakan ukuran teks yang berbeda agar mata pengunjung tahu mana yang harus dibaca duluan.</li><li><strong>White Space:</strong> Jangan takut dengan ruang kosong. Ruang kosong membuat website terlihat elegan dan tidak sumpek.</li><li><strong>Konsistensi:</strong> Gunakan palet warna dan bentuk tombol yang seragam di seluruh halaman.</li></ul>"
    },
    {
        id: "7",
        kategori: "Teknologi",
        warna: "#171717", // Warna Dark Gray
        judulBanner: "Next.js Era Baru React",
        judulArtikel: "Mengenal Next.js: Framework React untuk Produksi",
        tanggal: "12 Mar 2026",
        durasi: "5 Min Read",
        deskripsi: "Keunggulan Next.js dalam rendering (SSR & SSG) dan SEO dibandingkan React murni.",
        isi: "<p>Jika kamu sudah menguasai React, langkah selanjutnya adalah beralih ke Next.js. React murni berjalan di browser pengguna (Client-Side Rendering), yang terkadang kurang ramah untuk SEO Google.</p><p>Next.js menyelesaikan masalah ini dengan merender halaman di server (Server-Side Rendering) sebelum dikirim ke browser. Hasilnya? Website yang jauh lebih cepat dimuat dan lebih disukai oleh mesin pencari.</p>"
    },
    {
        id: "8",
        kategori: "Tutorial",
        warna: "#10B981", // Warna Emerald/Hijau
        judulBanner: "Integrasi API JavaScript",
        judulArtikel: "Cara Menghubungkan Website HTML dengan REST API",
        tanggal: "02 Apr 2026",
        durasi: "5 Min Read",
        deskripsi: "Belajar mengambil dan mengirim data ke server menggunakan Fetch API bawaan JavaScript.",
        isi: "<p>Website modern sangat bergantung pada pertukaran data secara dinamis. Misalnya, mengambil data cuaca, berita, atau mengirim formulir kontak.</p><p>Dengan menggunakan fungsi <code>fetch()</code> di JavaScript vanilla, kita bisa melakukan panggilan HTTP ke server luar. Contoh penerapannya adalah mengambil data produk dari database dan menampilkannya sebagai elemen HTML secara dinamis di layar.</p>"
    }
];
