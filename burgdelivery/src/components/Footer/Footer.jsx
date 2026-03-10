export default function Footer() {
  return (
    <footer className="site-footer">
      <p className="footer-brand">BURGZ | Hambúrgueres Artesanais</p>
      <div className="footer-payments">
        <span className="footer-payments-label">Formas de pagamento</span>
        <div className="footer-payments-icons">
          <i className="fab fa-cc-visa"></i>
          <i className="fab fa-cc-mastercard"></i>
          <i className="fab fa-cc-amex"></i>
          <i className="fab fa-cc-discover"></i>
          <i className="fab fa-cc-diners-club"></i>
          <i className="fas fa-qrcode"></i>
          <i className="fas fa-barcode"></i>
          <i className="fab fa-cc-apple-pay"></i>
          <i className="fab fa-google-pay"></i>
        </div>
      </div>
      <p className="footer-credits">Plataforma fornecida por <strong>Burgz Delivery Digital</strong></p>
    </footer>
  )
}
