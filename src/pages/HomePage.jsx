import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import Header from '../components/Header/Header'
import PromoBanner from '../components/PromoBanner/PromoBanner'
import CategoryFilter from '../components/CategoryFilter/CategoryFilter'
import HighlightsGrid from '../components/HighlightsGrid/HighlightsGrid'
import OfferCard from '../components/OfferCard/OfferCard'
import Countdown from '../components/Countdown/Countdown'
import ReviewsSection from '../components/ReviewsSection/ReviewsSection'
import CartFloat from '../components/CartFloat/CartFloat'
import CartModal from '../components/CartModal/CartModal'
import LocationBanner from '../components/LocationBanner/LocationBanner'
import Footer from '../components/Footer/Footer'
import { productList as localProductList } from '../data/products'
import { fetchProducts } from '../services/productService'
import { useCart } from '../contexts/CartContext'

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeCategory, setActiveCategory] = useState('all')
  const [cartOpen, setCartOpen] = useState(false)
  const [products, setProducts] = useState(localProductList)
  const { cart } = useCart()

  useEffect(() => {
    fetchProducts().then(setProducts).catch(() => {})
  }, [])

  // Abre carrinho diretamente se vier da ProductPage
  useEffect(() => {
    if (searchParams.get('cart') === '1' && cart.length > 0) {
      setCartOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, cart, setSearchParams])

  // Dia da semana para o título
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const diaAtual = diasSemana[new Date().getDay()]

  // Mini countdown de 15 min
  const [miniTimer, setMiniTimer] = useState(15 * 60)
  const miniRef = useRef(null)

  useEffect(() => {
    miniRef.current = setInterval(() => {
      setMiniTimer(prev => (prev <= 0 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(miniRef.current)
  }, [])

  const miniMin = Math.floor(miniTimer / 60).toString().padStart(2, '0')
  const miniSec = (miniTimer % 60).toString().padStart(2, '0')

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory)

  // Split products: first 4, then countdown, then the rest
  const firstBatch = filteredProducts.slice(0, 4)
  const secondBatch = filteredProducts.slice(4)

  const toggleCart = useCallback(() => {
    setCartOpen(prev => !prev)
  }, [])

  return (
    <div className="app-container">
      <Header />

      <PromoBanner />

      <CategoryFilter
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {activeCategory === 'all' && <HighlightsGrid products={products} />}

      <section className="offers">
        <h2 className="section-title">
          Ofertas de {diaAtual}
          <span className="title-mini-timer">
            <i className="far fa-clock"></i> {miniMin}:{miniSec}
          </span>
        </h2>

        {firstBatch.map(product => (
          <OfferCard key={product.id} product={product} />
        ))}

        {activeCategory === 'all' && <Countdown />}

        {secondBatch.map(product => (
          <OfferCard key={product.id} product={product} />
        ))}
      </section>

      <ReviewsSection />
      <Footer />

      <CartFloat onClick={toggleCart} />
      <CartModal
        isOpen={cartOpen}
        onClose={toggleCart}
      />
      <LocationBanner />
    </div>
  )
}
