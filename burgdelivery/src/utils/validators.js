// ===== VALIDAR CPF (algoritmo oficial) =====
export function validateCpf(cpf) {
  cpf = cpf.replace(/\D/g, '')

  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(cpf.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(cpf.charAt(10))) return false

  return true
}

// ===== MÁSCARA TELEFONE =====
export function maskPhone(value) {
  let v = value.replace(/\D/g, '')
  if (v.length > 11) v = v.substring(0, 11)

  if (v.length > 6) {
    v = '(' + v.substring(0, 2) + ') ' + v.substring(2, 7) + '-' + v.substring(7)
  } else if (v.length > 2) {
    v = '(' + v.substring(0, 2) + ') ' + v.substring(2)
  } else if (v.length > 0) {
    v = '(' + v
  }

  return v
}

// ===== MÁSCARA CPF =====
export function maskCpf(value) {
  let v = value.replace(/\D/g, '')
  if (v.length > 11) v = v.substring(0, 11)

  if (v.length > 9) {
    v = v.substring(0, 3) + '.' + v.substring(3, 6) + '.' + v.substring(6, 9) + '-' + v.substring(9)
  } else if (v.length > 6) {
    v = v.substring(0, 3) + '.' + v.substring(3, 6) + '.' + v.substring(6)
  } else if (v.length > 3) {
    v = v.substring(0, 3) + '.' + v.substring(3)
  }

  return v
}

// ===== MÁSCARA CEP =====
export function maskCep(value) {
  let v = value.replace(/\D/g, '')
  if (v.length > 5) {
    v = v.substring(0, 5) + '-' + v.substring(5, 8)
  }
  return v
}
