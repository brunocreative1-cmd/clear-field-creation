import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import { useLocation } from '../contexts/LocationContext'
import { formatPrice } from '../utils/formatPrice'
import { validateCpf, maskCpf, maskPhone, maskCep } from '../utils/validators'
import { fetchCep } from '../services/cepService'
import { createOrder } from '../services/orderService'
import { createPixTransaction, checkTransactionStatus } from '../services/pixService'
import { lookupCpf } from '../services/cpfLookupService'


export default function CheckoutPage() {
  const { cart, totalPrice, clearCart } = useCart()
  const { showToast } = useToast()
  const { location: userLocation } = useLocation()
  const navigate = useNavigate()

  const userCity = userLocation?.cidade || 'sua cidade'
  const userState = userLocation?.estado || userLocation?.estadoNome || ''

  // Endereço real dinâmico para retirada, baseado na cidade do usuário
  const pickupAddress = useMemo(() => {
    const cityStreets = {
      'São Paulo': { rua: 'Rua Augusta', num: '1524', bairro: 'Consolação' },
      'Rio de Janeiro': { rua: 'Rua da Assembleia', num: '86', bairro: 'Centro' },
      'Belo Horizonte': { rua: 'Av. Afonso Pena', num: '1901', bairro: 'Funcionários' },
      'Curitiba': { rua: 'Rua XV de Novembro', num: '700', bairro: 'Centro' },
      'Porto Alegre': { rua: 'Rua dos Andradas', num: '1234', bairro: 'Centro Histórico' },
      'Salvador': { rua: 'Av. Sete de Setembro', num: '510', bairro: 'Centro' },
      'Brasília': { rua: 'SCS Quadra 6, Bloco A', num: '130', bairro: 'Asa Sul' },
      'Fortaleza': { rua: 'Rua Barão do Rio Branco', num: '1071', bairro: 'Centro' },
      'Recife': { rua: 'Rua do Bom Jesus', num: '237', bairro: 'Recife Antigo' },
      'Manaus': { rua: 'Av. Eduardo Ribeiro', num: '520', bairro: 'Centro' },
      'Belém': { rua: 'Av. Presidente Vargas', num: '882', bairro: 'Campina' },
      'Goiânia': { rua: 'Av. Goiás', num: '1580', bairro: 'Centro' },
      'Campinas': { rua: 'Rua Barão de Jaguara', num: '1081', bairro: 'Centro' },
      'Florianópolis': { rua: 'Rua Felipe Schmidt', num: '515', bairro: 'Centro' },
      'Vitória': { rua: 'Av. Jerônimo Monteiro', num: '340', bairro: 'Centro' },
      'Natal': { rua: 'Av. Rio Branco', num: '654', bairro: 'Cidade Alta' },
      'Campo Grande': { rua: 'Rua 14 de Julho', num: '3100', bairro: 'Centro' },
      'São Luís': { rua: 'Rua Grande', num: '420', bairro: 'Centro' },
      'Maceió': { rua: 'Rua do Comércio', num: '213', bairro: 'Centro' },
      'João Pessoa': { rua: 'Av. General Osório', num: '180', bairro: 'Centro' },
      'Teresina': { rua: 'Rua Álvaro Mendes', num: '990', bairro: 'Centro' },
      'Aracaju': { rua: 'Rua João Pessoa', num: '625', bairro: 'Centro' },
      'Cuiabá': { rua: 'Av. Getúlio Vargas', num: '710', bairro: 'Centro' },
      'Londrina': { rua: 'Rua Sergipe', num: '876', bairro: 'Centro' },
      'Joinville': { rua: 'Rua do Príncipe', num: '330', bairro: 'Centro' },
      'Ribeirão Preto': { rua: 'Rua General Osório', num: '621', bairro: 'Centro' },
      'Uberlândia': { rua: 'Av. Afonso Pena', num: '1450', bairro: 'Centro' },
      'Sorocaba': { rua: 'Rua XV de Novembro', num: '412', bairro: 'Centro' },
      'Santos': { rua: 'Rua XV de Novembro', num: '195', bairro: 'Centro' },
      'Niterói': { rua: 'Rua Visconde de Uruguai', num: '302', bairro: 'Centro' },
      'Maringá': { rua: 'Av. Brasil', num: '4050', bairro: 'Zona 1' },
    }

    const match = cityStreets[userCity]
    if (match) {
      return `${match.rua}, ${match.num} - ${match.bairro}, ${userCity}${userState ? ` - ${userState}` : ''}`
    }
    // Fallback: rua genérica realista para cidades não mapeadas
    return `Rua Sete de Setembro, 315 - Centro, ${userCity}${userState ? ` - ${userState}` : ''}`
  }, [userCity, userState])

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

  // Step 3 - Delivery mode & Geolocation
  const [deliveryMode, setDeliveryMode] = useState('delivery') // 'delivery' or 'pickup'
  const [geoLoading, setGeoLoading] = useState(false)

  // Step 5 - Order submission + Pix
  const [orderPhase, setOrderPhase] = useState('idle') // 'idle' | 'loading' | 'accepted'
  const [orderNumber] = useState(() => Math.floor(8000 + Math.random() * 2000))
  const [pixLoading, setPixLoading] = useState(false)
  const [pixQrCode, setPixQrCode] = useState('')
  const [pixQrBase64, setPixQrBase64] = useState('')
  const [pixQrImageLoaded, setPixQrImageLoaded] = useState(false)
  const [pixTransactionId, setPixTransactionId] = useState(null)
  const [pixTime, setPixTime] = useState(5 * 60)
  const [pixStatus, setPixStatus] = useState('pending')
  const pixTimerRef = useRef(null)
  const pollRef = useRef(null)
  const cepDebounceRef = useRef(null)
  const footerRef = useRef(null)
  const orderPhaseTimerRef = useRef(null)

  // Acompanha o teclado virtual para manter o botão visível
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    function handleViewportChange() {
      if (footerRef.current) {
        const offsetFromBottom = window.innerHeight - (vv.offsetTop + vv.height)
        if (offsetFromBottom > 50) {
          // Teclado aberto
          footerRef.current.style.position = 'fixed'
          footerRef.current.style.bottom = `${offsetFromBottom}px`
          footerRef.current.style.left = '0'
          footerRef.current.style.right = '0'
          footerRef.current.style.zIndex = '999'
        } else {
          // Teclado fechado
          footerRef.current.style.position = ''
          footerRef.current.style.bottom = ''
          footerRef.current.style.left = ''
          footerRef.current.style.right = ''
          footerRef.current.style.zIndex = ''
        }
      }
    }

    vv.addEventListener('resize', handleViewportChange)
    vv.addEventListener('scroll', handleViewportChange)

    return () => {
      vv.removeEventListener('resize', handleViewportChange)
      vv.removeEventListener('scroll', handleViewportChange)
    }
  }, [])

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0) {
      navigate('/')
    }
  }, [cart, navigate])

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Pix countdown timer
  useEffect(() => {
    if (step === 5 && orderPhase === 'pix' && pixTransactionId) {
      setPixTime(5 * 60)
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

  // Poll payment status
  useEffect(() => {
    if (step === 5 && orderPhase === 'pix' && pixTransactionId && pixStatus === 'pending') {
      pollRef.current = setInterval(async () => {
        try {
          const result = await checkTransactionStatus(pixTransactionId)
          const statusValue = result?.status || result
          if (statusValue === 'COMPLETO' || statusValue === 'approved' || statusValue === 'paid') {
            setPixStatus('approved')
            clearInterval(pollRef.current)
            clearInterval(pixTimerRef.current)
            showToast('Pagamento confirmado!')

            clearCart()
            setTimeout(() => {
              navigate('/aprovado', { state: { transactionId: pixTransactionId, orderValue: totalPrice } })
            }, 1500)
          } else if (statusValue === 'FALHA' || statusValue === 'failed' || statusValue === 'refunded' || statusValue === 'expired') {
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pixTimerRef.current) clearInterval(pixTimerRef.current)
      if (pollRef.current) clearInterval(pollRef.current)
      if (cepDebounceRef.current) clearTimeout(cepDebounceRef.current)
      if (orderPhaseTimerRef.current) clearTimeout(orderPhaseTimerRef.current)
    }
  }, [])

  // ── CPF Lookup (Step 1) ──────────────────────────────────
  function handleCpfChange(value) {
    const masked = maskCpf(value)
    setCpf(masked)
    setCpfError('')
    setCpfFound(false)
    setCpfName('')

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
    if (deliveryMode === 'pickup') return true
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
    
    if (cepDebounceRef.current) {
      clearTimeout(cepDebounceRef.current)
    }
    
    const raw = masked.replace(/\D/g, '')
    if (raw.length === 8) {
      cepDebounceRef.current = setTimeout(() => {
        handleSearchCep(raw)
      }, 300)
    }
  }

  async function handleUseMyLocation() {
    if (!navigator.geolocation) {
      showToast('Seu navegador não suporta geolocalização')
      return
    }

    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'pt-BR' } }
          )
          const data = await response.json()

          if (data && data.address) {
            const addr = data.address
            const ruaDetected = addr.road || addr.pedestrian || addr.street || ''
            const bairroDetected = addr.suburb || addr.neighbourhood || addr.district || ''
            const cidadeDetected = addr.city || addr.town || addr.village || ''
            const ufDetected = addr.state || ''
            const cepDetected = (addr.postcode || '').replace(/\D/g, '')

            if (ruaDetected) setRua(ruaDetected)
            if (bairroDetected) setBairro(bairroDetected)
            if (cidadeDetected || ufDetected) setCidadeUf(`${cidadeDetected} - ${ufDetected}`)
            if (cepDetected) {
              const maskedCep = cepDetected.length >= 8 
                ? `${cepDetected.slice(0, 5)}-${cepDetected.slice(5, 8)}` 
                : cepDetected
              setCep(maskedCep)
            }
            setAddressVisible(true)
            showToast('Localização detectada!')
          }
        } catch {
          showToast('Não foi possível obter o endereço. Preencha manualmente.')
          setAddressVisible(true)
        } finally {
          setGeoLoading(false)
        }
      },
      (error) => {
        setGeoLoading(false)
        if (error.code === error.PERMISSION_DENIED) {
          showToast('Permissão de localização negada')
        } else {
          showToast('Não foi possível obter sua localização')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  async function generatePixPayment() {
    setPixLoading(true)
    try {
      const rawCpf = cpf.replace(/\D/g, '')
      const amountCents = Math.round(totalPrice * 100)
      const generatedEmail = `${rawCpf}@offer1.com`
      
      const result = await createPixTransaction({
        amountCents,
        customerName: nome.trim(),
        customerEmail: generatedEmail,
        customerDocument: rawCpf,
        customerPhone: telefone.replace(/\D/g, '')
      })

      if (!result.qrCode && !result.qrCodeBase64) {
        throw new Error('QR Code não foi gerado pela API PIX')
      }

      setPixQrCode(result.copyPaste || result.qrCode)
      setPixQrBase64(result.qrCodeBase64)
      setPixTransactionId(result.transactionId)
      setPixStatus('pending')

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
        paymentMethod: 'pix',
        items: cart.map(item => ({
          name: item.name,
          price: item.price,
          qty: item.qty,
          notes: item.notes || '',
          addons: item.addons || []
        })),
        totalPrice
      }).catch(() => {})
    } catch (err) {
      showToast(`Erro ao gerar Pix: ${err.message || 'Erro desconhecido'}`)
    } finally {
      setPixLoading(false)
    }
  }

  function handleSelectPix() {
    setOrderPhase('pix')
    generatePixPayment()
    window.scrollTo(0, 0)
  }

  async function handleSendOrder() {
    setStep(5)
    setOrderPhase('loading')
    window.scrollTo(0, 0)

    // Após 5 segundos, mostra o pedido aceito com opções de pagamento
    orderPhaseTimerRef.current = setTimeout(() => {
      setOrderPhase('accepted')
    }, 5000)
  }

  async function handleNext() {
    if (step === 1) {
      if (!validateStep1()) return
      setStep(2)
      window.scrollTo(0, 0)
    } else if (step === 2) {
      if (!validateStep2()) return
      setStep(3)
      window.scrollTo(0, 0)
    } else if (step === 3) {
      if (!validateStep3()) return
      setStep(4)
      window.scrollTo(0, 0)
    } else if (step === 4) {
      await handleSendOrder()
    } else if (step === 5 && orderPhase === 'accepted') {
      clearCart()
      showToast('Pedido realizado com sucesso!')
      navigate('/')
    }
  }

  function handleBack() {
    if (step > 1) {
      if (step === 5) {
        if (pixTimerRef.current) clearInterval(pixTimerRef.current)
        if (pollRef.current) clearInterval(pollRef.current)
        if (orderPhaseTimerRef.current) clearTimeout(orderPhaseTimerRef.current)
        setOrderPhase('idle')
      }
      setStep(step - 1)
      window.scrollTo(0, 0)
    } else {
      navigate(-1)
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

  function getNextButtonContent() {
    switch (step) {
      case 1:
      case 2:
      case 3:
        return <>Continuar <i className="fas fa-arrow-right"></i></>
      case 4:
        return <><i className="fas fa-paper-plane"></i> Enviar pedido para loja</>
      case 5:
        if (orderPhase === 'loading') return <><i className="fas fa-spinner fa-spin"></i> Enviando...</>
        return pixStatus === 'approved'
          ? <><i className="fas fa-check"></i> Pagamento Confirmado!</>
          : <><i className="fas fa-check"></i> Já fiz o pagamento</>
      default:
        return 'Continuar'
    }
  }

  const pixMins = Math.floor(pixTime / 60).toString().padStart(2, '0')
  const pixSecs = (pixTime % 60).toString().padStart(2, '0')

  if (cart.length === 0) return null

  return (
    <div className="app-container pgmt-page">
      <div className="pgmt-page-inner">

        {/* Header */}
        <div className="pgmt-header">
          <button className="pgmt-back-btn" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <div className="pgmt-header-logo">
            <img src="/img/logo.webp" alt="Burgz Delivery" className="pgmt-logo-img" />
            <span className="pgmt-logo-name">Burgz Delivery</span>
          </div>
        </div>

        {/* Body */}
        <div className="pgmt-body">

          {/* STEP 1: Identificação por CPF */}
          <div className={`pgmt-step ${step === 1 ? 'active' : ''}`}>
            <h2 className="pgmt-step-title"><i className="fas fa-id-card"></i> Identificação</h2>
            <p className="cpf-lookup-subtitle">Insira seu CPF para continuar</p>
            <div className="pgmt-form">
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
                  <div className="cpf-welcome-icon">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="cpf-welcome-text">
                    <span className="cpf-welcome-greeting">Bem vindo de volta, <span className="cpf-welcome-name">{cpfName.split(' ')[0]}</span>!</span>
                    <span className="cpf-welcome-message">Você já é cliente Burgz Delivery</span>
                  </div>
                </div>
              )}

              <button
                className="pgmt-next-btn step-inline-btn"
                onClick={handleNext}
                disabled={cpfLoading || cpf.replace(/\D/g, '').length !== 11}
              >
                Continuar <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>

          {/* STEP 2: Dados Pessoais */}
          <div className={`pgmt-step ${step === 2 ? 'active' : ''}`}>
            <h2 className="pgmt-step-title"><i className="fas fa-user"></i> Dados Pessoais</h2>
            <div className="pgmt-form">
              <div className="form-group">
                <label>Seu nome</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex.: Maria da Silva" autoComplete="name" />
              </div>
              <div className="form-group">
                <label>WhatsApp / Telefone</label>
                <div className="phone-input-wrapper">
                  <span className="phone-input-icon">
                    <i className="fab fa-whatsapp"></i>
                  </span>
                  <input type="tel" value={telefone} onChange={e => setTelefone(maskPhone(e.target.value))} placeholder="(99) 99999-9999" maxLength={15} autoComplete="tel" className="phone-input" />
                </div>
              </div>

              <button
                className="pgmt-next-btn step-inline-btn"
                onClick={handleNext}
              >
                Continuar <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>

          {/* STEP 3: Endereço */}
          <div className={`pgmt-step ${step === 3 ? 'active' : ''}`}>
            <h2 className="pgmt-step-title"><i className="fas fa-map-marker-alt"></i> Como deseja receber?</h2>
            <div className="pgmt-form">

              {/* Opções de entrega */}
              <div className="delivery-options">
                {/* Receber em casa */}
                <div className={`delivery-option-section ${deliveryMode === 'delivery' ? 'expanded' : ''}`}>
                  <button
                    type="button"
                    className={`delivery-option-card ${deliveryMode === 'delivery' ? 'selected' : ''}`}
                    onClick={() => setDeliveryMode('delivery')}
                  >
                    <div className="delivery-option-icon delivery-icon">
                      <i className="fas fa-motorcycle"></i>
                    </div>
                    <div className="delivery-option-info">
                      <span className="delivery-option-title">Receber em casa</span>
                      <span className="delivery-option-desc">Tele entrega grátis em {userCity}</span>
                    </div>
                    <div className={`delivery-option-radio ${deliveryMode === 'delivery' ? 'active' : ''}`}></div>
                  </button>

                  {deliveryMode === 'delivery' && (
                    <div className="delivery-option-content">
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
                  )}
                </div>

                {/* Retirar no local */}
                <div className={`delivery-option-section ${deliveryMode === 'pickup' ? 'expanded' : ''}`}>
                  <button
                    type="button"
                    className={`delivery-option-card ${deliveryMode === 'pickup' ? 'selected' : ''}`}
                    onClick={() => setDeliveryMode('pickup')}
                  >
                    <div className="delivery-option-icon pickup-icon">
                      <i className="fas fa-shopping-bag"></i>
                    </div>
                    <div className="delivery-option-info">
                      <span className="delivery-option-title">Retirar no local</span>
                      <span className="delivery-option-desc">{pickupAddress}</span>
                    </div>
                    <div className={`delivery-option-radio ${deliveryMode === 'pickup' ? 'active' : ''}`}></div>
                  </button>

                  {deliveryMode === 'pickup' && (
                    <div className="delivery-option-content">
                      <div className="pickup-confirm-info">
                        <i className="fas fa-clock"></i>
                        <span>Seu pedido estará pronto para retirada em <strong>15 a 25 min</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                className="pgmt-next-btn step-inline-btn"
                onClick={handleNext}
              >
                Continuar <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>

          {/* STEP 4: Resumo do Pedido */}
          <div className={`pgmt-step ${step === 4 ? 'active' : ''}`}>
            <h2 className="pgmt-step-title"><i className="fas fa-clipboard-list"></i> Resumo do Pedido</h2>

            {/* Itens do pedido */}
            <div className="req-review-items">
              {cart.map(item => (
                <div className="req-review-item" key={item.name}>
                  <div className="req-review-item-img">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div className="req-review-item-img-placeholder">
                        <i className="fas fa-hamburger"></i>
                      </div>
                    )}
                  </div>
                  <div className="req-review-item-details">
                    <span className="req-review-item-name">{item.qty}x {item.name}</span>
                    {item.notes && (
                      <span className="req-review-item-notes"><i className="fas fa-comment-alt"></i> {item.notes}</span>
                    )}
                    {item.addons && item.addons.length > 0 && (
                      <ul className="req-review-item-addons">
                        {item.addons.map((addon, idx) => (
                          <li key={idx}><i className="fas fa-plus-circle"></i> {addon.name}{addon.price > 0 ? ` (+${formatPrice(addon.price)})` : ''}</li>
                        ))}
                      </ul>
                    )}
                    <span className="req-review-item-price">{formatPrice(item.price * item.qty)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Entrega / Retirada */}
            <div className="req-review-section">
              <h3 className="req-review-section-title">
                <i className={deliveryMode === 'delivery' ? 'fas fa-motorcycle' : 'fas fa-shopping-bag'}></i>
                {deliveryMode === 'delivery' ? ' Entrega' : ' Retirada'}
              </h3>
              {deliveryMode === 'delivery' ? (
                <div className="req-review-delivery-info">
                  <div className="req-review-info-row">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{rua}, {numero}{complemento ? ` - ${complemento}` : ''}{bairro ? ` · ${bairro}` : ''}{cidadeUf ? ` · ${cidadeUf}` : ''}</span>
                  </div>
                  {referencia && (
                    <div className="req-review-info-row">
                      <i className="fas fa-map-signs"></i>
                      <span>{referencia}</span>
                    </div>
                  )}
                  <div className="req-review-info-row">
                    <i className="fas fa-clock"></i>
                    <span>Estimativa: <strong>20 a 30 min</strong></span>
                  </div>
                </div>
              ) : (
                <div className="req-review-delivery-info">
                  <div className="req-review-info-row">
                    <i className="fas fa-store"></i>
                    <span>{pickupAddress}</span>
                  </div>
                  <div className="req-review-info-row">
                    <i className="fas fa-clock"></i>
                    <span>Pronto em <strong>15 a 25 min</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Dados do cliente */}
            <div className="req-review-section">
              <h3 className="req-review-section-title"><i className="fas fa-user"></i> Cliente</h3>
              <div className="req-review-delivery-info">
                <div className="req-review-info-row">
                  <i className="fas fa-id-card"></i>
                  <span>{typeof nome === 'string' ? nome : ''}</span>
                </div>
                <div className="req-review-info-row">
                  <i className="fab fa-whatsapp"></i>
                  <span>{typeof telefone === 'string' ? telefone : ''}</span>
                </div>
              </div>
            </div>

            {/* Pagamento */}
            <div className="req-review-section">
              <h3 className="req-review-section-title"><i className="fas fa-wallet"></i> Pagamento</h3>
              <div className="req-review-delivery-info">
                <div className="req-review-info-row">
                  <img src="/img/pix-logo.webp" alt="Pix" style={{ width: 16, height: 16 }} />
                  <span>Pix · Aprovação instantânea</span>
                </div>
              </div>
            </div>

            {/* Totais */}
            <div className="req-review-totals">
              <div className="req-review-total-row">
                <span>Subtotal</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="req-review-total-row">
                <span>Entrega</span>
                <span className="free-text">Grátis</span>
              </div>
              <div className="req-review-total-row grand-total">
                <span>Total</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
            </div>

            <button
              className="pgmt-next-btn send-order-btn step-inline-btn"
              onClick={handleNext}
              disabled={pixLoading}
            >
              <i className="fas fa-paper-plane"></i> Enviar pedido para loja
            </button>
          </div>

          {/* STEP 5: Envio do Pedido + Pix */}
          <div className={`pgmt-step ${step === 5 ? 'active' : ''}`}>

            {/* Fase 1: Loading */}
            {orderPhase === 'loading' && (
              <div className="req-loading-screen">
                <div className="req-loading-animation">
                  <div className="req-loading-circle"></div>
                  <i className="fas fa-utensils req-loading-icon"></i>
                </div>
                <h3 className="req-loading-title">Solicitando pedido à Loja...</h3>
                <p className="req-loading-subtitle">Aguarde enquanto enviamos seu pedido para a Burgz Delivery</p>
              </div>
            )}

            {/* Fase 2: Pedido aceito + Escolha de pagamento */}
            {orderPhase === 'accepted' && (
              <div className="req-accepted-screen">
                <div className="req-accepted-header">
                  <div className="req-accepted-check">
                    <i className="fas fa-check"></i>
                  </div>
                  <h3 className="req-accepted-title">A Burgz Delivery aceitou seu pedido!</h3>
                  <div className="req-accepted-number">Pedido #{orderNumber}</div>
                  <div className="req-accepted-status">
                    <span className="req-status-dot"></span>
                    Em produção...
                  </div>
                </div>

                {/* Opções de pagamento */}
                <div className="req-pay-section">
                  <h4 className="req-pay-title"><i className="fas fa-wallet"></i> Como deseja pagar?</h4>

                  <div className="payment-options">
                    <button className="payment-option selected" onClick={handleSelectPix}>
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
                    </button>

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

                  <button
                    className="pgmt-next-btn send-order-btn step-inline-btn"
                    onClick={handleSelectPix}
                  >
                    <i className="fas fa-qrcode"></i> Pagar agora com Pix
                  </button>
                </div>
              </div>
            )}

            {/* Fase 3: Pix QR Code */}
            {orderPhase === 'pix' && (
              <div className="req-accepted-screen">
                <div className="req-accepted-header">
                  <div className="req-accepted-check">
                    <i className="fas fa-check"></i>
                  </div>
                  <h3 className="req-accepted-title">A Burgz Delivery aceitou seu pedido!</h3>
                  <div className="req-accepted-number">Pedido #{orderNumber}</div>
                  <div className="req-accepted-status">
                    <span className="req-status-dot"></span>
                    Em produção...
                  </div>
                </div>

                <div className="req-pix-section">
                  <h4 className="req-pix-title"><i className="fas fa-qrcode"></i> Pague via Pix para confirmar</h4>
                  
                  <div className="pix-qr-wrapper">
                    {pixQrBase64 ? (
                      <img 
                        src={pixQrBase64} 
                        alt="" 
                        className="pix-qr-image"
                      />
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

                <div className="req-thanks-section">
                  <i className="fas fa-heart"></i>
                  <p>Obrigado por escolher a <strong>Burgz Delivery</strong>! Seu lanche está sendo preparado com carinho.</p>
                </div>
              </div>
            )}

            {/* Pagamento aprovado (override) */}
            {pixStatus === 'approved' && orderPhase === 'pix' && (
              <div className="pix-container" style={{ marginTop: 20 }}>
                <div className="pix-success">
                  <i className="fas fa-check-circle"></i>
                  <h3>Pagamento Confirmado!</h3>
                  <p>Seu pedido foi recebido e está sendo preparado.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary (apenas no step 4 - resumo do pedido já inclui) */}
        {false && (
          <div className="pgmt-summary">
            <div className="pgmt-summary-toggle" onClick={() => setSummaryOpen(!summaryOpen)}>
              <span><i className="fas fa-receipt"></i> Resumo do pedido</span>
              <i className={`fas fa-chevron-up summary-toggle-icon ${!summaryOpen ? 'collapsed' : ''}`}></i>
            </div>
            <div className={`pgmt-summary-body ${!summaryOpen ? 'collapsed' : ''}`}>
              <div className="pgmt-summary-items">
                {cart.map(item => (
                  <div className="pgmt-summary-item" key={item.name}>
                    <span className="pgmt-summary-item-qty">{item.qty}x</span>
                    <span className="pgmt-summary-item-name">{item.name}</span>
                    <span className="pgmt-summary-item-price">{formatPrice(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="pgmt-summary-totals">
                <div className="pgmt-summary-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="pgmt-summary-row">
                  <span>Entrega</span>
                  <span className="free-text">Grátis</span>
                </div>
                <div className="pgmt-summary-row total">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  )
}
