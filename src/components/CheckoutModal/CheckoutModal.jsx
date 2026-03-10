import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../contexts/CartContext'
import { useToast } from '../../contexts/ToastContext'
import { formatPrice } from '../../utils/formatPrice'
import { validateCpf, maskCpf, maskPhone, maskCep } from '../../utils/validators'
import { fetchCep } from '../../services/cepService'
import { createOrder } from '../../services/orderService'
import { createPixTransaction, checkTransactionStatus } from '../../services/pixService'
import { lookupCpf } from '../../services/cpfLookupService'

export default function CheckoutModal({ isOpen, onClose }) {
  const { cart, totalPrice, clearCart } = useCart()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [summaryOpen, setSummaryOpen] = useState(true)

  // Step 1 - CPF Lookup
  const [cpf, setCpf] = useState('')
  const [cpfError, setCpfError] = useState('')
  const [cpfLoading, setCpfLoading] = useState(false)
  const [cpfName, setCpfName] = useState('')
  const [cpfFound, setCpfFound] = useState(false)

  // Step 2 - Personal Data
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')

  // Step 3 - Address
  const [cep, setCep] = useState('')
  const [cepError, setCepError] = useState('')
  const [rua, setRua] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidadeUf, setCidadeUf] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [referencia, setReferencia] = useState('')
  const [addressVisible, setAddressVisible] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)

  // Step 4 - Payment
  const [selectedPayment] = useState('pix')

  // Step 5 - Pix (real API)
  const [pixLoading, setPixLoading] = useState(false)
  const [pixQrCode, setPixQrCode] = useState('')
  const [pixQrBase64, setPixQrBase64] = useState('')
  const [pixQrImageLoaded, setPixQrImageLoaded] = useState(false)
  const [pixTransactionId, setPixTransactionId] = useState(null)
  const [pixTime, setPixTime] = useState(15 * 60)
  const [pixStatus, setPixStatus] = useState('pending')
  const pixTimerRef = useRef(null)
  const pollRef = useRef(null)
  const cepDebounceRef = useRef(null)

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setSummaryOpen(true)
      setPixQrCode('')
      setPixQrBase64('')
      setPixQrImageLoaded(false)
      setPixTransactionId(null)
      setPixStatus('pending')
      setPixLoading(false)
      setCpfName('')
      setCpfFound(false)
      setCpfLoading(false)
      setCpfError('')
    }
  }, [isOpen])

  // Pix countdown timer
  useEffect(() => {
    if (step === 5 && pixTransactionId) {
      setPixTime(15 * 60)
      pixTimerRef.current = setInterval(() => {
        setPixTime(prev => {
          if (prev <= 0) {
            clearInterval(pixTimerRef.current)
            showToast('O código Pix expirou. Gere um novo.')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (pixTimerRef.current) clearInterval(pixTimerRef.current)
    }
  }, [step, pixTransactionId, showToast])

  // Poll payment status via Paradise
  useEffect(() => {
    if (step === 5 && pixTransactionId && pixStatus === 'pending') {
      pollRef.current = setInterval(async () => {
        try {
          const result = await checkTransactionStatus(pixTransactionId)
          if (result.status === 'COMPLETO') {
            setPixStatus('approved')
            clearInterval(pollRef.current)
            clearInterval(pixTimerRef.current)
            showToast('Pagamento confirmado!')
            clearCart()
            setTimeout(() => {
              handleClose()
              navigate('/aprovado', { state: { transactionId: pixTransactionId } })
            }, 1500)
          } else if (result.status === 'FALHA') {
            setPixStatus('failed')
            clearInterval(pollRef.current)
            showToast('Pagamento não aprovado. Tente novamente.')
          }
        } catch {
          // silently retry
        }
      }, 5000)
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [step, pixTransactionId, pixStatus])

  function handleClose() {
    if (pixTimerRef.current) clearInterval(pixTimerRef.current)
    if (pollRef.current) clearInterval(pollRef.current)
    if (cepDebounceRef.current) clearTimeout(cepDebounceRef.current)
    onClose()
  }

  // ── CPF Lookup (Step 1) ──────────────────────────────────
  async function handleCpfLookup() {
    setCpfError('')
    const rawCpf = cpf.replace(/\D/g, '')

    if (rawCpf.length !== 11) {
      setCpfError('Digite um CPF completo')
      return
    }
    if (!validateCpf(rawCpf)) {
      setCpfError('CPF inválido')
      return
    }

    setCpfLoading(true)
    try {
      const result = await lookupCpf(rawCpf)
      if (result.nome) {
        setCpfName(result.nome)
        setCpfFound(true)
        setNome(result.nome)
      }
    } catch {
      // CPF não encontrado na API — segue normalmente
      setCpfFound(false)
      setCpfName('')
    } finally {
      setCpfLoading(false)
    }
  }

  function handleCpfChange(value) {
    const masked = maskCpf(value)
    setCpf(masked)
    setCpfError('')
    setCpfFound(false)
    setCpfName('')

    // Auto-consulta quando completa 11 dígitos
    const raw = masked.replace(/\D/g, '')
    if (raw.length === 11 && validateCpf(raw)) {
      setCpfLoading(true)
      lookupCpf(raw)
        .then(result => {
          if (result.nome) {
            setCpfName(result.nome)
            setCpfFound(true)
            setNome(result.nome)
          }
        })
        .catch(() => {
          setCpfFound(false)
          setCpfName('')
        })
        .finally(() => setCpfLoading(false))
    }
  }

  // ── Validations ──────────────────────────────────────────
  function validateStep1() {
    setCpfError('')
    const rawCpf = cpf.replace(/\D/g, '')
    if (rawCpf.length !== 11) {
      setCpfError('Digite um CPF completo')
      return false
    }
    if (!validateCpf(rawCpf)) {
      setCpfError('CPF inválido')
      return false
    }
    return true
  }

  function validateStep2() {
    if (!nome.trim() || nome.trim().length < 3) {
      showToast('Informe seu nome completo')
      return false
    }
    const rawPhone = telefone.replace(/\D/g, '')
    if (rawPhone.length < 10) {
      showToast('Informe um número de contato válido')
      return false
    }
    return true
  }

  function validateStep3() {
    const rawCep = cep.replace(/\D/g, '')
    if (rawCep.length !== 8 || !rua) {
      setCepError('Busque um CEP válido primeiro')
      return false
    }
    if (!numero.trim()) {
      showToast('Informe o número do endereço')
      return false
    }
    return true
  }

  async function handleSearchCep(rawOverride) {
    const rawCep = rawOverride || cep.replace(/\D/g, '')
    if (rawCep.length !== 8) {
      setCepError('Digite um CEP válido com 8 dígitos')
      return
    }

    setCepLoading(true)
    setCepError('')

    try {
      const data = await fetchCep(rawCep)
      setRua(data.rua)
      setBairro(data.bairro)
      setCidadeUf(data.cidadeUf)
      setAddressVisible(true)
    } catch (err) {
      setCepError('CEP não encontrado. Preencha os campos manualmente.')
      // Limpa os campos mas mantém visíveis para preenchimento manual
      setRua('')
      setBairro('')
      setCidadeUf('')
      setAddressVisible(true)
    } finally {
      setCepLoading(false)
    }
  }

  function handleCepChange(value) {
    const masked = maskCep(value)
    setCep(masked)
    setCepError('')
    
    // Limpar debounce anterior
    if (cepDebounceRef.current) {
      clearTimeout(cepDebounceRef.current)
    }
    
    const raw = masked.replace(/\D/g, '')
    if (raw.length === 8) {
      // Busca automática com debounce de 300ms
      cepDebounceRef.current = setTimeout(() => {
        handleSearchCep(raw)
      }, 300)
    }
  }

  async function generatePixPayment() {
    setPixLoading(true)
    try {
      // Subtrai de 1 a 10 centavos aleatoriamente para tornar cada transação única
      const randomDiscount = Math.floor(Math.random() * 10) + 1
      const amountCents = Math.round(totalPrice * 100) - randomDiscount
      const rawCpf = cpf.replace(/\D/g, '')
      const generatedEmail = `acesso.${rawCpf}@apiaccess.com`

      // Extrai cidade e UF de "Cidade - UF" (ex: "São Paulo - SP")
      const cidadeParts = cidadeUf ? cidadeUf.split(' - ') : []
      const cidadeNome = cidadeParts[0]?.trim() || ''
      const cidadeEstado = cidadeParts[1]?.trim() || ''

      const result = await createPixTransaction({
        amountCents,
        customerName: nome.trim(),
        customerEmail: generatedEmail,
        customerDocument: rawCpf,
        customerPhone: telefone.replace(/\D/g, ''),
        customerStreet: rua,
        customerNumber: numero,
        customerComplement: complemento,
        customerNeighborhood: bairro,
        customerCity: cidadeNome,
        customerState: cidadeEstado,
        customerZip: cep.replace(/\D/g, '')
      })

      console.log('[Checkout] Resultado PIX:', result)
      console.log('[Checkout] QR Code:', result.qrCode ? 'OK' : 'MISSING')
      console.log('[Checkout] QR Code Base64/Image:', result.qrCodeBase64 ? 'OK' : 'MISSING')
      console.log('[Checkout] QR Code Base64 conteúdo:', result.qrCodeBase64?.substring(0, 50) + '...')

      if (!result.qrCode && !result.qrCodeBase64) {
        throw new Error('QR Code não foi gerado pela API PIX')
      }

      setPixQrCode(result.qrCode)
      setPixQrBase64(result.qrCodeBase64)
      setPixQrImageLoaded(false) // Reset loading state
      setPixTransactionId(result.transactionId)
      setPixStatus('pending')

      // Registrar pedido (log local)
      createOrder({
        nome,
        cpf: cpf.replace(/\D/g, ''),
        telefone: telefone.replace(/\D/g, ''),
        cep: cep.replace(/\D/g, ''),
        rua,
        bairro,
        cidadeUf,
        numero,
        complemento,
        referencia,
        paymentMethod: selectedPayment,
        items: cart.map(item => ({
          name: item.name,
          price: item.price,
          qty: item.qty,
          notes: item.notes || '',
          addons: item.addons || []
        })),
        totalPrice
      }).catch(() => {})

      setStep(5)
    } catch (err) {
      console.error('[Checkout] Erro completo ao gerar PIX:', err)
      showToast(`Erro ao gerar Pix: ${err.message || 'Erro desconhecido'}`)
      
      // Não resetar o step para permitir nova tentativa
      setTimeout(() => {
        console.log('[Checkout] Usuário pode tentar novamente')
      }, 1000)
    } finally {
      setPixLoading(false)
    }
  }

  async function handleNext() {
    if (step === 1) {
      if (!validateStep1()) return
      setStep(2)
    } else if (step === 2) {
      if (!validateStep2()) return
      setStep(3)
    } else if (step === 3) {
      if (!validateStep3()) return
      setStep(4)
    } else if (step === 4) {
      await generatePixPayment()
    } else if (step === 5) {
      handleClose()
      clearCart()
      showToast('Pedido realizado com sucesso!')
    }
  }

  function handleBack() {
    if (step > 1) {
      if (step === 5) {
        if (pixTimerRef.current) clearInterval(pixTimerRef.current)
        if (pollRef.current) clearInterval(pollRef.current)
      }
      setStep(step - 1)
    } else {
      handleClose()
    }
  }

  function copyPixCode() {
    if (!pixQrCode) return
    navigator.clipboard.writeText(pixQrCode).then(() => {
      showToast('Código Pix copiado!')
    }).catch(() => {
      const el = document.createElement('textarea')
      el.value = pixQrCode
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      showToast('Código Pix copiado!')
    })
  }

  // Button text by step
  function getNextButtonContent() {
    switch (step) {
      case 1:
        return <>Continuar <i className="fas fa-arrow-right"></i></>
      case 2:
      case 3:
        return <>Continuar <i className="fas fa-arrow-right"></i></>
      case 4:
        return pixLoading
          ? <><i className="fas fa-spinner fa-spin"></i> Gerando Pix...</>
          : <><i className="fas fa-qrcode"></i> Gerar Pix</>
      case 5:
        return pixStatus === 'approved'
          ? <><i className="fas fa-check"></i> Pagamento Confirmado!</>
          : <><i className="fas fa-check"></i> Já fiz o pagamento</>
      default:
        return 'Continuar'
    }
  }

  const pixMins = Math.floor(pixTime / 60).toString().padStart(2, '0')
  const pixSecs = (pixTime % 60).toString().padStart(2, '0')

  if (!isOpen) return null

  return (
    <div className="checkout-modal active" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="checkout-modal-content">

        {/* Header */}
        <div className="checkout-header">
          <button className="checkout-back-btn" onClick={handleBack}>
            <i className={step === 1 ? 'fas fa-times' : 'fas fa-arrow-left'}></i>
          </button>
          <div className="checkout-steps-indicator">
            {[1, 2, 3, 4, 5].map((s, i) => (
              <span key={s} style={{ display: 'contents' }}>
                <div className={`step-dot ${s === step ? 'active' : s < step ? 'completed' : ''}`}>{s}</div>
                {i < 4 && <div className={`step-line ${s < step ? 'active' : ''}`}></div>}
              </span>
            ))}
          </div>
          <button className="checkout-close-btn" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className="checkout-body">

          {/* STEP 1: Identificação por CPF */}
          <div className={`checkout-step ${step === 1 ? 'active' : ''}`}>
            <h2 className="checkout-step-title"><i className="fas fa-id-card"></i> Identificação</h2>
            <p className="cpf-lookup-subtitle">Insira seu CPF para continuar</p>
            <div className="checkout-form">
              <div className="form-group">
                <label>CPF</label>
                <div className="cpf-lookup-input-wrapper">
                  <input
                    type="text"
                    value={cpf}
                    onChange={e => handleCpfChange(e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    autoFocus
                  />
                  {cpfLoading && (
                    <span className="cpf-lookup-spinner">
                      <i className="fas fa-spinner fa-spin"></i>
                    </span>
                  )}
                </div>
                {cpfError && <span className="form-error">{cpfError}</span>}
              </div>

              {cpfFound && cpfName && (
                <div className="cpf-welcome-card">
                  <span className="cpf-welcome-greeting">Olá, <span className="cpf-welcome-name">{cpfName.split(' ')[0]}</span>! 😋🍔</span>
                  <span className="cpf-welcome-message">Você já possui conta na Burgz Delivery.</span>
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: Dados Pessoais */}
          <div className={`checkout-step ${step === 2 ? 'active' : ''}`}>
            <h2 className="checkout-step-title"><i className="fas fa-user"></i> Dados Pessoais</h2>
            <div className="checkout-form">
              <div className="form-group">
                <label>Nome completo</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" autoComplete="name" />
              </div>
              <div className="form-group">
                <label>Atualize seu contato</label>
                <input type="tel" value={telefone} onChange={e => setTelefone(maskPhone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} autoComplete="tel" />
              </div>
            </div>
          </div>

          {/* STEP 3: Endereço */}
          <div className={`checkout-step ${step === 3 ? 'active' : ''}`}>
            <h2 className="checkout-step-title"><i className="fas fa-map-marker-alt"></i> Endereço de Entrega</h2>
            <div className="checkout-form">
              <div className="form-group">
                <label>CEP</label>
                <div className="cep-input-wrapper">
                  <input type="text" value={cep} onChange={e => handleCepChange(e.target.value)} placeholder="00000-000" maxLength={9} autoComplete="postal-code" />
                  <button className={`cep-search-btn ${cepLoading ? 'loading' : ''}`} onClick={() => handleSearchCep()}>
                    {cepLoading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-search"></i> Buscar</>}
                  </button>
                </div>
                <span className="form-error">{cepError}</span>
                {!addressVisible && (
                  <button 
                    type="button" 
                    className="manual-address-btn" 
                    onClick={() => setAddressVisible(true)}
                  >
                    Ou preencher endereço manualmente
                  </button>
                )}
              </div>

              {addressVisible && (
                <div className="address-fields">
                  <div className="form-group">
                    <label>Rua</label>
                    <input type="text" value={rua} onChange={e => setRua(e.target.value)} placeholder="Rua" />
                  </div>
                  <div className="form-group">
                    <label>Bairro</label>
                    <input type="text" value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Bairro" />
                  </div>
                  <div className="form-group">
                    <label>Cidade / UF</label>
                    <input type="text" value={cidadeUf} onChange={e => setCidadeUf(e.target.value)} placeholder="Cidade - UF" />
                  </div>
                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>Número</label>
                      <input type="text" value={numero} onChange={e => setNumero(e.target.value)} placeholder="Nº" />
                    </div>
                    <div className="form-group flex-1">
                      <label>Compl. <span className="optional">(opcional)</span></label>
                      <input type="text" value={complemento} onChange={e => setComplemento(e.target.value)} placeholder="Apto, bloco..." />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Referência <span className="optional">(opcional)</span></label>
                    <input type="text" value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Próximo ao mercado, em frente à padaria..." />
                  </div>

                  {numero && (
                    <div className="delivery-preview">
                      <div className="delivery-preview-icon">
                        <i className="fas fa-motorcycle"></i>
                      </div>
                      <div className="delivery-preview-info">
                        <span className="delivery-preview-label">Entrega em:</span>
                        <span className="delivery-preview-address">
                          {rua}, {numero}{complemento ? ` - ${complemento}` : ''} · {bairro}
                        </span>
                        <span className="delivery-preview-time">
                          <i className="fas fa-clock"></i> Estimativa: 20 a 30 min
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* STEP 4: Pagamento */}
          <div className={`checkout-step ${step === 4 ? 'active' : ''}`}>
            <h2 className="checkout-step-title"><i className="fas fa-credit-card"></i> Forma de Pagamento</h2>
            <div className="payment-options">
              <div className={`payment-option ${selectedPayment === 'pix' ? 'selected' : ''}`}>
                <div className="payment-option-left">
                  <div className="payment-icon pix-icon">
                    <img src="/img/pix-logo.webp" alt="Pix" className="payment-icon-img" />
                  </div>
                  <div className="payment-info">
                    <span className="payment-name">Pix</span>
                    <span className="payment-desc">Aprovação instantânea</span>
                  </div>
                </div>
                <div className="payment-radio active"></div>
              </div>

              <div className="payment-option disabled">
                <div className="payment-option-left">
                  <div className="payment-icon card-icon">
                    <i className="fas fa-credit-card"></i>
                  </div>
                  <div className="payment-info">
                    <span className="payment-name">Cartão de Crédito</span>
                    <span className="payment-desc unavailable">Indisponível no momento</span>
                  </div>
                </div>
                <div className="payment-unavailable-badge">Em breve</div>
              </div>
            </div>
          </div>

          {/* STEP 5: Pix */}
          <div className={`checkout-step ${step === 5 ? 'active' : ''}`}>
            <h2 className="checkout-step-title"><i className="fas fa-qrcode"></i> Pagamento via Pix</h2>

            {pixStatus === 'approved' ? (
              <div className="pix-container">
                <div className="pix-success">
                  <i className="fas fa-check-circle"></i>
                  <h3>Pagamento Confirmado!</h3>
                  <p>Seu pedido foi recebido e está sendo preparado.</p>
                </div>
              </div>
            ) : (
              <div className="pix-container">
                <div className="pix-qr-wrapper">
                  {pixQrBase64 && pixQrImageLoaded ? (
                    <img 
                      src={pixQrBase64} 
                      alt="" 
                      className="pix-qr-image"
                      onLoad={() => {
                        console.log('[Checkout] QR Code carregado com sucesso')
                        setPixQrImageLoaded(true)
                      }}
                      onError={(e) => {
                        console.error('[Checkout] Erro ao carregar QR Code:', e.target.src)
                        setPixQrImageLoaded(false)
                      }}
                    />
                  ) : pixQrBase64 && !pixQrImageLoaded ? (
                    <div className="pix-qr-loading">
                      <img 
                        src={pixQrBase64} 
                        alt="" 
                        style={{opacity: 0, position: 'absolute'}}
                        onLoad={() => setPixQrImageLoaded(true)}
                        onError={() => setPixQrImageLoaded(false)}
                      />
                      <div className="pix-qr-mock">
                        <i className="fas fa-spinner fa-spin"></i>
                      </div>
                    </div>
                  ) : pixLoading ? (
                    <div className="pix-qr-mock">
                      <i className="fas fa-spinner fa-spin"></i>
                    </div>
                  ) : (
                    <div className="pix-qr-mock" style={{background: '#ffe6e6', border: '2px dashed #ff4444'}}>
                      <i className="fas fa-exclamation-triangle" style={{color: '#ff4444'}}></i>
                      <p style={{fontSize: '12px', color: '#ff4444', marginTop: '8px'}}>Erro ao gerar QR Code</p>
                    </div>
                  )}
                  <p className="pix-instruction">Escaneie o QR Code com o app do seu banco</p>
                </div>

                <div className="pix-copy-section">
                  <label>Ou copie o código Pix:</label>
                  <div className="pix-code-wrapper">
                    <input
                      type="text"
                      className="pix-code-input"
                      value={pixQrCode || 'Gerando código...'}
                      readOnly
                    />
                    <button className="pix-copy-btn" onClick={copyPixCode} disabled={!pixQrCode}>
                      <i className="fas fa-copy"></i> Copiar
                    </button>
                  </div>
                </div>

                <div className="pix-timer">
                  <i className="fas fa-clock"></i>
                  <span>Este código expira em <strong>{pixTime > 0 ? `${pixMins}:${pixSecs}` : 'Expirado'}</strong></span>
                </div>

                <div className="pix-polling-info">
                  <i className="fas fa-sync-alt fa-spin"></i>
                  <span>Aguardando confirmação do pagamento...</span>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Delivery info - acima do resumo no step 4 */}
        {step === 4 && rua && numero && (
          <div className="delivery-preview" style={{ margin: '0 20px 10px' }}>
            <div className="delivery-preview-icon">
              <i className="fas fa-motorcycle"></i>
            </div>
            <div className="delivery-preview-info">
              <span className="delivery-preview-label">Entrega em:</span>
              <span className="delivery-preview-address">
                {rua}, {numero}{complemento ? ` - ${complemento}` : ''} · {bairro}
              </span>
              <span className="delivery-preview-time">
                <i className="fas fa-clock"></i> Estimativa: 20 a 30 min
              </span>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="checkout-summary">
          <div className="checkout-summary-toggle" onClick={() => setSummaryOpen(!summaryOpen)}>
            <span><i className="fas fa-receipt"></i> Resumo do pedido</span>
            <i className={`fas fa-chevron-up summary-toggle-icon ${!summaryOpen ? 'collapsed' : ''}`}></i>
          </div>
          <div className={`checkout-summary-body ${!summaryOpen ? 'collapsed' : ''}`}>
            <div className="checkout-summary-items">
              {cart.map(item => (
                <div className="checkout-summary-item" key={item.name}>
                  <span className="checkout-summary-item-qty">{item.qty}x</span>
                  <span className="checkout-summary-item-name">{item.name}</span>
                  <span className="checkout-summary-item-price">{formatPrice(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
            <div className="checkout-summary-totals">
              <div className="checkout-summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="checkout-summary-row">
                <span>Entrega</span>
                <span className="free-text">Grátis</span>
              </div>
              <div className="checkout-summary-row total">
                <span>Total</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - esconde no step 5 (pagamento automático) */}
        {step !== 5 && (
          <div className="checkout-footer">
            <button
              className="checkout-next-btn"
              onClick={handleNext}
              disabled={pixLoading || cpfLoading || (step === 1 && cpf.replace(/\D/g, '').length !== 11)}
            >
              {getNextButtonContent()}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
