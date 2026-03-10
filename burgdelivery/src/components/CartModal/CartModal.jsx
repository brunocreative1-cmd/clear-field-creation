import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../contexts/CartContext'
import { formatPrice } from '../../utils/formatPrice'

export default function CartModal({ isOpen, onClose }) {
  const { cart, addToCart, removeFromCart, totalPrice, clearCart } = useCart()
  const navigate = useNavigate()

  const totalOldPrice = useMemo(() => {
    return cart.reduce((sum, item) => {
      const old = item.oldPrice && item.oldPrice > item.price ? item.oldPrice : item.price
      return sum + (old * item.qty)
    }, 0)
  }, [cart])

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleDeleteItem = (itemName) => {
    const item = cart.find(i => i.name === itemName)
    if (item) {
      for (let i = 0; i < item.qty; i++) {
        removeFromCart(itemName)
      }
    }
  }

  return (
    <div className={`cart-modal ${isOpen ? 'active' : ''}`} onClick={handleOverlayClick}>
      <div className="cart-modal-content">
        {/* Header */}
        <div className="cart-modal-header">
          <button className="close-cart" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
          <h2>Minha sacola</h2>
          <div style={{ width: 34 }}></div>
        </div>

        {/* Items */}
        <div className="cart-items">
          {cart.length === 0 ? (
            <p className="empty-cart">Sua sacola está vazia</p>
          ) : (
            cart.map(item => (
              <div className="cart-item" key={item.name}>
                <div className="cart-item-top">
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="cart-item-img" 
                    />
                  )}
                  <div className="cart-item-info">
                    <span className="cart-item-name">{item.name}</span>
                    {item.addons && item.addons.length > 0 && (
                      <ul className="cart-item-addons">
                        {item.addons.map((addon, idx) => (
                          <li key={idx}>
                            {addon.qty > 1 ? `${addon.qty}x ` : ''}{addon.name}
                          </li>
                        ))}
                      </ul>
                    )}
                    {item.notes && (
                      <span className="cart-item-notes">
                        <i className="fas fa-comment-alt"></i> {item.notes}
                      </span>
                    )}
                  </div>
                  <button 
                    className="cart-item-delete" 
                    onClick={() => handleDeleteItem(item.name)}
                    title="Remover item"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
                <div className="cart-item-bottom">
                  <div className="cart-item-controls">
                    <button className="qty-btn minus" onClick={() => removeFromCart(item.name)}>
                      <i className="fas fa-minus"></i>
                    </button>
                    <span className="cart-item-qty">{item.qty}</span>
                    <button className="qty-btn plus" onClick={() => addToCart(item.name, item.price, '', [], item.image)}>
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                  <div className="cart-item-price">
                    {item.oldPrice && item.oldPrice > item.price && (
                      <span className="cart-item-old-price" style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.8rem', marginRight: 6 }}>
                        {formatPrice(item.oldPrice * item.qty)}
                      </span>
                    )}
                    <span>{formatPrice(item.price * item.qty)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="cart-summary">
            {totalOldPrice > totalPrice && (
              <div className="cart-summary-row">
                <span>Subtotal:</span>
                <span className="cart-summary-original" style={{ textDecoration: 'line-through', color: '#999' }}>{formatPrice(totalOldPrice)}</span>
              </div>
            )}
            {totalOldPrice > totalPrice && (
              <div className="cart-summary-row discount-row">
                <span>Desconto</span>
                <span className="cart-summary-discount" style={{ color: '#22c55e', fontWeight: 600 }}>-{formatPrice(totalOldPrice - totalPrice)}</span>
              </div>
            )}
            <div className="cart-summary-row total-row">
              <span>Total:</span>
              <span className="cart-summary-final-price">{formatPrice(totalPrice)}</span>
            </div>
            <button className="pgmt-btn" onClick={() => { onClose(); navigate('/checkout'); }}>
              CONTINUAR
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
