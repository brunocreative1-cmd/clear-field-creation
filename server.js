import 'dotenv/config'
import express from 'express'
import compression from 'compression'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// ── Configuração Paradise ────────────────────────────────────
const PARADISE_API_URL = 'https://multi.paradisepags.com/api/v1'
const PARADISE_SECRET_KEY = process.env.PARADISE_SECRET_KEY
const PARADISE_ACCOUNT_ID = process.env.PARADISE_ACCOUNT_ID || '7124'

// ─── Trust proxy para obter IP real do cliente ─────────────────
// Necessário quando está atrás de load balancer, nginx, Cloudflare, etc
app.set('trust proxy', 1)

app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))



// ── Proxy Location API (IP Geolocation) ──────────────────────
// Primário: API Ninjas IP Lookup (chave via env API_NINJAS_KEY)
// Fallback 1: ip-api.com (grátis, 45 req/min)
// Fallback 2: ipapi.co (grátis, 1000 req/dia)
// Cache por cliente IP para evitar rate limits
const clientLocationCache = new Map()
const LOCATION_CACHE_TIME = 30 * 60 * 1000 // 30 minutos
const API_NINJAS_KEY = process.env.API_NINJAS_KEY

app.get('/api/location', async (req, res) => {
  // Mapa de estados brasileños a siglas
  const estadoUF = {
    'São Paulo': 'SP', 'Rio de Janeiro': 'RJ', 'Minas Gerais': 'MG',
    'Bahia': 'BA', 'Santa Catarina': 'SC', 'Rio Grande do Sul': 'RS',
    'Paraná': 'PR', 'Goiás': 'GO', 'Pernambuco': 'PE', 'Ceará': 'CE',
    'Distrito Federal': 'DF', 'Amazonas': 'AM', 'Pará': 'PA',
    'Espírito Santo': 'ES', 'Paraíba': 'PB', 'Rio Grande do Norte': 'RN',
    'Piauí': 'PI', 'Alagoas': 'AL', 'Acre': 'AC', 'Rondônia': 'RO',
    'Roraima': 'RR', 'Tocantins': 'TO', 'Amapá': 'AP', 'Maranhão': 'MA',
    'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS', 'Sergipe': 'SE'
  }
  
  // Obtiene IP real del cliente
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                   req.socket.remoteAddress || 
                   req.ip || 
                   '0.0.0.0'
  
  // Limpa ::ffff: de IPv4-mapped IPv6
  const cleanIP = clientIP.replace(/^::ffff:/, '')
  
  console.log(`[Location API] 🔍 IP del cliente: ${cleanIP}`)
  
  const failResponse = {
    estado: '', sigla: '', cidade: '',
    detected: false, error: 'Por favor selecciona tu ubicación'
  }
  
  try {
    // Verifica cache del cliente
    const now = Date.now()
    const cached = clientLocationCache.get(cleanIP)
    if (cached && (now - cached.timestamp) < LOCATION_CACHE_TIME) {
      console.log(`[Location API] 📦 Cache válido para ${cleanIP}`)
      return res.json(cached.data)
    }
    
    // ── APIs em paralelo: retorna quem responder primeiro com dado válido ──
    // API Ninjas (premium ~300ms) + ip-api.com correm ao mesmo tempo
    console.log(`[Location API] ⚡ Consultando APIs em paralelo para ${cleanIP}...`)

    async function fetchAPINinjas() {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 4000)
      try {
        const r = await fetch(`https://api.api-ninjas.com/v1/iplookup?address=${cleanIP}`, {
          signal: ctrl.signal,
          headers: { 'X-Api-Key': API_NINJAS_KEY }
        })
        clearTimeout(t)
        if (!r.ok) throw new Error('http error')
        const d = await r.json()
        if (d.is_valid && d.country_code === 'BR' && d.city && d.region) {
          const sigla = d.region_code || estadoUF[d.region] || ''
          console.log(`[Location API] ✅ API Ninjas: ${d.city}, ${d.region} (${sigla})`)
          return { estado: d.region, sigla, cidade: d.city, detected: true, ip: d.address || cleanIP }
        }
        throw new Error('não BR ou sem cidade')
      } catch (e) { clearTimeout(t); throw e }
    }

    async function fetchIPApi() {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 4000)
      try {
        const r = await fetch(
          `http://ip-api.com/json/${cleanIP}?fields=status,country,countryCode,region,regionName,city,query&lang=pt`,
          { signal: ctrl.signal }
        )
        clearTimeout(t)
        if (!r.ok) throw new Error('http error')
        const d = await r.json()
        if (d.status === 'success' && d.countryCode === 'BR' && d.city && d.regionName) {
          const sigla = d.region || estadoUF[d.regionName] || ''
          console.log(`[Location API] ✅ ip-api.com: ${d.city}, ${d.regionName} (${sigla})`)
          return { estado: d.regionName, sigla, cidade: d.city, detected: true, ip: d.query || cleanIP }
        }
        throw new Error('não BR ou sem cidade')
      } catch (e) { clearTimeout(t); throw e }
    }

    // Promise.any → retorna o primeiro que resolver com valor não-null
    const result = await Promise.any([
      fetchAPINinjas(),
      fetchIPApi()
    ]).catch(() => null)
    
    if (!result) {
      console.warn(`[Location API] ❌ Nenhuma API retornou cidade para ${cleanIP}`)
      return res.json(failResponse)
    }
    
    // Cachea por cliente IP
    clientLocationCache.set(cleanIP, { data: result, timestamp: now })
    res.json(result)
    
  } catch (err) {
    console.error('[Location API] ❌ Error geral:', err.message)
    res.json(failResponse)
  }
})

// ── Proxy CEP API ────────────────────────────────────────────
// Oculta a URL do BrasilAPI
app.get('/api/cep/:cep', async (req, res) => {
  const { cep } = req.params
  if (!cep) return res.status(400).json({ error: 'CEP não informado' })
  
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, {
      timeout: 5000
    })
    const data = await response.json()
    res.json(data)
  } catch (err) {
    console.error('[CEP API] Erro:', err.message)
    res.status(502).json({ error: 'Erro ao consultar CEP' })
  }
})

// ── Proxy IBGE API ───────────────────────────────────────────
// Oculta a URL do IBGE
app.get('/api/ibge/estados', async (req, res) => {
  try {
    const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
    const data = await response.json()
    res.json(data)
  } catch (err) {
    console.error('[IBGE API] Erro:', err.message)
    res.status(502).json({ error: 'Erro ao buscar estados' })
  }
})

app.get('/api/ibge/cidades/:uf', async (req, res) => {
  const { uf } = req.params
  try {
    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
    const data = await response.json()
    res.json(data)
  } catch (err) {
    console.error('[IBGE API] Erro:', err.message)
    res.status(502).json({ error: 'Erro ao buscar cidades' })
  }
})

// ── Proxy QR Code Generator ──────────────────────────────────
// Oculta a URL do gerador de QR Code
app.get('/api/qr', async (req, res) => {
  const { text, size = '200x200' } = req.query
  if (!text) return res.status(400).json({ error: 'Texto não informado' })
  
  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${encodeURIComponent(text)}`
    res.redirect(qrUrl)
  } catch (err) {
    console.error('[QR API] Erro:', err.message)
    res.status(502).json({ error: 'Erro ao gerar QR Code' })
  }
})

// ── Proxy CPF API ────────────────────────────────────────────
// Rota dedicada para consultar CPF via API externa
// Rotação automática de chaves: troca quando atinge o limite de consultas
const CPF_API_KEYS = [
  process.env.VITE_CPF_API_KEY,
  process.env.VITE_CPF_API_KEY_2
].filter(Boolean)

const cpfKeyState = { index: 0, count: 0 }
const CPF_KEY_LIMIT = 199

function getCpfApiKey() {
  if (CPF_API_KEYS.length === 0) return ''
  if (cpfKeyState.count >= CPF_KEY_LIMIT && CPF_API_KEYS.length > 1) {
    cpfKeyState.index = (cpfKeyState.index + 1) % CPF_API_KEYS.length
    cpfKeyState.count = 0
    console.log(`[CPF API] Chave rotacionada para índice ${cpfKeyState.index}`)
  }
  cpfKeyState.count++
  return CPF_API_KEYS[cpfKeyState.index]
}

app.get('/api-cpf/consulta', async (req, res) => {
  const cpf = req.query.cpf
  if (!cpf) return res.status(400).json({ error: 'CPF não informado' })

  try {
    const response = await fetch(`https://apicpf.com/api/consulta?cpf=${cpf}`, {
      headers: { 'X-API-KEY': getCpfApiKey() }
    })
    const data = await response.json()
    res.json(data)
  } catch (err) {
    console.error('[CPF API] Erro:', err.message)
    res.status(502).json({ error: 'Erro ao consultar CPF' })
  }
})

// ── Paradise API - Proxy genérico ────────────────────────────
// Encaminha qualquer requisição /api-pix/* para Paradise, adicionando X-API-Key
// Webhook tem rota própria para processar notificações

// POST /api-pix/webhook - Receber notificações da Paradise (rota dedicada, antes do proxy)
app.post('/api-pix/webhook', express.json(), (req, res) => {
  try {
    console.log('\n[Paradise Webhook] Notificação recebida!')
    console.log('  Body:', JSON.stringify(req.body, null, 2))

    const transactionId = String(req.body.transaction_id || req.body.external_id || '')
    if (!transactionId) {
      return res.status(400).json({ error: 'transaction_id é obrigatório' })
    }

    const ps = req.body.status || ''
    const transactionStatus = ps === 'approved' ? 'COMPLETO'
                            : (ps === 'failed' || ps === 'refunded' || ps === 'chargeback') ? 'FALHA'
                            : 'PENDENTE'

    console.log(`[Paradise Webhook] Transação ${transactionId} = ${transactionStatus}`)
    res.status(200).json({ received: true, transaction_id: transactionId })
  } catch (error) {
    console.error('[Paradise Webhook] Erro:', error.message)
    res.status(502).json({ error: 'Erro ao processar webhook' })
  }
})

// Proxy genérico para Paradise API (criação, consulta, etc.)
app.use('/api-pix', async (req, res) => {
  try {
    if (!PARADISE_SECRET_KEY) {
      return res.status(500).json({ error: 'PARADISE_SECRET_KEY não configurada' })
    }

    const paradisePath = req.path || '/'
    const url = new URL(paradisePath, PARADISE_API_URL + '/')

    Object.entries(req.query).forEach(([k, v]) => url.searchParams.set(k, v))

    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': PARADISE_SECRET_KEY
      }
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const body = { ...req.body }
      if (!body.postback_url) {
        body.postback_url = `${req.protocol}://${req.get('host')}/api-pix/webhook`
      }
      fetchOptions.body = JSON.stringify(body)
    }

    console.log(`[Paradise Proxy] ${req.method} ${url.toString()}`)

    const response = await fetch(url.toString(), fetchOptions)
    const data = await response.json()

    console.log(`[Paradise Proxy] Resposta: ${response.status}`)
    res.status(response.status).json(data)
  } catch (error) {
    console.error('[Paradise Proxy] Erro:', error.message)
    res.status(502).json({ error: 'Erro ao comunicar com Paradise' })
  }
})

// GET /health - Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

// ── Arquivos estáticos (dist/) ───────────────────────────────
// IMPORTANTE: Esto DEBE estar ANTES del wildcard SPA fallback
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, path) => {
    // Permite que CSS/JS se cacheen
    if (path.endsWith('.js')) res.type('application/javascript')
    if (path.endsWith('.css')) res.type('text/css')
    if (path.endsWith('.woff2')) res.type('font/woff2')
  }
}))

// ── SPA Fallback ─────────────────────────────────────────────
// Cualquier ruta que no sea archivo estático → index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// ── Iniciar servidor ─────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Burgz] Servidor rodando na porta ${PORT}`)
  console.log(`[Burgz] http://localhost:${PORT}`)
})
