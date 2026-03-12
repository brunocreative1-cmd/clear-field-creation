import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ApprovedPage() {
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="app-container conf-page">
      <div className="conf-content">
        <div className="conf-icon">
          <i className="fas fa-check"></i>
        </div>

        <h1 className="conf-title">Pedido Confirmado!</h1>
        <p className="conf-subtitle">Seu pagamento foi aprovado com sucesso</p>

        <div className="conf-card">
          <div className="conf-card-row">
            <i className="fas fa-utensils"></i>
            <div>
              <span className="conf-card-label">Preparando seu pedido</span>
              <span className="conf-card-desc">A cozinha já está trabalhando no seu lanche!</span>
            </div>
          </div>
          <div className="conf-card-row">
            <i className="fas fa-motorcycle"></i>
            <div>
              <span className="conf-card-label">Entrega estimada</span>
              <span className="conf-card-desc">20 a 30 minutos</span>
            </div>
          </div>
          <div className="conf-card-row">
            <i className="fas fa-phone-alt"></i>
            <div>
              <span className="conf-card-label">Dúvidas?</span>
              <span className="conf-card-desc">Entre em contato pelo WhatsApp</span>
            </div>
          </div>
        </div>

        <div className="conf-actions">
          <button className="conf-btn-primary" onClick={() => navigate('/')}>
            <i className="fas fa-home"></i> Voltar ao início
          </button>
        </div>

        <p className="conf-footer-text">
          Obrigado por escolher a <strong>Star Burger</strong>! 🍔
        </p>
      </div>
    </div>
  )
}
