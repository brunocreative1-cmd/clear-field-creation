/**
 * Reverse geocoding: coordenadas → cidade e estado (Brasil).
 * Tenta Nominatim; se falhar ou faltar dado, usa BigDataCloud (sem API key).
 */

function siglaFromCode(code) {
  if (!code || typeof code !== 'string') return ''
  const m = code.match(/BR-([A-Z]{2})/i) || code.match(/^([A-Z]{2})$/i)
  return m ? m[1].toUpperCase() : ''
}

/**
 * Nominatim: extrai estado e cidade com vários fallbacks (Brasil).
 */
async function reverseGeocodeNominatim(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1&accept-language=pt-BR`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BurgzDelivery/1.0 (https://github.com/andryus/burg2)' }
    })
    if (!res.ok) return null
    const data = await res.json()
    const addr = data.address || {}
    const estado = addr.state || addr.region || ''
    let cidade = addr.city || addr.town || addr.village || addr.municipality || ''
    
    // Limpa nomes de região que não são cidades reais
    if (!cidade || cidade.toLowerCase().includes('região geográfica') || cidade.toLowerCase().includes('regiao geografica')) {
      // Tenta extrair nome da cidade de campos alternativos
      cidade = addr.city_district || addr.suburb || addr.county || addr.state_district || ''
      // Remove prefixo "Região Geográfica ... de " se presente
      cidade = cidade.replace(/^Região Geográfica\s+(Intermediária|Imediata)\s+de\s+/i, '')
      cidade = cidade.replace(/^Regiao Geografica\s+(Intermediaria|Imediata)\s+de\s+/i, '')
    }
    
    if (estado && cidade) return { estado, cidade, sigla: siglaFromCode(addr.state_code) || '' }
    return null
  } catch (err) {
    console.warn('[GPS] Nominatim falhou (rede):', err.message)
    return null
  }
}

/**
 * BigDataCloud: retorna cidade e estado (principalSubdivision); funciona bem no Brasil.
 */
async function reverseGeocodeBigDataCloud(lat, lon) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    if (data.countryCode !== 'BR') return null
    const estado = data.principalSubdivision || ''
    const cidade = data.city || data.locality || ''
    const sigla = siglaFromCode(data.principalSubdivisionCode)
    if (estado && cidade) return { estado, cidade, sigla: sigla || estado.substring(0, 2).toUpperCase() }
    return null
  } catch (err) {
    console.warn('[GPS] BigDataCloud falhou (rede):', err.message)
    return null
  }
}

/**
 * Obtém cidade e estado a partir de coordenadas (tenta Nominatim, depois BigDataCloud).
 */
async function reverseGeocode(lat, lon) {
  let result = await reverseGeocodeNominatim(lat, lon)
  if (result) return result
  result = await reverseGeocodeBigDataCloud(lat, lon)
  return result || null
}

/**
 * Pede permissão de localização, obtém coordenadas e retorna { estado, cidade, sigla }.
 */
export async function detectLocationByGPS() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.log('[GPS] Geolocation API indisponível')
      resolve(null)
      return
    }

    let resolved = false
    const safeResolve = (val) => {
      if (resolved) return
      resolved = true
      resolve(val)
    }

    // Timeout de segurança (garante que sempre resolve, mesmo com erro inesperado)
    const safetyTimeout = setTimeout(() => {
      console.warn('[GPS] Timeout de segurança (15s)')
      safeResolve(null)
    }, 15000)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          console.log(`[GPS] Coordenadas: ${latitude}, ${longitude}`)
          const result = await reverseGeocode(latitude, longitude)
          clearTimeout(safetyTimeout)
          safeResolve(result)
        } catch (err) {
          console.warn('[GPS] Erro no reverse geocoding:', err.message)
          clearTimeout(safetyTimeout)
          safeResolve(null)
        }
      },
      (err) => {
        console.warn('[GPS] Erro ao obter posição:', err.message)
        clearTimeout(safetyTimeout)
        safeResolve(null)
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    )
  })
}
