import { useNavigate } from 'react-router-dom'
import { useLocation as useLocCtx } from '../../contexts/LocationContext'
import { useToast } from '../../contexts/ToastContext'

const diasSemana = [
  'DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'
]

const badgeLabels = {
  monday: () => `${diasSemana[new Date().getDay()]} EM DOBRO!`,
  bestseller: () => 'O mais pedido',
  new: () => 'Novidade',
}

function calcDiscount(oldPrice, newPrice) {
  return Math.round(((oldPrice - newPrice) / oldPrice) * 100)
}

export default function OfferCard({ product }) {
  const { id, name, description, oldPrice, newPrice, image, badge, promoToday } = product
  const discount = calcDiscount(oldPrice, newPrice)
  const tagText = badgeLabels[badge.type] ? badgeLabels[badge.type]() : null
  const { location } = useLocCtx()
  const { showToast } = useToast()
  const navigate = useNavigate()

  function handleClick(e) {
    if (!location) {
      e.preventDefault()
      showToast('Informe sua localização para ver o cardápio')
      return
    }
    navigate(`/produto/${id}`)
  }

  return (
    <div className="offer-card-link" onClick={handleClick} style={{ cursor: 'pointer' }}>
      <div className="offer-card">
        <div className="offer-text">
          {tagText && (
            <span className={`offer-tag ${badge.type}`}>{tagText}</span>
          )}
          <h3 className="offer-name">{name}</h3>
          {description && (
            <p className="offer-desc">{description}</p>
          )}
          <span className="offer-serves">Serve até 1 pessoa</span>
          {promoToday && (
            <div className="offer-promo-today">PROMOÇÃO VÁLIDA SOMENTE HOJE!</div>
          )}
          <div className="offer-price-row">
            <span className="offer-price">R$ {newPrice.toFixed(2).replace('.', ',')}</span>
            <span className="offer-old-price">R$ {oldPrice.toFixed(2).replace('.', ',')}</span>
            <span className="offer-discount">-{discount}%</span>
          </div>
        </div>
        <div className="offer-img-wrapper">
          <img src={image} alt={name} className="offer-img" loading="lazy" decoding="async" />
        </div>
      </div>
    </div>
  )
}
