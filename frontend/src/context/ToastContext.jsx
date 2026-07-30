import { createContext, useContext, useState, useCallback } from 'react'
import './ToastContext.css'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info', suggestion = null, duration = 6000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type, suggestion }])
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" aria-live="assertive">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type} animate-slide-in`}>
            <div className="toast-content">
              <span className="toast-icon" aria-hidden="true">
                {t.type === 'success' && '✨'}
                {t.type === 'error' && '⚠️'}
                {t.type === 'warning' && '⚡'}
                {t.type === 'info' && '💡'}
              </span>
              <div className="toast-text">
                <div className="toast-message">{t.message}</div>
                {t.suggestion && <div className="toast-suggestion">{t.suggestion}</div>}
              </div>
            </div>
            <button className="toast-close" onClick={() => removeToast(t.id)} aria-label="Close alert">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
