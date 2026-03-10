/**
 * Estratégia de detecção de localização (WiFi e dados móveis):
 *   1. Cache (localStorage)
 *   2. IP Geolocation (API Ninjas)
 *   3. Dados offline (IBGE)
 *   4. Modal manual (usuário seleciona)
 */

import { detectLocationByIP } from './ipLocationService'
import { getCidadesLocais } from '../data/brasilCidades'

const CACHE_TTL = 60 * 60 * 1000 // 1 hora

/**
 * Intenta obtener ciudad del cache
 */
function tryCache() {
  try {
    const cached = localStorage.getItem('burgzIPLocation')
    if (!cached) return null

    const { data, timestamp } = JSON.parse(cached)
    const age = Date.now() - timestamp
    
    if (age > CACHE_TTL) {
      console.log(`[LocationDetection] 🗑️ Cache expirado (${Math.round(age / 1000)}s)`)
      return null
    }

    if (data?.estado && data?.cidade) {
      console.log(`[LocationDetection] 📦 Cache válido (${Math.round(age / 1000)}s): ${data.cidade}, ${data.estado}`)
      return { ...data, metodo: 'Cache (localStorage)' }
    }
  } catch (e) {
    console.warn('[LocationDetection] ⚠️ Error ao ler cache:', e.message)
  }
  return null
}

/**
 * Intenta detectar por IP (API Ninjas)
 */
async function tryIPDetection() {
  try {
    console.log('[LocationDetection] 🌐 Intentando detección por IP (API Ninjas)...')
    const result = await detectLocationByIP()
    if (result) {
      return { ...result, metodo: 'IP (API Ninjas)' }
    }
  } catch (err) {
    console.error('[LocationDetection] ❌ Error en detección por IP:', err.message)
  }
  return null
}

/**
 * Obtiene datos offline de IBGE local
 * DESACTIVADO: no retornamos datos inventados para evitar mostrar ciudad incorrecta
 */
function tryOfflineData() {
  console.log('[LocationDetection] 💾 Fallback offline desactivado - requiere selección manual')
  return null
}

/**
 * FUNCIÓN PRINCIPAL: Detecta ubicación con estretégia completa
 * @returns {Promise<{estado, sigla, cidade, metodo}|null>}
 */
export async function detectCompleteLocation() {
  console.log('═══════════════════════════════════════════════════')
  console.log('[LocationDetection] 🎯 INICIANDO DETECCIÓN COMPLETA')
  console.log('═══════════════════════════════════════════════════')

  try {
    let result = tryCache()
    if (result) {
      console.log(`✅ UBICACIÓN DETECTADA (${result.metodo}): ${result.cidade}, ${result.estado}`)
      return result
    }

    result = await tryIPDetection()
    if (result) {
      console.log(`✅ UBICACIÓN DETECTADA (${result.metodo}): ${result.cidade}, ${result.estado}`)
      return result
    }

    console.log('❌ NO SE PUDO DETECTAR - Modal manual es necesaria')
    return null

  } catch (err) {
    console.error('[LocationDetection] 💥 Error general:', err.message)
    return null
  } finally {
    console.log('═══════════════════════════════════════════════════')
  }
}

/**
 * Limpia el cache de ubicación (para testing)
 */
export function clearLocationCache() {
  try {
    localStorage.removeItem('burgzIPLocation')
    console.log('[LocationDetection] 🗑️ Cache de ubicación limpiado')
  } catch (e) {
    console.warn('[LocationDetection] ⚠️ Error limpiando cache:', e.message)
  }
}

/**
 * Obtiene info del cache (para debugging)
 */
export function getLocationCacheInfo() {
  try {
    const cached = localStorage.getItem('burgzIPLocation')
    if (!cached) return 'Sin cache'

    const { data, timestamp } = JSON.parse(cached)
    const age = Math.round((Date.now() - timestamp) / 1000)
    const ttl = Math.round(CACHE_TTL / 1000)
    const remaining = ttl - age

    return {
      data,
      age: `${age}s`,
      remaining: `${remaining}s`,
      expired: remaining <= 0
    }
  } catch (e) {
    return 'Error leyendo cache'
  }
}
