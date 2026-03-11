const FUNCTIONS_URL = 'https://tsujmqgvnwnzswgogtvg.supabase.co/functions/v1'

export async function lookupCpf(cpf) {
  const raw = cpf.replace(/\D/g, '')

  if (raw.length !== 11) {
    throw new Error('CPF deve ter 11 dígitos')
  }

  const response = await fetch(`${FUNCTIONS_URL}/cpf-lookup?cpf=${raw}`)
  const json = await response.json()

  // 404 = CPF não encontrado na base (válido mas sem dados)
  if (response.status === 404) {
    throw new Error(json.message || 'CPF não encontrado')
  }

  if (!response.ok) {
    throw new Error(json.message || json.error || 'Erro ao consultar CPF')
  }

  // API retorna { code: 200, data: { cpf, nome, genero, data_nascimento } }
  // ou direto: { nome, cpf, ... }
  const info = json.data || json

  if (!info.nome) {
    throw new Error('CPF não encontrado')
  }

  return {
    nome: info.nome || '',
    cpf: raw
  }
}
