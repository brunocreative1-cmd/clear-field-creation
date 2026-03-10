const ESTADO_SIGLA = {
  'São Paulo': 'SP', 'Rio de Janeiro': 'RJ', 'Minas Gerais': 'MG',
  'Bahia': 'BA', 'Santa Catarina': 'SC', 'Rio Grande do Sul': 'RS',
  'Paraná': 'PR', 'Goiás': 'GO', 'Pernambuco': 'PE', 'Ceará': 'CE',
  'Distrito Federal': 'DF', 'Amazonas': 'AM', 'Pará': 'PA',
  'Espírito Santo': 'ES', 'Paraíba': 'PB', 'Rio Grande do Norte': 'RN',
  'Piauí': 'PI', 'Alagoas': 'AL', 'Acre': 'AC', 'Rondônia': 'RO',
  'Roraima': 'RR', 'Tocantins': 'TO', 'Amapá': 'AP', 'Maranhão': 'MA',
  'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS', 'Sergipe': 'SE'
}

function cacheResult(result) {
  try {
    localStorage.setItem('burgzIPLocation', JSON.stringify({
      data: result,
      timestamp: Date.now()
    }))
  } catch {}
}

async function tryBackendAPI() {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch('/api/location', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    })
    clearTimeout(timeout)
    if (!res.ok) return null

    const data = await res.json()
    if (!data?.detected || !data?.estado || !data?.cidade) return null

    return { estado: data.estado, cidade: data.cidade, sigla: data.sigla }
  } catch {
    clearTimeout(timeout)
    return null
  }
}

async function tryPublicAPI() {
  // ip-api.com: grátis, retorna city (45 req/min)
  // Nota: só funciona via HTTP (não HTTPS) no plano free
  // No browser pode ser bloqueado por mixed content, então usa ipapi.co como fallback
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4000)

  try {
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return null

    const data = await res.json()
    if (data.country_code !== 'BR' || !data.city || !data.region) return null

    const sigla = ESTADO_SIGLA[data.region] || data.region_code || ''
    return { estado: data.region, cidade: data.city, sigla }
  } catch {
    clearTimeout(timeout)
    return null
  }
}

export async function detectLocationByIP() {
  try {
    // O backend já faz todos os fallbacks (API Ninjas → ip-api.com → ipapi.co)
    // Não chamar tryPublicAPI() para evitar dupla tentativa desnecessária
    const result = await tryBackendAPI()

    if (result) {
      cacheResult(result)
      return result
    }

    return null
  } catch {
    return null
  }
}
