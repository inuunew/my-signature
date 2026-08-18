const axios = require('axios')

function extractVideoId(input) {
  try {
    const url = new URL(input)
    if (url.hostname === "youtu.be") return url.pathname.substring(1)
    if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2]
    if (url.pathname.startsWith("/embed/")) return url.pathname.split("/")[2]
    return url.searchParams.get("v")
  } catch (e) {
    if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input
    return null
  }
}

async function processInsvid(youtubeUrl) {
  const videoId = extractVideoId(youtubeUrl)
  
  if (!videoId) throw new Error('URL YouTube tidak valid')

  // Langsung hardcode ke MP3 karena server Insvid hanya mendukung ini
  const response = await axios.post('https://ac.insvid.com/converter', {
    id: videoId, fileType: 'MP3'
  }, {
    headers: {
      'host': 'ac.insvid.com',
      'referer': `https://ac.insvid.com/widget?url=https://www.youtube.com/watch?v=${videoId}&el=147`,
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  })

  if (response.data?.status === 'ok' && response.data?.link) {
    const downloadUrl = response.data.link;
    let title = `Audio ID: ${videoId}`;

    // Ekstrak Judul Asli dari parameter 'n'
    try {
        const parsedUrl = new URL(downloadUrl);
        const titleParam = parsedUrl.searchParams.get('n');
        if (titleParam) {
            title = decodeURIComponent(titleParam).replace(/\+/g, ' ');
        }
    } catch (e) {}

    return {
      title: title,
      downloadUrl: downloadUrl,
      provider: 'Insvid (Audio Only)'
    }
  }
  
  throw new Error('Gagal mendapatkan link MP3 dari server.')
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { url } = req.body || {}
    
    if (!url) return res.status(400).json({ error: 'URL YouTube wajib diisi' })

    const result = await processInsvid(url)

    return res.status(200).json({ status: true, data: result })

  } catch (err) {
    return res.status(500).json({ status: false, error: err.response?.data?.message || err.message || 'Internal Server Error' })
  }
}
