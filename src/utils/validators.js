export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function validatePhone(phone) {
  const cleaned = ('' + phone).replace(/\D/g, '')
  return cleaned.length === 10
}

export function validateRequired(value) {
  return value !== null && value !== undefined && value !== ''
}

export function validateNumber(value) {
  return !isNaN(parseFloat(value)) && isFinite(value)
}

export function validatePositiveNumber(value) {
  return validateNumber(value) && parseFloat(value) >= 0
}

export function validateDate(dateString) {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date)
}

export function validateInvoiceNumber(invoiceNumber) {
  return validateRequired(invoiceNumber) && invoiceNumber.length > 0
}
