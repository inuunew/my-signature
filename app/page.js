// app/page.js
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen font-sans">
      
      {/* --- NAVBAR --- */}
      <nav className="flex justify-between items-center py-6 px-8 md:px-16 max-w-7xl mx-auto">
        <div className="text-2xl font-bold tracking-tighter text-gray-900">Dn</div>
        <div className="hidden md:flex items-center space-x-10 text-sm font-medium text-gray-600">
          <a href="#" className="hover:text-gray-900 transition">Beranda</a>
          <a href="#" className="hover:text-gray-900 transition">Tentang</a>
          <a href="#" className="hover:text-gray-900 transition">Keahlian</a>
          <a href="#" className="hover:text-gray-900 transition">Proyek</a>
          <a href="#" className="hover:text-gray-900 transition">Blog</a>
        </div>
        <button className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-gray-800 transition shadow-sm">
          Hubungi Saya
        </button>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="max-w-7xl mx-auto px-8 md:px-16 py-16 md:py-24 grid md:grid-cols-2 gap-16 items-center">
        <div className="space-y-7 order-2 md:order-1 text-center md:text-left">
          <div className="inline-block bg-gray-100 text-gray-500 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase">
            👋 Hello, I'm
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tighter text-gray-900 leading-[1.1]">
            Danendra N Rs
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-700 border-l-4 border-gray-900 pl-4 inline-block md:block">
            Web Developer & UI/UX Enthusiast
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed max-w-lg mx-auto md:mx-0">
            Saya menciptakan pengalaman digital yang modern dan fungsional. Bersemangat mengubah ide kompleks menjadi desain yang elegan dan intuitif.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
            <button className="bg-gray-900 text-white px-9 py-4 rounded-full font-bold hover:bg-gray-800 transition shadow-lg">
              Lihat Karya Saya
            </button>
            <button className="bg-white text-gray-900 px-9 py-4 rounded-full font-bold border border-gray-200 hover:bg-gray-50 transition">
              Hubungi Saya
            </button>
          </div>
          <div className="flex items-center space-x-6 pt-6 text-gray-400 justify-center md:justify-start">
            <a href="#" className="hover:text-gray-900 transition text-xl"><i className="fab fa-facebook-f"></i></a>
            <a href="#" className="hover:text-gray-900 transition text-xl"><i className="fab fa-instagram"></i></a>
            <a href="#" className="hover:text-gray-900 transition text-xl"><i className="fab fa-youtube"></i></a>
          </div>
        </div>
        <div className="relative order-1 md:order-2 flex justify-center md:justify-end">
          <div className="relative w-80 h-80 md:w-96 md:h-96 rounded-full overflow-hidden border-[12px] border-white shadow-2xl z-10">
            <Image src="https://via.placeholder.com/400" alt="Danendra" fill className="object-cover" />
          </div>
          <div className="absolute bottom-10 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center space-x-4 z-20 border border-gray-50">
            <div className="bg-gray-100 p-3 rounded-xl">
              <i className="fas fa-medal text-gray-900 text-xl"></i>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tahun Pengalaman</div>
              <div className="text-2xl font-black text-gray-900">5+</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- TENTANG SAYA --- */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8 md:px-16 grid md:grid-cols-2 gap-20 items-center">
          <div className="rounded-[40px] overflow-hidden border-[10px] border-gray-50 shadow-xl relative aspect-[4/3]">
            <Image src="https://via.placeholder.com/600x450" alt="About" fill className="object-cover" />
          </div>
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-[2px] bg-gray-900"></div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Tentang Saya</span>
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 leading-tight">Web Developer dengan Passion untuk Inovasi</h2>
            <p className="text-gray-500 leading-relaxed">
              Dengan pengalaman lebih dari 5 tahun, saya telah mengerjakan berbagai proyek, mulai dari website profil perusahaan hingga aplikasi web yang kompleks. Keahlian utama saya adalah mengubah ide menjadi solusi digital yang nyata.
            </p>
            <div className="grid grid-cols-3 gap-4 py-8 border-y border-gray-50">
              <div><div className="text-3xl font-black text-gray-900">50+</div><div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Proyek</div></div>
              <div><div className="text-3xl font-black text-gray-900">5+</div><div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Tahun</div></div>
              <div><div className="text-3xl font-black text-gray-900">20+</div><div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Klien</div></div>
            </div>
            <button className="bg-gray-900 text-white px-8 py-4 rounded-full font-bold flex items-center space-x-3 hover:bg-gray-800 transition">
              <i className="fas fa-download text-sm"></i>
              <span>Download CV</span>
            </button>
          </div>
        </div>
      </section>

      {/* --- KEAHLIAN --- */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8 md:px-16 text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Kemampuan</span>
          <h2 className="text-4xl font-extrabold text-gray-900 mt-3 mb-16">Keahlian & Teknologi</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {['Frontend', 'Backend', 'Tools & Lainnya'].map((cat, i) => (
              <div key={i} className="bg-white p-10 rounded-[35px] border border-gray-100 shadow-sm text-left">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center mb-8">
                  <i className={`fas ${i === 0 ? 'fa-code' : i === 1 ? 'fa-database' : 'fa-box-open'} text-gray-900 text-xl`}></i>
                </div>
                <h3 className="text-xl font-bold mb-4">{cat}</h3>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">Membangun solusi digital yang efisien dan berkualitas tinggi.</p>
                <div className="flex flex-wrap gap-2">
                  {(i === 0 ? ['HTML5', 'CSS3', 'JS', 'React', 'Vue', 'Tailwind'] : i === 1 ? ['Node.js', 'Express', 'PHP', 'Laravel', 'MySQL'] : ['Git', 'Figma', 'Docker', 'REST API']).map(t => (
                    <span key={t} className="px-3 py-1.5 bg-gray-50 text-[9px] font-bold rounded-lg text-gray-500 uppercase">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PROYEK --- */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Portfolio</span>
              <h2 className="text-4xl font-extrabold text-gray-900 mt-3">Karya Terpilih</h2>
            </div>
            <a href="#" className="text-xs font-bold border-b-2 border-gray-900 pb-1 flex items-center space-x-2">
              <span>Lihat Semua Proyek</span>
              <i className="fas fa-arrow-right text-[10px]"></i>
            </a>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {[1, 2, 3].map(i => (
              <div key={i} className="group">
                <div className="bg-gray-100 rounded-[24px] overflow-hidden mb-6 shadow-sm group-hover:shadow-xl transition-all duration-500">
                  <div className="bg-white h-9 w-full flex items-center px-4 space-x-1.5 border-b border-gray-100">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                  </div>
                  <div className="aspect-video relative grayscale group-hover:grayscale-0 transition duration-700">
                    <Image src="https://via.placeholder.com/600x400" alt="Project" fill className="object-cover" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Company Profile #{i}</h3>
                <p className="text-gray-400 text-sm mt-3 mb-6">Website profil perusahaan modern dengan integrasi CMS.</p>
                <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-gray-900 flex items-center space-x-2 group-hover:translate-x-2 transition">
                  <span>Detail Proyek</span>
                  <i className="fas fa-chevron-right text-[8px]"></i>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- BLOG --- */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8 md:px-16 text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Blog & Artikel</span>
          <h2 className="text-4xl font-extrabold text-gray-900 mt-3 mb-16">Tulisan Terbaru</h2>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              { t: 'Belajar Laravel untuk Pemula', c: '#2D3E50' },
              { t: 'Tips Belajar Pemrograman', c: '#7B61FF' },
              { t: 'Mengenal ReactJS Lebih Dekat', c: '#3182CE' }
            ].map((blog, i) => (
              <div key={i} className="bg-white rounded-[35px] overflow-hidden shadow-sm hover:shadow-lg transition group">
                <div style={{ backgroundColor: blog.c }} className="h-48 flex items-center justify-center p-12 text-center text-white font-bold text-2xl leading-tight">
                  {blog.t}
                </div>
                <div className="p-8">
                  <div className="flex items-center space-x-4 mb-5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>23 Des 2025</span><span>•</span><span>1 Min Read</span>
                  </div>
                  <h4 className="text-lg font-bold mb-4 text-gray-900 leading-snug">{blog.t} #{i+1}</h4>
                  <p className="text-gray-400 text-sm mb-8">Eksplorasi mendalam mengenai teknologi pengembangan web modern.</p>
                  <button className="w-full py-4 border border-gray-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:bg-gray-900 group-hover:text-white transition-all flex items-center justify-center space-x-3">
                    <span>Baca Selengkapnya</span>
                    <i className="fas fa-arrow-up-right-from-square"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-20 px-12 py-4 border-2 border-gray-900 rounded-full font-bold hover:bg-gray-900 hover:text-white transition shadow-sm">
            Lihat Semua Artikel
          </button>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-gray-900 text-white pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-8 md:px-16 grid md:grid-cols-3 gap-20 mb-24">
          <div className="space-y-8">
            <div className="text-3xl font-black tracking-tighter">Dn</div>
            <p className="text-gray-400 leading-relaxed text-sm">
              Saya menciptakan pengalaman digital yang modern dan fungsional. Bersemangat mengubah ide kompleks menjadi desain yang elegan.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="font-bold text-[10px] uppercase tracking-[0.2em] text-gray-500">Navigasi</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                {['Beranda', 'Tentang', 'Keahlian', 'Proyek'].map(l => <li key={l}><a href="#" className="hover:text-white transition">{l}</a></li>)}
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="font-bold text-[10px] uppercase tracking-[0.2em] text-gray-500">Lainnya</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Kebijakan</a></li>
              </ul>
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="font-bold text-[10px] uppercase tracking-[0.2em] text-gray-500">Kontak</h4>
            <div className="space-y-5 text-sm text-gray-400">
              <div className="flex items-center space-x-4"><i className="fas fa-envelope text-gray-600"></i><span>danendra@example.com</span></div>
              <div className="flex items-center space-x-4"><i className="fas fa-phone text-gray-600"></i><span>08123456789</span></div>
              <div className="flex items-center space-x-4"><i className="fas fa-map-marker-alt text-gray-600"></i><span>Semarang, Indonesia</span></div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 md:px-16 pt-12 border-t border-gray-800 text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
          © 2026 Danendra N Rs. All rights reserved.
        </div>
      </footer>

    </div>
  )
}
