import { useCart } from '../../contexts/CartContext'
import { useLocation } from '../../contexts/LocationContext'
import { useToast } from '../../contexts/ToastContext'
import { formatPrice } from '../../utils/formatPrice'

export default function CartFloat({ onClick }) {
  const { totalItems, totalPrice, cart } = useCart()
  const { location } = useLocation()
  const { showToast } = useToast()

  if (totalItems === 0) return null

  const handleCartClick = () => {
    if (!location) {
      showToast('Informe sua localização antes de continuar')
      return
    }
    onClick()
  }

  return (
    <div className="cart-float-wrapper">
      <button className="cart-float-bar" onClick={handleCartClick}>
        <div className="cart-float-left">
          <div className="cart-float-bag-icon">
            <i className="fas fa-shopping-bag"></i>
            <span className="cart-float-badge">{totalItems}</span>
          </div>
          <span className="cart-float-price">{formatPrice(totalPrice)}</span>
        </div>
        <span className="cart-float-label">VER SACOLA</span>
      </button>
    </div>
  )
}
