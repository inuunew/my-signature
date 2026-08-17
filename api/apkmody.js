const axios = require('axios')
const cheerio = require('cheerio')

const BASE = 'https://apkmody.mobi'
const FILE_RE = /\.(apk|obb|zip|rar|7z|xapk)$/i
const SLUG_RE = /\/(games|apps)\/[^/]+/
const SIZE_RE = /([\d.,]+)\s*(TB|GB|MB|KB)/i

// 🚫 DAFTAR KATA KUNCI BLACKLIST (Tambahkan kata lain jika perlu)
const BLACKLIST_KEYWORDS = [
  'camgirls', '18+', 'adult', 'sex', 'hentai', 'porn', 'nude',
  'strip', 'xx', 'xvideo', 'erotic', 'boobs', 'fuck', 'nsfw'
]

const headers = {
  'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'referer': 'https://apkmody.mobi/'
}

const client = axios.create({ baseURL: BASE, timeout: 30000, headers })
const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim()

// Fungsi mengecek apakah teks mengandung kata yang di-blacklist
function isBlacklisted(text) {
  if (!text) return false
  const lower = String(text).toLowerCase()
  return BLACKLIST_KEYWORDS.some(word => lower.includes(word))
}

function extractImg($el) {
  if (!$el || !$el.length) return null
  let src = $el.attr('data-src') || $el.attr('data-lazy-src') || $el.attr('src') || ''
  if (!src && $el.attr('srcset')) {
    src = $el.attr('srcset').split(',')[0].split(' ')[0]
  }
  if (!src) return null
  return src.startsWith('http') ? src : BASE + src
}

async function fetchPage(url) {
  try {
    const res = await client.get(url)
    return res.data
  } catch (e) {
    throw new Error('Gagal memuat URL')
  }
}

function parseCards($) {
  const items = []
  const seen = new Set()
  $('article.card a[href], a.app[href]').each((_, el) => {
    const m = ($(el).attr('href') || '').match(SLUG_RE)
    if (!m) return
    const url = BASE + m[0]
    if (seen.has(url)) return
    seen.add(url)
    
    const img = $(el).find('img').first()
    const cover = extractImg(img)
    const title = clean($(el).find('.card-title, .has-normal-font-size, h3').first().text())
    const version = clean($(el).find('.card-excerpt, .has-small-font-size').first().text())
    
    // 🔍 Filter: Jangan masukkan ke daftar jika kena Blacklist
    if (title && !isBlacklisted(title) && !isBlacklisted(url)) {
      items.push({ title, version, cover, url })
    }
  })
  return items
}

function parseDetail($) {
  const h1Strong = $('h1 strong').first().text()
  const title = clean(h1Strong) || $('title').first().text().replace(/\s*[-|]\s*APKMODY\s*$/i, '').trim() || ''
  const spanText = $('h1 strong').first().parent().find('span').first().text()
  const version = (spanText.match(/v(\d+(?:\.\d+)+)/) || [])[1] || null
  const mod = (spanText.match(/\(([^()]*?)\)/) || [])[1] || null
  
  const iconImg = $('img[src*="packages"], img[data-src*="packages"]').first()
  const icon = extractImg(iconImg) || $('meta[property="og:image"]').attr('content') || null
  const updated = $('time[datetime]').first().attr('datetime') || null
  const description = clean($('.entry-content p, .article-content p').first().text()) || 'Tidak ada deskripsi.'
  
  const screenshots = []
  $('.entry-content img, .screenshots img, figure img').each((_, el) => {
    const src = extractImg($(el))
    if (src && !src.includes('icon_') && screenshots.length < 4) {
      screenshots.push(src)
    }
  })

  return { title, version, mod, icon, updated, description, screenshots }
}

function parseFiles($) {
  const files = []
  const seen = new Set()
  $('a[href*="/packages/"]').each((_, el) => {
    const url = $(el).attr('href') || ''
    if (!FILE_RE.test(url) || seen.has(url)) return
    seen.add(url)
    const text = clean($(el).text())
    const size = (text.match(SIZE_RE) || [])[0] || 'Unknown'
    files.push({
      fileName: url.split('/').pop(),
      size,
      url
    })
  })
  return files
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { action, q, url } = req.query

  try {
    if (action === 'home') {
      const body = await fetchPage(BASE)
      const items = parseCards(cheerio.load(body))
      return res.status(200).json({ items })
    }

    if (action === 'search') {
      if (!q) return res.status(400).json({ error: 'Query (q) diperlukan' })
      
      // Blokir jika kata kunci pencarian mengandung kata terlarang
      if (isBlacklisted(q)) {
        return res.status(200).json({ items: [] })
      }

      const u = new URL(BASE + '/')
      u.searchParams.set('s', q)
      const body = await fetchPage(u.toString())
      const items = parseCards(cheerio.load(body))
      return res.status(200).json({ items })
    } 

    if (action === 'detail') {
      if (!url) return res.status(400).json({ error: 'URL diperlukan' })
      
      // Cek URL secara langsung
      if (isBlacklisted(url)) {
        return res.status(403).json({ error: 'Aplikasi ini diblokir oleh sistem (Konten Terlarang).' })
      }

      const body = await fetchPage(url)
      const $ = cheerio.load(body)
      const parsed = parseDetail($)
      
      // Cek judul atau mod aplikasi setelah di-parse
      if (isBlacklisted(parsed.title) || isBlacklisted(parsed.mod)) {
        return res.status(403).json({ error: 'Aplikasi ini diblokir oleh sistem (Konten Terlarang).' })
      }

      const isApp = /\/apps\//.test(url)
      const slug = (url.match(/\/(?:games|apps)\/([^/]+)/) || [])[1] || null
      
      let files = []
      if (slug) {
        try {
          const dlPage = await fetchPage(`${BASE}/${isApp ? 'apps' : 'games'}/${slug}/download`)
          files = parseFiles(cheerio.load(dlPage))
        } catch {}
      }
      if (!files.length) files = parseFiles($)

      return res.status(200).json({ ...parsed, downloads: files })
    }

    return res.status(400).json({ error: 'Action tidak valid' })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' })
  }
}
