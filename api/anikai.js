
// Simpan file ini di dalam folder: /api/anikai.js pada project Vercel Anda
// Menggunakan kode scraper asli anikai.org (Creator: Jerexd)
import fetch from 'node-fetch'
import * as cheerio from 'cheerio'

const BASE = 'https://anikai.org'
const ENDPOINTS = {
  catalog: `${BASE}/catalog-index.json`,
  schedule: `${BASE}/schedule.json`,
  episodes: id => `${BASE}/episodes/${id}.json`,
  watch: slugOrId => `${BASE}/watch/${slugOrId}/`,
  updates: `${BASE}/updates/`,
  home: `${BASE}/home/`
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const TIMEOUT = 25000
const RETRY = 2
const FIELD_MAP = {
  i: 'id', s: 'slug', n: 'title', e: 'altTitle', j: 'japanese',
  na: 'native', f: 'format', st: 'status', g: 'genres', y: 'year',
  r: 'rating', sc: 'score', tt: 'episodes', sb: 'subtitles',
  rd: 'released', u: 'updated', ca: 'added', le: 'lastEpisode'
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

// Cache di memory instance Serverless Vercel agar super cepat
let _catalogCache = null
let _catalogTimestamp = 0
const CACHE_TTL = 1000 * 60 * 15 // 15 menit

async function request(url, mode = 'json') {
  let lastErr
  for (let attempt = 0; attempt <= RETRY; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT)
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'user-agent': UA,
          accept: mode === 'json' ? 'application/json, text/plain, */*' : 'text/html,application/xhtml+xml,*/*',
          'accept-language': 'en-US,en;q=0.9',
          referer: `${BASE}/`
        }
      })
      clearTimeout(timer)
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} -> ${url}`)
      if (mode === 'json') return await res.json()
      if (mode === 'buffer') return await res.buffer()
      return await res.text()
    } catch (err) {
      clearTimeout(timer)
      lastErr = err
      if (attempt < RETRY) await sleep(500 * (attempt + 1))
    }
  }
  throw new Error(`Gagal mengambil data: ${lastErr?.message || lastErr}`)
}

async function loadCatalog() {
  const now = Date.now()
  if (_catalogCache && (now - _catalogTimestamp < CACHE_TTL)) return _catalogCache
  const raw = await request(ENDPOINTS.catalog, 'json')
  if (!Array.isArray(raw)) throw new Error('Format catalog-index.json tidak valid')
  _catalogCache = raw
  _catalogTimestamp = now
  return _catalogCache
}

function posterSlug(raw) {
  const s = String(raw.s || '')
  return s.endsWith(`-${raw.i}`) ? s : `${s}-${raw.i}`
}

function normalizeItem(raw) {
  const item = {}
  for (const [k, v] of Object.entries(FIELD_MAP)) item[v] = raw[k] ?? null
  item.poster = `https://img.anikai.org/poster/w_360/h_480/${posterSlug(raw)}.webp`
  item.banner = `https://img.anikai.org/banner/w_1900/h_400/${posterSlug(raw)}.webp`
  item.url = `${BASE}/watch/${raw.s}/`
  return item
}

const fold = str => String(str || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()

const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

async function search(keyword, { limit = 10 } = {}) {
  if (!keyword || !keyword.trim()) throw new Error('Keyword pencarian kosong')
  const catalog = await loadCatalog()
  const q = fold(keyword)
  const scored = []
  for (const raw of catalog) {
    const fields = [raw.n, raw.e, raw.j, raw.na].map(fold)
    let best = Infinity
    for (const f of fields) {
      if (!f) continue
      if (f === q) best = Math.min(best, 0)
      else if (f.startsWith(q)) best = Math.min(best, 1)
      else if (new RegExp(`\\b${escapeRegex(q)}`).test(f)) best = Math.min(best, 2)
      else if (f.includes(q)) best = Math.min(best, 3)
    }
    if (best !== Infinity) scored.push({ rank: best, score: raw.sc || 0, raw })
  }
  scored.sort((a, b) => a.rank - b.rank || (b.score || 0) - (a.score || 0) || (b.raw.y || 0) - (a.raw.y || 0))
  return scored.slice(0, Number(limit)).map(x => normalizeItem(x.raw))
}

async function resolveAnime(input) {
  const catalog = await loadCatalog()
  const str = String(input ?? '').trim()
  if (!str) throw new Error('Input anime kosong')
  const m = str.match(/\/watch\/([^/?#]+)/)
  const slug = m ? m[1] : str
  const hit = catalog.find(x => x.s === slug || posterSlug(x) === slug)
  if (hit) return { raw: hit, item: normalizeItem(hit) }
  if (/^\d+$/.test(str)) {
    const byId = catalog.find(x => Number(x.i) === Number(str))
    if (byId) return { raw: byId, item: normalizeItem(byId) }
  }
  const results = await search(str, { limit: 1 })
  if (!results.length) throw new Error(`Anime "${str}" tidak ditemukan`)
  const byName = catalog.find(x => x.i === results[0].id)
  return { raw: byName, item: normalizeItem(byName) }
}

async function getDetail(input) {
  const { raw, item } = await resolveAnime(input)
  const html = await request(item.url, 'text')
  const $ = cheerio.load(html)
  let ld = null
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).contents().text())
      const graph = parsed['@graph'] || [parsed]
      const series = graph.find(n => ['TVSeries', 'Movie', 'CreativeWork', 'TVSeason'].includes(n['@type']))
      if (series && !ld) ld = series
    } catch { }
  })
  const facts = {}
  $('.detail-facts > div').each((_, el) => {
    const key = $(el).find('dt').first().text().replace(/:\s*$/, '').trim()
    const val = $(el).find('dd').first().text().trim()
    if (key) facts[key] = val
  })
  const synopsis = $('#synopsis-text').text().trim() || ld?.description || null
  const watchPage = $('#watch-page')
  const dataId = watchPage.attr('data-id') || String(raw.i)
  const seal = watchPage.attr('data-seal') || null
  const playerHost = watchPage.attr('data-player') || null
  const serverDefault = watchPage.attr('data-server-default') || null
  const trailer = $('#open-trailer').attr('data-trailer') || null
  const epNote = $('.episode-note').last().text().trim()
  const epFromPage = Number((epNote.match(/(\d+)\s+episodes?/i) || [])[1]) || null
  return {
    id: Number(dataId), slug: raw.s, url: item.url, title: ld?.name || item.title,
    altTitle: ld?.alternateName || item.altTitle, japanese: raw.j, native: raw.na,
    format: raw.f, status: raw.st, year: raw.y, rating: ld?.contentRating || raw.r,
    score: raw.sc, totalEpisodes: epFromPage ?? raw.tt, subtitles: raw.sb,
    released: ld?.datePublished || raw.rd, updated: raw.u, lastEpisode: raw.le,
    genres: (ld?.genre || raw.g || []).flat(), studios: facts['Studios'] || null,
    duration: facts['Duration'] || null, articleStatus: facts['Status'] || null,
    dateAired: facts['Date aired'] || null, synopsis, trailer, poster: ld?.image || item.poster,
    banner: item.banner, player: { host: playerHost, seal, serverDefault }
  }
}

async function getEpisodes(input, { episode } = {}) {
  const { raw } = await resolveAnime(input)
  const rawEps = await request(ENDPOINTS.episodes(raw.i), 'json')
  if (!Array.isArray(rawEps)) throw new Error('Format episodes JSON tidak valid')
  const list = rawEps
    .filter(Array.isArray)
    .map(e => ({ number: Number(e[0]), title: e[1] || `Episode ${e[0]}`, date: e[2] || null, filler: !!e[3], recap: !!e[4] }))
    .sort((a, b) => a.number - b.number)
  let selected = null
  if (episode != null && episode !== '') {
    selected = list.find(e => e.number === Number(episode))
    if (!selected) throw new Error(`Episode ${episode} tidak ada (total ${list.length})`)
  }
  return {
    anime: { id: raw.i, slug: raw.s, title: raw.n, url: `${BASE}/watch/${raw.s}/` },
    total: list.length, latest: list.at(-1) || null, selected, episodes: list
  }
}

async function getLatest({ limit = 20 } = {}) {
  // Scrape dari /updates/ atau /home/ menggunakan Cheerio persis seperti kode asli
  const html = await request(ENDPOINTS.updates, 'text')
  const $ = cheerio.load(html)
  const out = []
  $('article.anime-card').each((_, el) => {
    const $el = $(el)
    const link = $el.find('a.poster-link').first()
    const href = link.attr('href') || ''
    const slugMatch = href.match(/\/watch\/([^/?#]+)/)
    const slug = slugMatch ? slugMatch[1] : null
    const id = Number($el.attr('data-id')) || Number((href.match(/-(\d+)\/?$/) || [])[1]) || null
    const title = $el.find('.card-title a').first().text().trim()
    const jp = $el.find('.card-title a').attr('data-title-jp') || null
    const epBadge = $el.find('.episode-badge').first().text().trim()
    const epNum = Number((epBadge.match(/(\d+)/) || [])[1]) || null
    const metas = $el.find('.card-meta span')
    const year = Number($(metas[1]).text().trim()) || null
    const format = $el.find('.card-format').first().text().trim() || null
    const imgEl = $el.find('img').first()
    let poster = imgEl.attr('src') || imgEl.attr('data-src') || null
    if (poster && poster.startsWith('/')) poster = `${BASE}${poster}`
    out.push({
      id, slug, title, japanese: jp, episode: epNum, year, format, poster,
      url: href ? (href.startsWith('http') ? href : `${BASE}${href}`) : null
    })
  })
  return out.slice(0, Number(limit))
}

async function getSchedule({ all = false, limit = 20 } = {}) {
  const raw = await request(ENDPOINTS.schedule, 'json')
  if (!Array.isArray(raw)) throw new Error('Format schedule.json tidak valid')
  const now = Date.now()
  const mapped = raw.map(s => {
    const m = String(s.url || '').match(/\/watch\/([^/?#]+)/)
    let poster = s.poster || null
    if (poster && poster.startsWith('/')) poster = `${BASE}${poster}`
    return {
      slug: m ? m[1] : null,
      title: s.title, japanese: s.japanese || null, episode: s.episode ?? null,
      airAt: s.at || null, airTimestamp: s.at ? new Date(s.at).getTime() : null,
      poster, url: s.url ? (s.url.startsWith('http') ? s.url : `${BASE}${s.url}`) : null
    }
  })
  const isAll = all === true || all === 'true' || all === '1'
  const filtered = isAll ? mapped : mapped.filter(x => x.airTimestamp && x.airTimestamp >= now - 3600000)
  filtered.sort((a, b) => (a.airTimestamp || 0) - (b.airTimestamp || 0))
  return filtered.slice(0, Number(limit))
}

async function getGenres() {
  const catalog = await loadCatalog()
  const counter = new Map()
  for (const raw of catalog) {
    for (const g of raw.g || []) counter.set(g, (counter.get(g) || 0) + 1)
  }
  return [...counter.entries()]
    .map(([genre, total]) => ({ genre, total }))
    .sort((a, b) => b.total - a.total)
}

async function filterCatalog(opts = {}) {
  const { genre, year, format, status, minScore = 0, sort = 'updated', limit = 24 } = opts
  const catalog = await loadCatalog()
  const list = catalog.filter(raw => {
    if (genre && !(raw.g || []).some(g => fold(g) === fold(genre))) return false
    if (year && Number(raw.y) !== Number(year)) return false
    if (format && fold(raw.f) !== fold(format)) return false
    if (status && fold(raw.st) !== fold(status)) return false
    if (Number(raw.sc || 0) < Number(minScore)) return false
    return true
  })
  const key = { updated: 'u', released: 'rd', added: 'ca', score: 'sc', count: 'tt' }[sort] || 'u'
  list.sort((a, b) => {
    if (key === 'sc' || key === 'tt') return Number(b[key] || 0) - Number(a[key] || 0)
    return String(b[key] || '').localeCompare(String(a[key] || ''))
  })
  return list.slice(0, Number(limit)).map(normalizeItem)
}

// VERCEL SERVERLESS HANDLER
export default async function handler(req, res) {
  // Set CORS Headers agar bisa diakses dari domain/path mana saja
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  // Cache tipis di CDN Vercel selama 60 detik
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { action = 'latest', q, keyword, input, id, slug, ep, limit = 24, all, genre, year, format, status, minScore, sort } = req.query

  try {
    let data
    switch (String(action).toLowerCase()) {
      case 'status': {
        const cat = await loadCatalog()
        data = { ok: true, totalCatalog: cat.length }
        break
      }
      case 'years': {
        const cat = await loadCatalog()
        const years = [...new Set(cat.map(x => x.y).filter(Boolean))].sort((a, b) => b - a)
        data = { totalCatalog: cat.length, years }
        break
      }
      case 'search': {
        const kw = q || keyword || input || ''
        data = await search(kw, { limit: Number(limit) || 12 })
        break
      }
      case 'detail': {
        const target = input || slug || id || q || ''
        data = await getDetail(target)
        break
      }
      case 'episodes': {
        const target = input || slug || id || q || ''
        data = await getEpisodes(target, { episode: ep })
        break
      }
      case 'latest': {
        data = await getLatest({ limit: Number(limit) || 20 })
        break
      }
      case 'schedule': {
        data = await getSchedule({ all: all === 'true' || all === '1', limit: Number(limit) || 25 })
        break
      }
      case 'genres': {
        data = await getGenres()
        break
      }
      case 'filter': {
        data = await filterCatalog({
          genre, year, format, status,
          minScore: minScore ? Number(minScore) : 0,
          sort: sort || 'updated',
          limit: Number(limit) || 24
        })
        break
      }
      default:
        return res.status(400).json({ ok: false, error: `Action "${action}" tidak dikenal` })
    }

    return res.status(200).json({ ok: true, action, data })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}