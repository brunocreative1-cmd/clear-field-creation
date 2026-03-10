export async function fetchCep(cep) {
  const cleanCep = cep.replace(/\D/g, '')

  if (cleanCep.length !== 8) {
    throw new Error('CEP deve ter 8 dígitos')
  }

  try {
    // Timeout de 5 segundos
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    // 🔒 Usa proxy do backend para ocul tar URL real da BrasilAPI
    const response = await fetch(`/api/cep/${cleanCep}`, {
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error('CEP não encontrado')
    }

    const data = await response.json()

    return {
      rua: data.street || '',
      bairro: data.neighborhood || '',
      cidade: data.city || '',
      uf: data.state || '',
      cidadeUf: `${data.city} - ${data.state}`
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Busca muito lenta. Tente novamente.')
    }
    console.error('Erro ao buscar CEP:', error)
    throw error
  }
}
