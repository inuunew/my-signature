const axios = require('axios')
const cheerio = require('cheerio')

const BASE = 'https://apkmody.mobi'
const FILE_RE = /\.(apk|obb|zip|rar|7z|xapk)$/i
const SLUG_RE = /\/(games|apps)\/[^/]+/
const SIZE_RE = /([\d.,]+)\s*(TB|GB|MB|KB)/i
const SIZE_MULT = { b: 1, kb: 1024, mb: 1048576, gb: 1073741824, tb: 1099511627776 }

const headers = {
  'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
  'sec-ch-ua-platform': '"Android"',
  'sec-ch-ua-mobile': '?1',
  'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'id-ID,id;q=0.9,en-AU;q=0.8,en;q=0.7,en-US;q=0.6',
  'referer': 'https://apkmody.mobi/'
}

const client = axios.create({
  baseURL: BASE,
  timeout: 30000,
  maxRedirects: 5,
  validateStatus: () => true,
  headers
})

const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim()

function parseSize(str) {
  const m = String(str || '').match(SIZE_RE)
  if (!m) return null
  const n = parseFloat(m[1].replace(/,/g, '.'))
  return Math.round(n * (SIZE_MULT[m[2].toLowerCase()] || 1))
}

function packageFromIcon(iconUrl) {
  const m = String(iconUrl || '').match(/\/packages\/([^/]+)\/icon_/)
  return m ? m[1] : null
}

async function fetchPage(url) {
  let res
  try {
    res = await client.get(url)
  } catch (e) {
    throw new Error('Gagal memuat ' + url)
  }
  if (res.status >= 400) throw new Error('HTTP ' + res.status + ' untuk ' + url)
  return res.data
}

function parseDetail($) {
  const h1Strong = $('h1 strong').first().text()
  const title = clean(h1Strong) || $('title').first().text().replace(/\s*[-|]\s*APKMODY\s*$/i, '').trim() || ''
  const spanText = $('h1 strong').first().parent().find('span').first().text()
  const version = (spanText.match(/v(\d+(?:\.\d+)+)/) || [])[1] || null
  const mod = (spanText.match(/\(([^()]*?)\)/) || [])[1] || null
  const icon =
    $('img[src^="https://cdn.topmongo.com/packages/"]').first().attr('src') ||
    $('meta[property="og:image"]').attr('content') ||
    null
  const updated = $('time[datetime]').first().attr('datetime') || null
  return { title, version, mod, icon, package: packageFromIcon(icon), updated }
}

function parseFiles($) {
  const files = []
  const seen = new Set()
  $('a[href^="https://cdn.topmongo.com/packages/"]').each((_, el) => {
    const url = $(el).attr('href') || ''
    if (!FILE_RE.test(url) || seen.has(url)) return
    seen.add(url)
    const text = clean($(el).text())
    const size = (text.match(SIZE_RE) || [])[0] || null
    files.push({
      fileName: url.split('/').pop(),
      size,
      sizeBytes: parseSize(size),
      type: (url.match(FILE_RE) || [])[1] || null,
      url
    })
  })
  return files
}

function parseSearchItems($) {
  const items = []
  const seen = new Set()
  $('article.card a[href]').each((_, el) => {
    const m = ($(el).attr('href') || '').match(SLUG_RE)
    if (!m) return
    const url = BASE + m[0]
    if (seen.has(url)) return
    seen.add(url)
    const cover = $(el).find('img').first().attr('src') || null
    const title = clean($(el).find('.card-title .truncate').first().text())
    const version = clean($(el).find('.card-excerpt').first().text())
    items.push({ title, version, cover, url })
  })
  return items
}

const basePath = (isApp, slug) => BASE + '/' + (isApp ? 'apps' : 'games') + '/' + slug

async function detail(url) {
  const body = await fetchPage(url)
  const $ = cheerio.load(body)
  const parsed = parseDetail($)
  
  const isApp = /\/apps\//.test(url)
  const slug = (url.match(/\/(?:games|apps)\/([^/]+)/) || [])[1] || null
  
  let files = []
  try {
    const histPage = await fetchPage(basePath(isApp, slug) + '/history')
    files = parseFiles(cheerio.load(histPage))
  } catch {}
  
  if (!files.length) {
    try {
      const dlPage = await fetchPage(basePath(isApp, slug) + '/download')
      files = parseFiles(cheerio.load(dlPage))
    } catch {}
  }

  return {
    title: parsed.title,
    version: parsed.version,
    mod: parsed.mod,
    icon: parsed.icon,
    package: parsed.package,
    updated: parsed.updated,
    source: url,
    downloads: files
  }
}

async function search(query) {
  const u = new URL(BASE + '/')
  u.searchParams.set('s', query)
  const body = await fetchPage(u.toString())
  const items = parseSearchItems(cheerio.load(body))
  return { query, count: items.length, items }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const { action, q, url } = req.query

  try {
    if (action === 'search') {
      if (!q) return res.status(400).json({ error: 'Query (q) diperlukan' })
      const data = await search(q)
      return res.status(200).json(data)
    } 
    
    if (action === 'detail') {
      if (!url) return res.status(400).json({ error: 'URL diperlukan' })
      const data = await detail(url)
      return res.status(200).json(data)
    }

    return res.status(400).json({ error: 'Action harus search atau detail' })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}
