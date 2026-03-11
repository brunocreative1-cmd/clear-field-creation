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

async function tryIpApiCo() {
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

async function tryIpApiCom() {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4000)
  try {
    const res = await fetch(
      'https://freeipapi.com/api/json',
      { signal: controller.signal }
    )
    clearTimeout(timeout)
    if (!res.ok) return null
    const data = await res.json()
    if (data.countryCode !== 'BR' || !data.cityName || !data.regionName) return null
    const sigla = ESTADO_SIGLA[data.regionName] || ''
    return { estado: data.regionName, cidade: data.cityName, sigla }
  } catch {
    clearTimeout(timeout)
    return null
  }
}

export async function detectLocationByIP() {
  try {
    // Tenta ambas as APIs em paralelo — retorna a primeira que responder com dado válido
    const result = await Promise.any([
      tryIpApiCo(),
      tryIpApiCom()
    ]).catch(() => null)

    if (result) {
      cacheResult(result)
      return result
    }
    return null
  } catch {
    return null
  }
}
