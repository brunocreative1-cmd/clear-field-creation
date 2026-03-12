import { useState, useEffect } from 'react'
import { useLocation } from '../../contexts/LocationContext'

/**
 * Calcula o horário de fechamento:
 * 2 horas após a entrada, arredondado para cima para a hora cheia.
 * Ex: entrada 19:00 → fecha 21:00 | entrada 19:54 → fecha 22:00
 */
function getClosingTime() {
  const KEY = 'burgzEntryTime'

  // Usa o horário de entrada salvo (persistente na sessão)
  let entryTime = sessionStorage.getItem(KEY)
  if (!entryTime) {
    entryTime = new Date().toISOString()
    sessionStorage.setItem(KEY, entryTime)
  }

  const entry = new Date(entryTime)
  const twoHoursLater = new Date(entry.getTime() + 1 * 60 * 60 * 1000)

  // Arredonda para cima para a hora cheia
  if (twoHoursLater.getMinutes() > 0 || twoHoursLater.getSeconds() > 0) {
    twoHoursLater.setHours(twoHoursLater.getHours() + 1)
    twoHoursLater.setMinutes(0, 0, 0)
  }

  return twoHoursLater
}

function formatHour(date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function Header() {
  const { location } = useLocation()
  const cidade = location?.cidade || ''
  const estado = location?.estado || ''

  const [closingTime] = useState(() => getClosingTime())
  const [isOpen, setIsOpen] = useState(true)

  // Verifica a cada minuto se a loja já fechou
  useEffect(() => {
    function check() {
      setIsOpen(new Date() < closingTime)
    }
    check()
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [closingTime])

  return (
    <>
      <header className="header-banner">
        <div className="banner-cover">
          <img src="/img/capa.webp" alt="Star Burger - Hambúrgueres artesanais" className="banner-cover-img" />
        </div>
      </header>

      <div className="restaurant-body">
        <div className="logo-wrapper">
          <div className="logo">
            <img src="/img/logo.webp" alt="" className="logo-img" loading="eager" style={{color:'transparent'}} />
          </div>
        </div>

        <section className="restaurant-info">
          <h1 className="restaurant-name">Star Burger</h1>
          <div className="social-icons">
            <a href="#" className="social-icon" aria-label="Instagram">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#" className="social-icon" aria-label="Informações">
              <i className="fas fa-info-circle"></i>
            </a>
          </div>
          <div className="info-details">
            <span className="info-item">
              <i className="fas fa-shopping-bag"></i> Pedido Mínimo <strong>R$ 15,00</strong>
            </span>
            <span className="info-separator"></span>
            <span className="info-item">
              <i className="fas fa-motorcycle"></i> 20-30 min
            </span>
            <span className="info-separator">&bull;</span>
            <span className="free-badge">Grátis</span>
          </div>
          {cidade && (
            <div className="location">
              <i className="fas fa-map-marker-alt"></i>{' '}
              <span>
                {cidade}{estado ? ` - ${estado}` : ''} &bull; 1,6km de você
              </span>
            </div>
          )}
          <div className="rating">
            <i className="fas fa-star"></i> <strong>4,8</strong>{' '}
            <span className="rating-count">(1.236 avaliações)</span>
          </div>
          <div className={`status ${isOpen ? 'open' : 'closed'}`}>
            <span className="status-dot"></span>
            {isOpen
              ? <>ABERTO <i className="far fa-clock"></i> até {formatHour(closingTime)}</>
              : <>FECHADO <i className="far fa-clock"></i> abre amanhã</>
            }
          </div>
        </section>
      </div>
    </>
  )
}
