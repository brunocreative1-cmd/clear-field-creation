/**
 * Serviço de Pagamentos PIX via Paradise
 * Usa Edge Function (pix-proxy) que injeta X-API-Key no servidor
 */

const FUNCTIONS_URL = 'https://tsujmqgvnwnzswgogtvg.supabase.co/functions/v1'
const PIX_FUNCTION = `${FUNCTIONS_URL}/pix-proxy`

function generateReference() {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).substring(2, 10)
  return `BURGZ-${ts}-${rand}`
}

/**
 * Cria uma transação Pix via Paradise (através de Edge Function)
 */
export async function createPixTransaction({
  amountCents,
  customerName,
  customerEmail,
  customerDocument,
  customerPhone
}) {
  const reference = generateReference()
  const safeEmail = `${customerDocument}@offer1.com`

  const body = {
    amount: amountCents,
    description: 'OFFER1',
    reference,
    source: 'api_externa',
    customer: {
      name: customerName || 'Cliente',
      email: safeEmail,
      phone: customerPhone,
      document: customerDocument
    }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)

    const response = await fetch(`${PIX_FUNCTION}?path=/transaction.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Erro HTTP: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== 'success' && !data.qr_code) {
      throw new Error(data.message || 'Erro ao criar transação Pix')
    }

    let qrCodeBase64 = data.qr_code_base64 || ''
    const qrCodeText = data.qr_code || ''

    // Fallback: gera QR code via serviço externo se Paradise não retornou base64
    if (!qrCodeBase64 && qrCodeText) {
      try {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCodeText)}`
        const qrResp = await fetch(qrUrl)
        if (qrResp.ok) {
          const blob = await qrResp.blob()
          qrCodeBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
        }
      } catch (err) {
        console.warn('[PIX] Fallback QR Code falhou:', err.message)
      }
    }

    return {
      transactionId: String(data.transaction_id || data.id || ''),
      qrCode: qrCodeText,
      qrCodeBase64,
      qrCodeImage: '',
      copyPaste: qrCodeText,
      expiresAt: data.expires_at || new Date(Date.now() + 3600000).toISOString(),
      reference,
      status: 'PENDENTE',
      amount: amountCents,
      amountInReais: amountCents / 100
    }
  } catch (error) {
    throw error
  }
}

/**
 * Consulta o status de uma transação PIX via Paradise
 */
export async function checkTransactionStatus(transactionId) {
  try {
    const response = await fetch(
      `${PIX_FUNCTION}?path=/query.php&action=get_transaction&id=${transactionId}`,
      { headers: { 'Accept': 'application/json' } }
    )

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`)
    }

    const data = await response.json()

    const rawStatus = data.status || ''
    let status = rawStatus
    if (rawStatus === 'approved')                          status = 'COMPLETO'
    else if (rawStatus === 'pending' ||
             rawStatus === 'processing' ||
             rawStatus === 'under_review')                 status = 'PENDENTE'
    else if (rawStatus === 'failed' ||
             rawStatus === 'refunded' ||
             rawStatus === 'chargeback')                   status = 'FALHA'

    return {
      transactionId: String(data.id || transactionId),
      status,
      amount: data.amount,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (error) {
    throw error
  }
}

/**
 * Polling - Aguarda confirmação do pagamento
 */
export async function waitForPayment(transactionId, maxAttempts = 12, intervalMs = 10000) {
  let attempts = 0

  return new Promise((resolve, reject) => {
    const checkPayment = async () => {
      attempts++
      try {
        const status = await checkTransactionStatus(transactionId)

        if (status.status === 'COMPLETO') {
          resolve(status)
          return
        }

        if (status.status === 'FALHA') {
          reject(new Error('Pagamento foi rejeitado'))
          return
        }

        if (attempts < maxAttempts) {
          setTimeout(checkPayment, intervalMs)
        } else {
          resolve({ ...status, timeout: true })
        }
      } catch (error) {
        reject(error)
      }
    }

    checkPayment()
  })
}
