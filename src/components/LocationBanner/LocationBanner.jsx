import { useState, useEffect, useRef } from 'react'
import { useLocation } from '../../contexts/LocationContext'
import { useToast } from '../../contexts/ToastContext'
import { fetchEstados } from '../../services/ibgeService'
import { detectLocationByGPS } from '../../services/gpsService'

function estadoNomeToSigla(estadoNome, estados) {
  if (!estadoNome || !estados?.length) return ''
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const found = estados.find(
    e => norm(e.nome) === norm(estadoNome) || e.sigla === (estadoNome || '').substring(0, 2).toUpperCase()
  )
  return found ? found.sigla : (estadoNome || '').substring(0, 2).toUpperCase()
}

function sanitizeCityName(name) {
  if (!name) return ''
  return name
    .replace(/^Região Geográfica\s+(Intermediária|Imediata)\s+de\s+/i, '')
    .replace(/^Regiao Geografica\s+(Intermediaria|Imediata)\s+de\s+/i, '')
    .trim() || name
}

const FIXED_DISTANCE = '1,6'

export default function LocationBanner() {
  const { location, detectedLocation, detecting, saveLocation } = useLocation()
  const { showToast } = useToast()

  const [view, setView] = useState('welcome')
  const [selectedEstado, setSelectedEstado] = useState('')
  const [selectedCidade, setSelectedCidade] = useState('')
  const distance = FIXED_DISTANCE

  const estados = fetchEstados()
  const redirectTimer = useRef(null)

  useEffect(() => {
    return () => { if (redirectTimer.current) clearTimeout(redirectTimer.current) }
  }, [])

  useEffect(() => {
    if (view !== 'found') return
    redirectTimer.current = setTimeout(() => {
      if (selectedEstado && selectedCidade) saveLocation(selectedEstado, selectedCidade)
    }, 3000)
    return () => { if (redirectTimer.current) clearTimeout(redirectTimer.current) }
  }, [view]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLocate() {
    setView('searching')
    const result = await detectLocationByGPS()

    if (result?.estado && result?.cidade) {
      const sigla = result.sigla || estadoNomeToSigla(result.estado, estados)
      setSelectedEstado(sigla)
      setSelectedCidade(sanitizeCityName(result.cidade))
      setView('found')
    } else if (detectedLocation?.estado && detectedLocation?.cidade) {
      const sigla = detectedLocation.sigla || estadoNomeToSigla(detectedLocation.estado, estados)
      setSelectedEstado(sigla)
      setSelectedCidade(sanitizeCityName(detectedLocation.cidade))
      setView('found')
    } else {
      showToast('Não conseguimos detectar sua localização. Tente novamente.')
      setView('welcome')
    }
  }

  if (location) return null

  return (
    <>
      <div className="locbot-overlay" />
      <div className="locbot">
        <div className="locbot-inner">

          {view === 'welcome' && (
            <div className="locbot-content locbot-center">
              <div className="locbot-emoji">🍔</div>
              <h2 className="locbot-title">Bem-vindo à Burgz!</h2>
              <p className="locbot-subtitle">Procure o delivery mais próximo de você.</p>
              <button className="locbot-cta" onClick={handleLocate}>
                <i className="fas fa-map-marker-alt"></i>
                Localizar agora
              </button>
            </div>
          )}

          {view === 'searching' && (
            <div className="locbot-content locbot-center">
              <div className="locbot-spinner-wrap">
                <div className="locbot-spinner-ring"></div>
                <i className="fas fa-map-marker-alt locbot-spinner-pin"></i>
              </div>
              <h2 className="locbot-title">Buscando lojas próximas...</h2>
              <p className="locbot-subtitle locbot-subtle">Aguarde um momento</p>
            </div>
          )}

          {view === 'found' && (
            <div className="locbot-content locbot-center">
              <div className="locbot-check-wrap">
                <svg className="locbot-check-svg" viewBox="0 0 52 52">
                  <circle className="locbot-check-circle" cx="26" cy="26" r="24" fill="none" />
                  <path className="locbot-check-path" fill="none" d="M14 27l7 7 16-16" />
                </svg>
              </div>
              <h2 className="locbot-title">
                A Burgz mais próxima está{' '}
                a <span className="locbot-highlight">{distance}km</span> de você! 📍
              </h2>
              <p className="locbot-delivery">Entrega em <strong>20–30 min</strong></p>
              <p className="locbot-redirect">
                <i className="fas fa-circle-notch fa-spin"></i> Redirecionando...
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
