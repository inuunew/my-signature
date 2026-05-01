// app/page.js
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* --- NAVBAR --- */}
      <nav className="flex justify-between items-center py-6 px-8 md:px-16 max-w-7xl mx-auto">
        {/* Logo */}
        <div className="text-2xl font-bold tracking-tighter text-gray-950">
          Dn
        </div>
        
        {/* Menu Navigasi - Tersembunyi di Mobile */}
        <div className="hidden md:flex items-center space-x-10 text-sm font-medium text-gray-700">
          <a href="#" className="hover:text-gray-950 transition">Beranda</a>
          <a href="#" className="hover:text-gray-950 transition">Tentang</a>
          <a href="#" className="hover:text-gray-950 transition">Keahlian</a>
          <a href="#" className="hover:text-gray-950 transition">Proyek</a>
          <a href="#" className="hover:text-gray-950 transition">Blog</a>
        </div>
        
        {/* Tombol CTA */}
        <button className="bg-gray-950 text-white px-7 py-3 rounded-full text-xs font-semibold hover:bg-gray-800 transition shadow-sm">
          Hubungi Saya
        </button>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="max-w-7xl mx-auto px-8 md:px-16 py-16 md:py-24 grid md:grid-cols-2 gap-16 items-center">
        
        {/* BAGIAN KIRI: TEKS */}
        <div className="space-y-7 order-2 md:order-1">
          <div className="inline-block bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase">
            👋 Hello, I'm
          </div>
          
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tighter text-gray-950 leading-tight">
            Danendra N Rs
          </h1>
          
          {/* Subtitle dengan Garis Bawah */}
          <div className="relative inline-block">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 relative z-10">
              Web Developer & UI/UX Enthusiast
            </h2>
            <div className="absolute bottom-1 left-0 w-full h-3 bg-gray-950 z-0 opacity-10 rounded"></div>
          </div>
          
          <p className="text-gray-600 text-lg leading-relaxed max-w-lg">
            Saya menciptakan pengalaman digital yang modern, fungsional, dan estetis. Bersemangat mengubah ide kompleks menjadi desain yang elegan.
          </p>
          
          {/* Tombol Aksi */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button className="bg-gray-950 text-white px-9 py-4 rounded-full font-semibold hover:bg-gray-800 transition shadow-lg text-center">
              Lihat Karya Saya
            </button>
            <button className="bg-white text-gray-950 px-9 py-4 rounded-full font-semibold border border-gray-300 hover:bg-gray-50 transition text-center">
              Hubungi Saya
            </button>
          </div>

          {/* Ikon Sosial Media */}
          <div className="flex items-center space-x-6 pt-8 text-gray-400">
            <span className="text-sm font-medium text-gray-500">Ikuti Saya:</span>
            <a href="#" className="hover:text-gray-950 transition text-xl"><i className="fab fa-facebook-f"></i></a>
            <a href="#" className="hover:text-gray-950 transition text-xl"><i className="fab fa-instagram"></i></a>
            <a href="#" className="hover:text-gray-950 transition text-xl"><i className="fab fa-youtube"></i></a>
          </div>
        </div>

        {/* BAGIAN KANAN: VISUAL (Gambar & Badge) */}
        <div className="relative order-1 md:order-2 flex justify-center md:justify-end items-center">
          
          {/* Elemen Dekoratif Lingkaran Bergaris (Sesuai Desain Canva) */}
          <div className="absolute -z-10 w-[450px] h-[450px] rounded-full border-[16px] border-gray-100 opactiy-50"></div>
          <div className="absolute -z-10 w-[350px] h-[350px] rounded-full border-[2px] border-gray-200"></div>

          {/* Bingkai Foto Utama */}
          <div className="relative w-80 h-80 md:w-96 md:h-96 rounded-full overflow-hidden border-[12px] border-white shadow-2xl z-10">
            {/* GANTI DENGAN FOTO ANDA */}
            <Image 
              src="https://via.placeholder.com/400x400?text=Foto+Danendra" 
              alt="Danendra N Rs"
              fill
              className="object-cover"
              priority
            />
          </div>
          
          {/* Floating Badge: Tahun Pengalaman */}
          <div className="absolute bottom-10 -left-8 md:-left-12 bg-white p-5 rounded-2xl shadow-xl flex items-center space-x-4 z-20 border border-gray-100">
            <div className="bg-gray-950 text-white p-3 rounded-xl flex items-center justify-center">
              <i className="fas fa-briefcase text-2xl"></i>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-950">Tahun Pengalaman</div>
              <div className="text-4xl font-extrabold text-gray-950 tracking-tight">5+</div>
            </div>
          </div>

          {/* Dekorasi Titik-Titik Kecil */}
          <div className="absolute top-10 right-10 text-gray-200 text-5xl z-0 opacity-50">
            <i className="fas fa-ellipsis-h"></i>
          </div>
        </div>
        
      </main>
    </div>
  )
}
