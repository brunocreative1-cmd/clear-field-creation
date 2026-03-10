import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ message: '', visible: false })
  const timerRef = useRef(null)

  const showToast = useCallback((message) => {
    if (timerRef.current) clearTimeout(timerRef.current)

    setToast({ message, visible: true })

    // Auto-fechar após 3 segundos
    timerRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={`toast ${toast.visible ? 'show' : ''}`}>
        <i className="fas fa-check-circle"></i> {toast.message}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider')
  }
  return context
}
