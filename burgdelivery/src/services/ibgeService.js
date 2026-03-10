// Estados brasileiros embutidos localmente (sem necessidade de API)
const ESTADOS = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
]

/**
 * Retorna lista de estados (dados locais, instantâneo).
 */
export function fetchEstados() {
  return ESTADOS
}

/**
 * 🔒 SEGURANÇA: Busca cidades de um estado via proxy backend.
 * O backend chama a API real do IBGE, ocultando a URL do cliente.
 * Em caso de falha (4G/5G sem API), usa dados locais offline.
 * Usa cache em memória para não repetir chamadas.
 */
import { getCidadesLocais } from '../data/brasilCidades'

const cidadesCache = {}

export async function fetchCidades(uf) {
  if (!uf) return []

  // Verifica cache primeiro
  if (cidadesCache[uf]) {
    console.log(`[IBGE] 📦 Retornando cidades do cache para ${uf}`)
    return cidadesCache[uf]
  }

  let timeoutId
  try {
    console.log(`[IBGE] 🌐 Tentando carregar cidades de ${uf} via API...`)
    
    // Implementa timeout com AbortController
    const controller = new AbortController()
    timeoutId = setTimeout(() => controller.abort(), 4000)
    
    const response = await fetch(`/api/ibge/cidades/${uf}`, { 
      signal: controller.signal 
    })
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Nenhuma cidade retornada')
    }
    
    console.log(`[IBGE] ✅ API respondeu com ${data.length} cidades para ${uf}`)
    cidadesCache[uf] = data
    return data
    
  } catch (error) {
    console.warn(`[IBGE] ⚠️ API falhou (${error.message}), usando dados locais para ${uf}`)
    clearTimeout(timeoutId)
    
    // Fallback: Usa dados locais offline (crítico em 4G/5G sem conexão)
    try {
      const cidadesLocais = getCidadesLocais(uf)
      if (!cidadesLocais || cidadesLocais.length === 0) {
        console.error(`[IBGE] ❌ Sem dados locais para ${uf}`)
        return []
      }
      console.log(`[IBGE] 📱 Usando ${cidadesLocais.length} cidades offline para ${uf}`)
      cidadesCache[uf] = cidadesLocais
      return cidadesLocais
      
    } catch (offlineError) {
      console.error('[IBGE] ❌ Erro ao carregar dados offline:', offlineError.message)
      return []
    }
  }
}
