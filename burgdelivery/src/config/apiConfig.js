/**
 * Configuração centralizada de APIs
 * Nunca exponha URLs diretas no cliente
 * Use /api/* como proxy do backend
 */

// Em produção, use /api/** como proxy
// Em desenvolvimento, use as URLs internamente

const API_CONFIG = {
  // IP Location - via proxy backend
  locationProxy: '/api/location',
  
  // CEP Lookup - via proxy backend
  cepProxy: '/api/cep',
  
  // IBGE - via proxy backend  
  ibgeProxy: '/api/ibge',
  
  // QR Code - via proxy backend
  qrProxy: '/api/qr',
  
  // CPF Lookup - via proxy backend
  cpfProxy: '/api-cpf',
  
  // PIX - via proxy backend
  pixProxy: '/api-pix',
}

export default API_CONFIG
