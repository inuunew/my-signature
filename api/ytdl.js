const axios = require('axios')
const crypto = require('crypto')

// ==========================================
// PROVIDER 1: INSVID CONVERTER
// ==========================================
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

async function processInsvid(youtubeUrl, format) {
  const fileType = format === 'audio' ? 'MP3' : 'MP4'
  const videoId = extractVideoId(youtubeUrl)
  if (!videoId) throw new Error('URL YouTube tidak valid')

  const response = await axios.post('https://ac.insvid.com/converter', {
    id: videoId, fileType
  }, {
    headers: {
      'host': 'ac.insvid.com',
      'referer': `https://ac.insvid.com/widget?url=https://www.youtube.com/watch?v=${videoId}&el=147`,
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  })

  if (response.data?.status === 'ok' && response.data?.link) {
    return {
      title: `Video ID: ${videoId}`,
      duration: 'Unknown',
      downloadUrl: response.data.link,
      provider: 'Insvid'
    }
  }
  throw new Error('Gagal mendapatkan link dari server Insvid')
}

// ==========================================
// PROVIDER 2: SAVETUBE
// ==========================================
function getSecretKeyHex() {
  // Hasil de-obfuscate kode asli
  return "C5D58EF67A" + "6C35BBC4EB" + "7584E4A29F" + "12"
}

function decryptData(encryptedBase64) {
  const key = Buffer.from(getSecretKeyHex(), 'hex')
  const encryptedBuffer = Buffer.from(encryptedBase64.replace(/\s/g, ''), 'base64')
  const iv = encryptedBuffer.subarray(0, 16)
  const ciphertext = encryptedBuffer.subarray(16)
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv)
  let decrypted = decipher.update(ciphertext, null, 'utf8') + decipher.final('utf8')
  return JSON.parse(decrypted)
}

const savetubeHeaders = {
  'host': 'cdn403.savetube.vip',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'origin': 'https://y2mate.net.co',
  'referer': 'https://y2mate.net.co/'
}

async function processSavetube(youtubeUrl, format, quality) {
  const infoRes = await axios.post('https://cdn403.savetube.vip/v2/info', { url: youtubeUrl }, { headers: savetubeHeaders })
  if (!infoRes?.data) throw new Error('Gagal memuat info video dari Savetube')
  
  const meta = decryptData(infoRes.data)
  const key = meta?.key
  if (!key) throw new Error('Gagal mengekstrak Key dekripsi')

  const dlRes = await axios.post('https://cdn403.savetube.vip/download', {
    downloadType: format, quality, key
  }, { headers: savetubeHeaders })

  if (dlRes.data?.data?.downloadUrl) {
    return {
      title: meta.title || 'Unknown Title',
      duration: meta.durationLabel || 'Unknown',
      downloadUrl: dlRes.data.data.downloadUrl,
      provider: 'Savetube'
    }
  }
  throw new Error('Gagal men-generate link download dari Savetube')
}

// ==========================================
// MAIN HANDLER
// ==========================================
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { url, server = 'savetube', format = 'audio', quality = '128' } = req.body || {}
    
    if (!url) return res.status(400).json({ error: 'URL YouTube wajib diisi' })

    let result
    if (server === 'insvid') {
      result = await processInsvid(url, format)
    } else {
      result = await processSavetube(url, format, quality)
    }

    return res.status(200).json({ status: true, data: result })

  } catch (err) {
    return res.status(500).json({ status: false, error: err.response?.data?.message || err.message || 'Internal Server Error' })
  }
}
