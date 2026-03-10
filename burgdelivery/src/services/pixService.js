/**
 * 🔒 Serviço de Pagamentos PIX via FortPay
 * Integração com API FortPay via proxy servidor (evita CORS)
 */

// Sempre usa o proxy do servidor (evita CORS em produção)
// Dev: Express server em localhost:3001/api-pix
// Prod: Express server no mesmo domínio /api-pix
const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api-pix' : '/api-pix'

function generateReference() {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).substring(2, 10)
  return `BURGZ-${ts}-${rand}`
}

/**
 * Cria uma transação Pix na FortPay
 * @param {Object} params
 * @param {number} params.amountCents - Valor em centavos
 * @param {string} params.customerName
 * @param {string} params.customerEmail
 * @param {string} params.customerDocument - CPF apenas números
 * @param {string} params.customerPhone - Telefone apenas números
 * @param {string} [params.customerStreet] - Logradouro
 * @param {string} [params.customerNumber] - Número
 * @param {string} [params.customerComplement] - Complemento
 * @param {string} [params.customerNeighborhood] - Bairro
 * @param {string} [params.customerCity] - Cidade
 * @param {string} [params.customerState] - UF (ex: SP)
 * @param {string} [params.customerZip] - CEP apenas números
 * @returns {Promise<Object>} - { transactionId, qrCode, qrCodeBase64, expiresAt, reference }
 */
export async function createPixTransaction({
  amountCents,
  customerName,
  customerEmail,
  customerDocument,
  customerPhone,
  customerStreet,
  customerNumber,
  customerComplement,
  customerNeighborhood,
  customerCity,
  customerState,
  customerZip
}) {
  const reference = generateReference()

  const body = {
    amountCents,
    customerName,
    customerEmail,
    customerDocument,
    customerPhone,
    customerStreet,
    customerNumber,
    customerComplement,
    customerNeighborhood,
    customerCity,
    customerState,
    customerZip
  }

  try {
    // Timeout de 15 segundos
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(`${API_BASE}/transaction.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('Resposta não é JSON:', text)
      throw new Error('Resposta inválida da API PIX')
    }

    const data = await response.json()

    console.log('[PIX API] Resposta completa:', data)

    if (data.status !== 'success' && !data.qr_code) {
      throw new Error(data.message || 'Erro ao criar transação Pix')
    }

    // A API pode retornar qr_code_base64 ou qr_code_image (URL)
    let qrCodeBase64 = data.qr_code_base64 || data.qrCodeBase64 || ''
    const qrCodeImage = data.qr_code_image || data.qrCodeImage || ''
    const qrCodeText = data.qr_code || data.qrCode || ''

    console.log('[PIX API] QR Code Base64:', qrCodeBase64 ? 'SIM' : 'NÃO')
    console.log('[PIX API] QR Code Image URL:', qrCodeImage || 'NÃO')

    // Se não tem base64, tenta gerar usando o servidor interno
    if (!qrCodeBase64 && qrCodeText) {
      try {
        const qrUrl = `/api/qr?text=${encodeURIComponent(qrCodeText)}&size=250x250`
        const qrResp = await fetch(qrUrl)
        if (qrResp.ok) {
          const blob = await qrResp.blob()
          qrCodeBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
          console.log('[PIX API] QR Code gerado via /api/qr:', 'SIM')
        }
      } catch (err) {
        console.warn('[PIX API] Não foi possível gerar QR Code:', err.message)
      }
    }

    return {
      transactionId: data.transaction_id || data.transactionId || reference,
      qrCode: data.qr_code || data.qrCode || '',
      qrCodeBase64,
      qrCodeImage,
      copyPaste: data.qr_code || data.qrCode || '', // Para copy/paste
      expiresAt: data.expires_at || data.expiresAt || new Date(Date.now() + 3600000).toISOString(),
      reference,
      status: 'PENDENTE',
      amount: amountCents,
      amountInReais: amountCents / 100
    }
  } catch (error) {
    console.error('[PIX API] Erro ao criar transação:', error.message)
    throw error
  }
}

/**
 * Busca uma imagem e converte para Base64
 * @param {string} imageUrl - URL da imagem
 * @returns {Promise<string>} - Base64 da imagem
 */
async function fetchImageAsBase64(imageUrl) {
  const response = await fetch(imageUrl)
  if (!response.ok) throw new Error(`Erro ao buscar imagem: ${response.status}`)

  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Consulta o status de uma transação PIX
 * @param {string} transactionId - ID da transação
 * @returns {Promise<Object>} - { status, amount, reference, createdAt, paidAt }
 */
export async function checkTransactionStatus(transactionId) {
  try {
    const response = await fetch(`${API_BASE}/transaction/${transactionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`)
    }

    const data = await response.json()
    console.log(`[PIX API] Status de ${transactionId}:`, data.status)

    // O proxy já normaliza o status para 'COMPLETO' / 'PENDENTE' / 'FALHA'
    // Mas mantemos compatibilidade caso a resposta venha direta da FortPay
    const rawStatus = data.status || ''
    let status = rawStatus
    if (rawStatus === 'paid')                             status = 'COMPLETO'
    else if (rawStatus === 'pending')                     status = 'PENDENTE'
    else if (rawStatus === 'canceled' ||
             rawStatus === 'expired'  ||
             rawStatus === 'refunded' ||
             rawStatus === 'failed')                      status = 'FALHA'
    // Se já veio normalizado ('COMPLETO', 'PENDENTE', 'FALHA'), mantém

    return {
      transactionId: data.transaction_id || transactionId,
      status,
      amount: data.amount,
      reference: data.reference,
      createdAt: data.created_at,
      paidAt: data.paid_at,
      expiresAt: data.expires_at
    }
  } catch (error) {
    console.error('[PIX API] Erro ao verificar status:', error.message)
    throw error
  }
}

/**
 * Consulta com polling - Aguarda o pagamento ser confirmado
 * @param {string} transactionId - ID da transação
 * @param {number} maxAttempts - Número máximo de tentativas (padrão: 12 = 2 minutos)
 * @param {number} intervalMs - Intervalo entre tentativas em ms (padrão: 10000 = 10 segundos)
 * @returns {Promise<Object>} - Status final ou timeout
 */
export async function waitForPayment(transactionId, maxAttempts = 12, intervalMs = 10000) {
  let attempts = 0

  return new Promise((resolve, reject) => {
    const checkPayment = async () => {
      attempts++
      console.log(`[PIX API] Verificando pagamento... Tentativa ${attempts}/${maxAttempts}`)

      try {
        const status = await checkTransactionStatus(transactionId)

        if (status.status === 'COMPLETO') {
          console.log('[PIX API] ✅ Pagamento confirmado!')
          resolve(status)
          return
        }

        if (status.status === 'FALHA') {
          console.log('[PIX API] ❌ Pagamento falhou')
          reject(new Error('Pagamento foi rejeitado'))
          return
        }

        // Status: PENDENTE - continuar aguardando
        if (attempts < maxAttempts) {
          setTimeout(checkPayment, intervalMs)
        } else {
          console.log('[PIX API] ⏱️ Timeout - Pagamento não confirmado dentro do tempo limite')
          resolve({
            ...status,
            timeout: true,
            message: 'Pagamento ainda está pendente. Você pode verificar o status posteriormente.'
          })
        }
      } catch (error) {
        console.error('[PIX API] Erro ao verificar:', error.message)
        reject(error)
      }
    }

    checkPayment()
  })
}

