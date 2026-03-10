import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProductById } from '../data/products'
import { fetchProductById } from '../services/productService'
import { formatPrice } from '../utils/formatPrice'
import { useCart } from '../contexts/CartContext'
import { useLocation } from '../contexts/LocationContext'
import { useToast } from '../contexts/ToastContext'
import ProductAddons from '../components/ProductAddons/ProductAddons'

function calcDiscount(oldPrice, newPrice) {
  return Math.round(((oldPrice - newPrice) / oldPrice) * 100)
}

export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, totalItems, totalPrice: cartTotal } = useCart()
  const { location: userLocation } = useLocation()
  const { showToast } = useToast()

  const [product, setProduct] = useState(() => getProductById(parseInt(id)))
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [selectedAddons, setSelectedAddons] = useState([])
  const [addonsCost, setAddonsCost] = useState(0)
  const [qty, setQty] = useState(1)
  const [allSelected, setAllSelected] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    setLoading(true)
    fetchProductById(parseInt(id))
      .then(data => {
        if (data) {
          setProduct(data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handleAddonsChange = useCallback((addons, extraCost = 0) => {
    setSelectedAddons(addons)
    setAddonsCost(extraCost)
  }, [])

  if (!product && !loading) {
    navigate('/')
    return null
  }

  if (!product) {
    return <div className="app-container" style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
  }

  const discount = calcDiscount(product.oldPrice, product.newPrice)

  function handleFinalize() {
    if (!userLocation) {
      showToast('Informe sua localização antes de adicionar ao carrinho')
      return
    }

    let cartItemName = product.name
    if (selectedAddons.length > 0) {
      const addonNames = selectedAddons.map(a => a.name).join(', ')
      cartItemName += ` + ${addonNames}`
    }

    for (let i = 0; i < qty; i++) {
      addToCart(cartItemName, product.newPrice, notes, selectedAddons, product.image, product.oldPrice)
    }

    setAdded(true)
  }

  const itemTotalPrice = ((product.newPrice + addonsCost) * qty).toFixed(2).replace('.', ',')

  return (
    <div className="app-container product-page">
      {/* Hero com imagem arredondada */}
      <div className="pd-hero">
        <button className="pd-back" onClick={() => navigate('/')}>
          <i className="fas fa-chevron-left"></i>
        </button>
        <img src={product.image} alt={product.name} className="pd-hero-img" />

        {/* Overlay com info da loja */}
        <div className="pd-store-overlay">
          <div className="pd-store-logo">
            <img src="/img/logo.webp" alt="Burgz Delivery" />
          </div>
          <div className="pd-store-info">
            <span className="pd-store-name">
              Burgz Delivery <i className="fas fa-check-circle"></i>
            </span>
            <span className="pd-store-meta">20-30 min · <strong>Grátis</strong></span>
          </div>
        </div>
      </div>

      {/* Detalhes do produto */}
      <section className="pd-details">
        <h1 className="pd-title">{product.name}</h1>
        <p className="pd-description">{product.description}</p>
        <span className="pd-serves">Serve até 1 pessoa</span>
        <div className="pd-price-row">
          <span className="pd-price">{formatPrice(product.newPrice)}</span>
          <span className="pd-old-price">{formatPrice(product.oldPrice)}</span>
          <span className="pd-discount">-{discount}%</span>
        </div>
      </section>

      <div className="pd-divider"></div>

      {/* Add-ons */}
      <ProductAddons
        addonKeys={product.addons || ['fritas', 'bebida']}
        onAddonsChange={handleAddonsChange}
        onCompletionChange={setAllSelected}
      />

      <div className="pd-divider"></div>

      {/* Observações */}
      <section className="pd-notes">
        <h3 className="pd-notes-title">Alguma observação?</h3>
        <div className="pd-notes-wrapper">
          <textarea
            className="pd-notes-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: tirar cebola, ponto da carne..."
            maxLength={140}
          />
          <span className="pd-notes-counter">{notes.length}/140</span>
        </div>
      </section>

      {/* Bottom Bar */}
      <div className={`pd-bottom-bar ${added ? 'expanded' : ''}`}>
        {!added ? (
          <>
            <div className="pd-qty-controls">
              <button className="pd-qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>
                <i className="fas fa-minus"></i>
              </button>
              <span className="pd-qty-value">{qty}</span>
              <button className="pd-qty-btn plus" onClick={() => setQty(q => q + 1)}>
                <i className="fas fa-plus"></i>
              </button>
            </div>
            <button
              className={`pd-add-btn ${allSelected ? 'active' : ''}`}
              onClick={handleFinalize}
              disabled={!allSelected}
            >
              <span>Adicionar</span>
              <span>R$ {itemTotalPrice}</span>
            </button>
          </>
        ) : (
          <>
            <div className="pd-added-confirm">
              <i className="fas fa-check-circle"></i>
              <span>{qty}x {product.name} adicionado!</span>
            </div>
            <div className="pd-added-total">
              <span>Carrinho: {totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <div className="pd-added-actions">
              <button className="pd-btn-continue" onClick={() => navigate('/')}>
                <i className="fas fa-plus"></i> Continuar comprando
              </button>
              <button className="pd-btn-checkout" onClick={() => navigate('/?cart=1')}>
                <i className="fas fa-shopping-bag"></i> Finalizar pedido
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
