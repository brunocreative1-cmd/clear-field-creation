import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('burgzCart')
      if (!saved) return []
      const parsed = JSON.parse(saved)
      return parsed.map(item => ({
        ...item,
        image: item.image?.replace(/\.png$/, '.webp') || ''
      }))
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('burgzCart', JSON.stringify(cart))
  }, [cart])

  const addToCart = useCallback((name, price, notes = '', addons = [], image = '', oldPrice = null) => {
    setCart(prev => {
      const existing = prev.find(item => item.name === name)
      if (existing) {
        return prev.map(item =>
          item.name === name ? { ...item, qty: item.qty + 1, image: image || item.image } : item
        )
      }
      
      return [...prev, { 
        name, 
        price, 
        oldPrice,
        notes, 
        addons, 
        image,
        qty: 1,
        id: Date.now() + Math.random()
      }]
    })
  }, [])

  const removeFromCart = useCallback((name) => {
    setCart(prev => {
      return prev.reduce((acc, item) => {
        if (item.name === name) {
          if (item.qty > 1) {
            acc.push({ ...item, qty: item.qty - 1 })
          }
        } else {
          acc.push(item)
        }
        return acc
      }, [])
    })
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const cartTotal = useMemo(() => cart.reduce((total, item) => {
    const itemPrice = (item.price || 0) + (item.addons?.reduce((sum, addon) => sum + (addon.price || 0), 0) || 0)
    return total + (itemPrice * (item.qty || 1))
  }, 0), [cart])

  const cartItemsCount = useMemo(() => cart.reduce((total, item) => total + (item.qty || 1), 0), [cart])

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      cartTotal,
      cartItemsCount,
      totalPrice: cartTotal,
      totalItems: cartItemsCount
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}