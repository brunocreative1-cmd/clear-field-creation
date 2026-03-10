import { useLocation } from '../../contexts/LocationContext'

export default function PromoBanner() {
  const { location } = useLocation()
  const cidade = location?.cidade || ''

  return (
    <>
      <div className="promo-banner promo-first-order">
        <span>Promoção de primeiro pedido ativada! <i className="fas fa-hamburger"></i></span>
      </div>

      <section className="promo-banners">
        <div className="promo-pill">
          <span>
            {cidade
              ? <>Entrega Grátis para <strong>{cidade}</strong>!</>
              : <>Entrega Grátis para <strong>sua região</strong>!</>
            }
          </span>
        </div>
      </section>
    </>
  )
}
