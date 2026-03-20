/**
 * Brasil API and Document Validation Utilities
 */

export const validateCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/[^\d]+/g, "")
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false
  
  const digits = cpf.split("").map((el) => +el)
  const rest = (count: number) =>
    ((digits
      .slice(0, count - 12)
      .reduce((soma, el, index) => soma + el * (count - index), 0) * 10) % 11) % 10

  return rest(10) === digits[9] && rest(11) === digits[10]
}

export const validateCNPJ = (cnpj: string): boolean => {
  cnpj = cnpj.replace(/[^\d]+/g, "")
  if (cnpj.length !== 14 || !!cnpj.match(/(\d)\1{13}/)) return false

  const size = cnpj.length - 2
  const numbers = cnpj.substring(0, size)
  const digits = cnpj.substring(size)
  let sum = 0
  let pos = size - 7
  for (let i = size; i >= 1; i--) {
    sum += +numbers.charAt(size - i) * pos--
    if (pos < 2) pos = 9
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== +digits.charAt(0)) return false

  const newSize = size + 1
  const newNumbers = cnpj.substring(0, newSize)
  sum = 0
  pos = newSize - 7
  for (let i = newSize; i >= 1; i--) {
    sum += +newNumbers.charAt(newSize - i) * pos--
    if (pos < 2) pos = 9
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  return result === +digits.charAt(1)
}

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePlaca = (placa: string): boolean => {
  const mercosul = /^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/
  const normal = /^[A-Z]{3}[0-9]{4}$/
  const cleanPlaca = placa.replace("-", "").toUpperCase()
  return mercosul.test(cleanPlaca) || normal.test(cleanPlaca)
}

export const formatPlaca = (value: string) => {
  const clean = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
  if (clean.length <= 7) return clean
  return clean.slice(0, 7)
}

export const fetchCEP = async (cep: string) => {
  const cleanCEP = cep.replace(/\D/g, "")
  if (cleanCEP.length !== 8) return null
  
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCEP}`)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error("Brasil API CEP Error:", error)
    return null
  }
}

export const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1")
}

export const formatCNPJ = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1")
}

export const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, "")
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
  }
  return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
}

export const formatCEP = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{3})\d+?$/, "$1")
}
