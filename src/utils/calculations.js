export function calculateLineTotal(quantity, rate) {
  return parseFloat(quantity || 0) * parseFloat(rate || 0)
}

export function calculateSubtotal(items) {
  if (!items || !Array.isArray(items)) return 0
  return items.reduce((sum, item) => {
    return sum + calculateLineTotal(item.quantity, item.rate)
  }, 0)
}

export function calculateTax(subtotal, taxRate) {
  return (parseFloat(subtotal || 0) * parseFloat(taxRate || 0)) / 100
}

export function calculateTotal(subtotal, tax) {
  return parseFloat(subtotal || 0) + parseFloat(tax || 0)
}

export function calculateInvoiceTotals(items, taxRate = 0) {
  const subtotal = calculateSubtotal(items)
  const tax = calculateTax(subtotal, taxRate)
  const total = calculateTotal(subtotal, tax)

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  }
}

export function calculateAmountPaid(payments) {
  if (!payments || !Array.isArray(payments)) return 0
  return payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0)
}

export function calculateBalance(total, amountPaid) {
  return parseFloat(total || 0) - parseFloat(amountPaid || 0)
}

export function calculateInvoiceBalance(invoice, payments) {
  const total = invoice.total || 0
  const paid = calculateAmountPaid(payments)
  return calculateBalance(total, paid)
}
