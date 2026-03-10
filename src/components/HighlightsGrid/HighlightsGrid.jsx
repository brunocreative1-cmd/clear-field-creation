import { useNavigate } from 'react-router-dom'
import { formatPrice } from '../../utils/formatPrice'
import { useLocation } from '../../contexts/LocationContext'
import { useToast } from '../../contexts/ToastContext'

function calcDiscount(oldPrice, newPrice) {
  return Math.round(((oldPrice - newPrice) / oldPrice) * 100)
}

export default function HighlightsGrid({ products }) {
  const navigate = useNavigate()
  const { location } = useLocation()
  const { showToast } = useToast()

  // Pega os 6 primeiros produtos
  const highlights = products.slice(0, 6)

  if (highlights.length === 0) return null

  const handleClick = (productId) => {
    if (!location) {
      showToast('Informe sua localização para ver o cardápio', 'error')
      return
    }
    navigate(`/produto/${productId}`)
  }

  return (
    <section className="highlights-section">
      <h2 className="highlights-title">Destaques</h2>
      <div className="highlights-grid">
        {highlights.map((product, index) => (
          <div onClick={() => handleClick(product.id)} key={product.id} className="highlight-card-link" style={{ cursor: 'pointer' }}>
            <div className="highlight-card">
              <div className="highlight-img-wrapper">
                <img src={product.image} alt={product.name} className="highlight-img" />
                {index === 0 && (
                  <span className="highlight-tag">Mais pedido</span>
                )}
              </div>
              <div className="highlight-info">
                <div className="highlight-new-price">
                  <span>R$ {product.newPrice.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="highlight-old-row">
                  <span className="highlight-old-price">
                    R${product.oldPrice.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="highlight-discount">
                    -{calcDiscount(product.oldPrice, product.newPrice)}%
                  </span>
                </div>
                <p className="highlight-name">{product.name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
