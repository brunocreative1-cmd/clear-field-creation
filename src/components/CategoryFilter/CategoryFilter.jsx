import { useState, useEffect, useRef } from 'react'

const categories = [
  { id: 'all', label: 'Todos', icon: 'fas fa-fire' },
  { id: 'combos', label: 'Combos', icon: 'fas fa-layer-group' },
  { id: 'burgers', label: 'Burgers', icon: 'fas fa-hamburger' },
  { id: 'bebidas', label: 'Bebidas', icon: 'fas fa-glass-cheers' },
  { id: 'sobremesas', label: 'Sobremesas', icon: 'fas fa-ice-cream' },
]

export default function CategoryFilter({ activeCategory, onCategoryChange }) {
  const ref = useRef(null)
  const [isSticky, setIsSticky] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Quando o topo do elemento encosta no topo da viewport, está sticky
        setIsSticky(!entry.isIntersecting)
      },
      { threshold: 1, rootMargin: '-1px 0px 0px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className={`categories ${isSticky ? 'sticky-shadow' : ''}`}>
      <h2 className="section-title">Categorias</h2>
      <div className="categories-scroll">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => onCategoryChange(cat.id)}
          >
            <i className={cat.icon}></i> {cat.label}
          </button>
        ))}
      </div>
    </section>
  )
}
