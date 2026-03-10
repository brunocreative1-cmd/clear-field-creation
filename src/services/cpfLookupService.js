/**
 * Consulta o nome do titular de um CPF via API.
 * Usa proxy /api-cpf para manter a chave no servidor.
 */
export async function lookupCpf(cpf) {
  const raw = cpf.replace(/\D/g, '')

  if (raw.length !== 11) {
    throw new Error('CPF deve ter 11 dígitos')
  }

  const response = await fetch(`/api-cpf/consulta?cpf=${raw}`)

  if (!response.ok) {
    throw new Error('Erro ao consultar CPF')
  }

  const json = await response.json()

  // API retorna { code: 200, data: { cpf, nome, genero, data_nascimento } }
  const info = json.data || json

  if (json.error || !info.nome) {
    throw new Error(json.message || 'CPF não encontrado')
  }

  return {
    nome: info.nome || '',
    cpf: raw
  }
}
