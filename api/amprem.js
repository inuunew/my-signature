const axios = require('axios')
const crypto = require('crypto')

const BASE = 'https://www.alightpro.my.id'

function sha256(str) {
  return crypto.createHash('sha256').update(Buffer.from(str, 'utf8')).digest('hex')
}

function solvePoW(sessionId, nonce, email, action, difficulty = '0000') {
  const prefix = `${sessionId}:${nonce}:${email.toLowerCase()}:${action}:`
  for (let i = 0; i < 500000; i++) {
    const hash = sha256(prefix + i)
    if (hash.startsWith(difficulty)) return String(i)
  }
  return String(Date.now())
}

async function createClient() {
  let cookie = ''
  const http = axios.create({
    baseURL: BASE,
    headers: {
      'accept': '*/*',
      'accept-language': 'id-ID,id;q=0.9',
      'referer': `${BASE}/`,
      'user-agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/141 Mobile Safari/537.36',
    },
  })

  http.interceptors.request.use(cfg => {
    if (cookie) cfg.headers['cookie'] = cookie
    return cfg
  })

  http.interceptors.response.use(res => {
    const sc = res.headers['set-cookie']
    if (sc) cookie = sc.map(c => c.split(';')[0]).join('; ')
    return res
  })

  return http
}

async function getSession(http) {
  const { data } = await http.get('/api/session', {
    headers: { 'x-requested-with': 'XMLHttpRequest' },
  })
  if (!data || !data.status || !data.token || !data.nonce) {
    throw new Error('Sesi tidak valid dari server tujuan.')
  }
  return data
}

async function handleAction(action, body) {
  const http = await createClient()
  const sess = await getSession(http)
  const { token, nonce, sessionId, difficulty = '0000' } = sess

  const pow = solvePoW(sessionId, nonce, body.email, action, difficulty)

  const { data } = await http.post('/api/alight-motion',
    { action, ...body },
    {
      headers: {
        'content-type': 'application/json',
        'x-requested-with': 'XMLHttpRequest',
        'x-amprem-token': token,
        'x-amprem-nonce': nonce,
        'x-amprem-pow': pow,
      },
    }
  )
  return data
}

async function getStats() {
  const http = await createClient()
  const [a, b] = await Promise.all([
    http.get('/api/stats'),
    http.get('/api/stats/recent'),
  ])
  return { stats: a.data, recent: b.data }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { action } = req.query

    if (req.method === 'GET' && action === 'stats') {
      const data = await getStats()
      return res.status(200).json(data)
    }

    if (req.method === 'POST') {
      const { email, link } = req.body || {}

      if (action === 'send') {
        if (!email) return res.status(400).json({ error: 'Email wajib diisi' })
        const result = await handleAction('send', { email })
        return res.status(200).json(result)
      }

      if (action === 'verify') {
        if (!email || !link) return res.status(400).json({ error: 'Email dan Link verifikasi wajib diisi' })
        const result = await handleAction('verify', { email, link })
        return res.status(200).json(result)
      }
    }

    return res.status(400).json({ error: 'Aksi tidak valid atau metode tidak didukung' })
  } catch (err) {
    return res.status(500).json({ error: err.response?.data?.message || err.message || 'Server error' })
  }
}
