import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { CartProvider } from './contexts/CartContext'
import { LocationProvider } from './contexts/LocationContext'
import { ToastProvider } from './contexts/ToastContext'

const HomePage = lazy(() => import('./pages/HomePage'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const ApprovedPage = lazy(() => import('./pages/ApprovedPage'))

export default function App() {
  return (
    <LocationProvider>
      <CartProvider>
        <ToastProvider>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/produto/:id" element={<ProductPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/aprovado" element={<ApprovedPage />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </CartProvider>
    </LocationProvider>
  )
}
