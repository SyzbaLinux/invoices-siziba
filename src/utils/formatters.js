import { format, parseISO } from 'date-fns'

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatDate(dateString, formatStr = 'MMM dd, yyyy') {
  if (!dateString) return ''
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
    return format(date, formatStr)
  } catch (error) {
    return dateString
  }
}

export function formatPhone(phoneNumber) {
  if (!phoneNumber) return ''
  const cleaned = ('' + phoneNumber).replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3]
  }
  return phoneNumber
}

export function formatNumber(number, decimals = 2) {
  return parseFloat(number).toFixed(decimals)
}

export function formatPercentage(value) {
  return `${value}%`
}
