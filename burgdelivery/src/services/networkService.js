/**
 * 🌐 Detecta o tipo de conexão de rede do usuário
 * Usa navigator.connection (disponível em navegadores modernos)
 */

export function getConnectionType() {
  try {
    // API disponível em navegadores modernos (Chrome, Firefox, Edge)
    const connection = navigator.connection || 
                      navigator.mozConnection || 
                      navigator.webkitConnection

    if (!connection) {
      console.log('[Connection] ℹ️ API navigator.connection não disponível')
      return 'unknown'
    }

    const effectiveType = connection.effectiveType // '4g', '3g', '2g', '4g'
    const type = connection.type // 'wifi', 'cellular', 'bluetooth', 'ethernet'

    console.log(`[Connection] 📡 Tipo: ${type}, Velocidade: ${effectiveType}`)

    return {
      effectiveType, // '4g', '3g', '2g'
      type,          // 'wifi', 'cellular', etc
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    }
  } catch (err) {
    console.warn('[Connection] ⚠️ Erro ao detectar conexão:', err.message)
    return 'unknown'
  }
}

/**
 * Detecta si el dispositivo tiene GPS habilitado
 * @returns {Promise<boolean>}
 */
export async function hasGPSCapability() {
  try {
    if (!navigator.geolocation) {
      console.log('[GPS] ℹ️ navigator.geolocation no disponible')
      return false
    }
    console.log('[GPS] ✅ Dispositivo tiene soporte GPS')
    return true
  } catch (err) {
    console.warn('[GPS] ⚠️ Error al verificar GPS:', err.message)
    return false
  }
}

/**
 * Obtiene ubicación por GPS
 * @returns {Promise<{latitude, longitude, accuracy}>|null}
 */
export function getGPSLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.log('[GPS] ❌ Geolocation no disponible')
      return resolve(null)
    }

    console.log('[GPS] 🚀 Solicitando permiso de ubicación...')

    const timeoutId = setTimeout(() => {
      console.warn('[GPS] ⏱️ GPS timeout (10s)')
      resolve(null)
    }, 10000)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId)
        const { latitude, longitude, accuracy } = position.coords
        console.log(`[GPS] ✅ Ubicación: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (precisión: ${accuracy.toFixed(0)}m)`)
        resolve({ latitude, longitude, accuracy })
      },
      (error) => {
        clearTimeout(timeoutId)
        console.warn(`[GPS] ❌ Permiso denegado o error: ${error.message}`)
        resolve(null)
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  })
}

/**
 * Verifica se está em rede MÓVEL (4G/5G/3G/LTE)
 * @returns {boolean} true se está em rede móvel
 */
export function isMobileNetwork() {
  const conn = getConnectionType()
  
  if (conn === 'unknown') return false
  
  // Se tipo é 'cellular' ou velocidade é 4g/3g/2g, é móvel
  const isCellular = conn.type === 'cellular'
  const isMobileSpeed = ['4g', '3g', '2g'].includes(conn.effectiveType)
  const isNotWifi = conn.type !== 'wifi' && conn.type !== 'ethernet'
  
  return isCellular || (isMobileSpeed && isNotWifi)
}

/**
 * Verifica se está em rede WiFi
 * 
 * Lógica:
 * - API disponível + type=wifi/ethernet → true (IP silencioso)
 * - API disponível + type=cellular → false (mostra modal)
 * - API NÃO disponível + dispositivo móvel → false (mostra modal)
 *   Em iOS não existe navigator.connection. No celular,
 *   é melhor mostrar modal porque pode ser 4G com IP impreciso.
 * - API NÃO disponível + desktop → true (IP silencioso)
 *   Desktop quase sempre é WiFi/Ethernet.
 * 
 * @returns {boolean} true se está em WiFi
 */
export function isWifiNetwork() {
  const conn = getConnectionType()
  
  // API disponível (Android Chrome, desktop Chrome/Firefox/Edge)
  if (conn !== 'unknown') {
    if (conn.type === 'cellular' || conn.type === 'mobile') {
      console.log('[Connection] 📱 Cellular detectado → modal')
      return false
    }
    console.log(`[Connection] ✅ ${conn.type || 'wifi'} detectado → IP silencioso`)
    return true
  }
  
  // API indisponível (iOS Safari, Safari macOS, etc)
  // Usa user agent como heurística
  const isMobile = /iPhone|iPad|iPod|Android.*Mobile|Mobile.*Android/i.test(navigator.userAgent)
  
  if (isMobile) {
    console.log('[Connection] 📱 API indisponível + dispositivo móvel → assume 4G (modal)')
    return false
  }
  
  console.log('[Connection] 💻 API indisponível + desktop → assume WiFi (IP silencioso)')
  return true
}
