// Base de configuração para API futura
// Quando o backend estiver pronto, basta alterar a BASE_URL
// e implementar as funções de fetch reais

const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || '',
  TIMEOUT: 10000,
}

export async function apiGet(endpoint) {
  if (!API_CONFIG.BASE_URL) {
    console.warn(`[API] Nenhuma BASE_URL configurada. Endpoint: ${endpoint}`)
    return null
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT)

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Requisição expirou. Tente novamente.')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function apiPost(endpoint, data) {
  if (!API_CONFIG.BASE_URL) {
    console.warn(`[API] Nenhuma BASE_URL configurada. Endpoint: ${endpoint}`)
    return null
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT)

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Requisição expirou. Tente novamente.')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export default API_CONFIG
