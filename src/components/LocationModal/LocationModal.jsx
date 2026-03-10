import { useState, useEffect } from 'react'
import { useLocation } from '../../contexts/LocationContext'
import { useToast } from '../../contexts/ToastContext'
import { fetchEstados, fetchCidades } from '../../services/ibgeService'
import { detectLocationByGPS } from '../../services/gpsService'

function estadoNomeToSigla(estadoNome, estados) {
  if (!estadoNome || !estados?.length) return ''
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const found = estados.find(
    e => norm(e.nome) === norm(estadoNome) || e.sigla === (estadoNome || '').substring(0, 2).toUpperCase()
  )
  return found ? found.sigla : (estadoNome || '').substring(0, 2).toUpperCase()
}

/**
 * Limpa nomes de "Região Geográfica ..." retornados pelo Nominatim/IBGE
 * Ex: "Região Geográfica Intermediária de Goiânia" → "Goiânia"
 */
function sanitizeCityName(name) {
  if (!name) return ''
  let cleaned = name
    .replace(/^Região Geográfica\s+(Intermediária|Imediata)\s+de\s+/i, '')
    .replace(/^Regiao Geografica\s+(Intermediaria|Imediata)\s+de\s+/i, '')
    .trim()
  return cleaned || name
}

/**
 * Fluxo unificado (WiFi ou dados móveis):
 *  detecting  → (IP achou)  confirmed
 *  detecting  → (IP falhou) welcome
 *  welcome    → (GPS)       gpsLoading → confirmed | manual
 *  confirmed  → (confirmar) loading    → done
 *  manual     → (concluir)  loading    → done
 *  done       → fecha modal automaticamente
 */
export default function LocationModal() {
  const { detectedLocation, detecting, showModal, saveLocation, closeModal } = useLocation()
  const { showToast } = useToast()

  const [mode, setMode] = useState('detecting')
  const [step, setStep] = useState(1)
  const [cidades, setCidades] = useState([])
  const [selectedEstado, setSelectedEstado] = useState('')
  const [selectedCidade, setSelectedCidade] = useState('')
  const [loadingCidades, setLoadingCidades] = useState(false)
  const [hiding, setHiding] = useState(false)

  const estados = fetchEstados()

  // Bloquea scroll quando modal está aberto
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [showModal])

  // Reage ao resultado da detecção por IP (apenas nos modos iniciais)
  useEffect(() => {
    if (detecting) return
    // Só atualiza se ainda estiver no estado inicial (detecting/welcome)
    // Se o usuário já interagiu (GPS, manual, etc.), não interrompe
    if (mode !== 'detecting' && mode !== 'welcome') return
    
    if (detectedLocation?.estado && detectedLocation?.cidade) {
      const sigla = detectedLocation.sigla || estadoNomeToSigla(detectedLocation.estado, estados)
      setSelectedEstado(sigla)
      setSelectedCidade(sanitizeCityName(detectedLocation.cidade))
      setMode('confirmed')
    } else {
      setMode('welcome')
    }
  }, [detecting, detectedLocation]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleProcurarGPS() {
    setMode('gpsLoading')
    const result = await detectLocationByGPS()
    if (result?.estado && result?.cidade) {
      const sigla = result.sigla || estadoNomeToSigla(result.estado, estados)
      setSelectedEstado(sigla)
      setSelectedCidade(sanitizeCityName(result.cidade))
      setMode('confirmed')
    } else {
      if (detectedLocation?.estado && detectedLocation?.cidade) {
        const sigla = detectedLocation.sigla || estadoNomeToSigla(detectedLocation.estado, estados)
        setSelectedEstado(sigla)
        setSelectedCidade(sanitizeCityName(detectedLocation.cidade))
        setMode('confirmed')
      } else {
        showToast('Não foi possível obter sua localização. Escolha manualmente.')
        handleEscolherManual()
      }
    }
  }

  function handleEscolherManual() {
    if (detectedLocation?.estado && detectedLocation?.cidade) {
      const sigla = detectedLocation.sigla || estadoNomeToSigla(detectedLocation.estado, estados)
      setSelectedEstado(sigla)
      loadCidadesForEstado(sigla, sanitizeCityName(detectedLocation.cidade))
      setStep(2)
    } else {
      setSelectedEstado('')
      setSelectedCidade('')
      setCidades([])
      setStep(1)
    }
    setMode('manual')
  }

  function handleConfirmDetected() {
    setMode('loading')
    setTimeout(() => setMode('done'), 2500)
  }

  function handleChangeManual() {
    setSelectedEstado('')
    setSelectedCidade('')
    setCidades([])
    setStep(1)
    setMode('manual')
  }

  async function loadCidadesForEstado(uf, preselectCity) {
    if (!uf) return
    setLoadingCidades(true)
    try {
      const data = await fetchCidades(uf)
      setCidades(data)
      if (preselectCity) {
        const normalized = preselectCity.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        const found = data.find(c => {
          const n = c.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          return n === normalized
        })
        if (found) setSelectedCidade(found.nome)
      }
    } catch {
      setCidades([])
    }
    setLoadingCidades(false)
  }

  function handleNext() {
    if (step === 1) {
      if (!selectedEstado) {
        showToast('Selecione seu estado')
        return
      }
      loadCidadesForEstado(selectedEstado)
      setStep(2)
    } else if (step === 2) {
      if (!selectedCidade) {
        showToast('Selecione sua cidade')
        return
      }
      setMode('loading')
      setTimeout(() => setMode('done'), 2500)
    }
  }

  function handleFinish() {
    setHiding(true)
    document.body.style.overflow = ''
    setTimeout(() => {
      closeModal()
      setHiding(false)
    }, 350)
  }

  useEffect(() => {
    if (mode !== 'done') return
    const t = setTimeout(() => {
      if (selectedEstado && selectedCidade) saveLocation(selectedEstado, selectedCidade)
      handleFinish()
    }, 1000)
    return () => clearTimeout(t)
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!showModal) return null

  return (
    <div className={`loc-overlay ${hiding ? 'hidden' : ''}`}>
      <div className="loc-card">

        {/* Header com logo */}
        <div className="loc-header">
          <img src="/img/logo.jpeg" alt="Burgz Delivery" className="loc-logo" />
        </div>

        <div className="loc-body">

          {/* Detectando por IP */}
          <div className={`loc-step ${mode === 'detecting' ? 'active' : ''}`}>
            <h2 className="loc-title">Encontre a loja<br />mais próxima!</h2>
            <p className="loc-subtitle">Estamos detectando sua localização...</p>
            <div className="loc-loader">
              <span></span><span></span><span></span>
            </div>
          </div>

          {/* Nenhuma detecção automática — opções ao usuário */}
          <div className={`loc-step ${mode === 'welcome' ? 'active' : ''}`}>
            <h2 className="loc-title">Olá! Vamos localizar<br />a loja mais próxima</h2>
            <p className="loc-subtitle">Precisamos da sua localização para mostrar<br />o cardápio e o tempo de entrega.</p>
            <button className="loc-btn" onClick={handleProcurarGPS}>
              <i className="fas fa-location-arrow"></i>
              Usar minha localização
            </button>
            <button className="loc-btn-link" onClick={handleEscolherManual}>
              Escolher cidade manualmente
            </button>
          </div>

          {/* GPS carregando */}
          <div className={`loc-step ${mode === 'gpsLoading' ? 'active' : ''}`}>
            <h2 className="loc-title">Obtendo<br />sua localização...</h2>
            <p className="loc-subtitle">Aguarde um instante.</p>
            <div className="loc-loader">
              <span></span><span></span><span></span>
            </div>
          </div>

          {/* Localização detectada — confirmar */}
          <div className={`loc-step ${mode === 'confirmed' ? 'active' : ''}`}>
            <h2 className="loc-title">Localização<br />encontrada!</h2>
            <p className="loc-subtitle">Confirme se está correto:</p>
            <div className="loc-detected-info">
              <i className="fas fa-map-marker-alt loc-detected-pin"></i>
              <div className="loc-detected-text">
                <strong>{selectedCidade}</strong>
                {selectedEstado ? <span className="loc-detected-state">{selectedEstado}</span> : null}
              </div>
            </div>
            <button className="loc-btn" onClick={handleConfirmDetected}>
              <i className="fas fa-check"></i>
              Confirmar localização
            </button>
            <button className="loc-btn-link" onClick={handleChangeManual}>
              <i className="fas fa-pencil-alt"></i>
              Não é minha cidade? Alterar
            </button>
          </div>

          {/* Seleção manual — Estado */}
          <div className={`loc-step ${mode === 'manual' && step === 1 ? 'active' : ''}`}>
            <h2 className="loc-title">Selecione<br />seu estado</h2>
            <p className="loc-subtitle">Passo 1 de 2</p>
            <div className="loc-select-wrapper">
              <i className="fas fa-map loc-select-icon"></i>
              <select
                className="loc-select"
                value={selectedEstado}
                onChange={(e) => setSelectedEstado(e.target.value)}
              >
                <option value="">Selecione o estado</option>
                {estados.map(e => (
                  <option key={e.sigla} value={e.sigla}>{e.nome}</option>
                ))}
              </select>
            </div>
            <button className="loc-btn" onClick={handleNext}>
              Próximo <i className="fas fa-arrow-right"></i>
            </button>
          </div>

          {/* Seleção manual — Cidade */}
          <div className={`loc-step ${mode === 'manual' && step === 2 ? 'active' : ''}`}>
            <h2 className="loc-title">Selecione<br />sua cidade</h2>
            <p className="loc-subtitle">Passo 2 de 2 · {selectedEstado}</p>
            <div className="loc-select-wrapper">
              <i className="fas fa-city loc-select-icon"></i>
              <select
                className="loc-select"
                value={selectedCidade}
                onChange={(e) => setSelectedCidade(e.target.value)}
                disabled={loadingCidades}
              >
                <option value="">
                  {loadingCidades ? 'Carregando cidades...' : 'Selecione a cidade'}
                </option>
                {cidades.map(c => (
                  <option key={c.nome} value={c.nome}>{c.nome}</option>
                ))}
              </select>
            </div>
            <button className="loc-btn" onClick={handleNext}>
              <i className="fas fa-search"></i>
              Procurar loja mais próxima
            </button>
          </div>

          {/* Procurando loja */}
          <div className={`loc-step ${mode === 'loading' ? 'active' : ''}`}>
            <h2 className="loc-title">Procurando<br />a loja mais próxima...</h2>
            <p className="loc-subtitle">Verificando disponibilidade em <strong>{selectedCidade}</strong></p>
            <div className="loc-loader">
              <span></span><span></span><span></span>
            </div>
          </div>

          {/* Resultado — encontrou */}
          <div className={`loc-step ${mode === 'done' ? 'active' : ''}`}>
            <div className="loc-check-icon">
              <i className="fas fa-check"></i>
            </div>
            <h2 className="loc-title" style={{ marginBottom: 8 }}>Tudo certo!</h2>
            <p className="loc-result-text">
              A Burgz Delivery mais próxima fica a <strong>1,6km</strong> de você!<br />
              Entrega em <strong>20 a 30 minutos</strong>.
            </p>
            <p className="loc-redirecting">
              <i className="fas fa-circle-notch fa-spin"></i> Redirecionando...
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
