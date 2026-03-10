import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { detectCompleteLocation } from '../services/locationDetectionService'

const LocationContext = createContext()

/**
 * Limpa nomes de região do IBGE/Nominatim
 * "Região Geográfica Intermediária de Goiânia" → "Goiânia"
 */
function sanitizeCityName(name) {
  if (!name) return ''
  return name
    .replace(/^Região Geográfica\s+(Intermediária|Imediata)\s+de\s+/i, '')
    .replace(/^Regiao Geografica\s+(Intermediaria|Imediata)\s+de\s+/i, '')
    .trim() || name
}

function loadSavedLocation() {
  try {
    const saved = localStorage.getItem('burgzLocation')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed?.estado && parsed?.cidade) {
        // Sanitiza cidades salvas com nomes de região do IBGE
        parsed.cidade = sanitizeCityName(parsed.cidade)
        return parsed
      }
    }
  } catch {}
  return null
}

export function LocationProvider({ children }) {
  const savedLoc = loadSavedLocation()

  const [location, setLocation] = useState(savedLoc)
  const [detectedLocation, setDetectedLocation] = useState(null)
  const [detecting, setDetecting] = useState(!savedLoc)

  useEffect(() => {
    // Já tem localização salva → não precisa detectar
    if (savedLoc) return

    // Roda IP detection em background (em qualquer dispositivo)
    console.log('[Location] Detectando localização por IP...')
    detectCompleteLocation()
      .then(detected => {
        if (detected?.estado && detected?.cidade) {
          const cidade = sanitizeCityName(detected.cidade)
          console.log(`[Location] ✅ IP detectou: ${cidade}, ${detected.estado}`)
          setDetectedLocation({
            estado: detected.estado,
            cidade,
            estadoNome: detected.estado,
            sigla: detected.sigla || ''
          })
        } else {
          console.log('[Location] ⚠️ IP não detectou localização')
        }
      })
      .catch(() => {})
      .finally(() => {
        setDetecting(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const saveLocation = useCallback((estado, cidade) => {
    const cleanCidade = sanitizeCityName(cidade)
    const loc = { estado, cidade: cleanCidade, estadoNome: estado }
    localStorage.setItem('burgzLocation', JSON.stringify(loc))
    setLocation(loc)
  }, [])

  const resetLocation = useCallback(() => {
    localStorage.removeItem('burgzLocation')
    setLocation(null)
    setDetecting(true)
    setDetectedLocation(null)
    detectCompleteLocation()
      .then(detected => {
        if (detected?.estado && detected?.cidade) {
          setDetectedLocation({
            estado: detected.estado,
            cidade: sanitizeCityName(detected.cidade),
            estadoNome: detected.estado,
            sigla: detected.sigla || ''
          })
        }
      })
      .catch(() => {})
      .finally(() => setDetecting(false))
  }, [])

  return (
    <LocationContext.Provider value={{
      location,
      detectedLocation,
      detecting,
      saveLocation,
      resetLocation
    }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation deve ser usado dentro de LocationProvider')
  }
  return context
}
