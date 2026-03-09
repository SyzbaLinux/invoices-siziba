import { pdf, measureText } from 'tinypdf'
import { formatCurrency, formatDate } from './formatters'

/**
 * Generate invoice PDF
 * @param {Object} invoice - Invoice data
 * @param {Object} client - Client data
 * @param {Object} settings - Company settings
 * @param {Array} payments - Payment records
 * @returns {Uint8Array} PDF bytes
 */
export function generateInvoicePDF(invoice, client, settings, payments = []) {
  const doc = pdf()

  doc.page((ctx) => {
    const pageWidth = 612
    const pageHeight = 792
    const margin = 50
    let y = pageHeight - 50 // Start from top

    // Company logo (if available and base64)
    if (settings.logo && settings.logo.startsWith('data:image/jpeg;base64,')) {
      try {
        const base64Data = settings.logo.split(',')[1]
        const logoBytes = base64ToUint8Array(base64Data)
        ctx.image(logoBytes, margin, y - 60, 100, 50)
      } catch (err) {
        console.warn('Could not load logo:', err)
      }
    }

    // Company info (top right)
    y -= 10
    if (settings.companyName) {
      ctx.text(settings.companyName, pageWidth - margin, y, 14, { align: 'right', color: '#1f2937' })
      y -= 16
    }
    if (settings.companyEmail) {
      ctx.text(settings.companyEmail, pageWidth - margin, y, 10, { align: 'right', color: '#6b7280' })
      y -= 14
    }
    if (settings.companyPhone) {
      ctx.text(settings.companyPhone, pageWidth - margin, y, 10, { align: 'right', color: '#6b7280' })
      y -= 14
    }
    if (settings.companyAddress) {
      ctx.text(settings.companyAddress, pageWidth - margin, y, 10, { align: 'right', color: '#6b7280' })
      y -= 14
    }
    const cityLine = [settings.companyCity, settings.companyState, settings.companyZip]
      .filter(Boolean)
      .join(', ')
    if (cityLine) {
      ctx.text(cityLine, pageWidth - margin, y, 10, { align: 'right', color: '#6b7280' })
      y -= 20
    }

    // Invoice title
    y -= 30
    ctx.text('INVOICE', margin, y, 32, { color: '#2563eb' })
    y -= 40

    // Invoice number and details
    ctx.text(`Invoice #: ${invoice.invoice_number}`, margin, y, 11, { color: '#1f2937' })
    y -= 18
    ctx.text(`Date: ${formatDate(invoice.date)}`, margin, y, 11, { color: '#6b7280' })
    y -= 18
    if (invoice.due_date) {
      ctx.text(`Due Date: ${formatDate(invoice.due_date)}`, margin, y, 11, { color: '#6b7280' })
      y -= 18
    }
    if (invoice.payment_terms) {
      ctx.text(`Terms: ${invoice.payment_terms}`, margin, y, 11, { color: '#6b7280' })
      y -= 30
    }

    // Bill To section
    ctx.text('Bill To:', margin, y, 12, { color: '#1f2937' })
    y -= 20
    if (client.name) {
      ctx.text(client.name, margin, y, 11, { color: '#1f2937' })
      y -= 16
    }
    if (client.email) {
      ctx.text(client.email, margin, y, 10, { color: '#6b7280' })
      y -= 14
    }
    if (client.phone) {
      ctx.text(client.phone, margin, y, 10, { color: '#6b7280' })
      y -= 14
    }
    if (client.address) {
      ctx.text(client.address, margin, y, 10, { color: '#6b7280' })
      y -= 14
    }
    const clientCity = [client.city, client.state, client.zip].filter(Boolean).join(', ')
    if (clientCity) {
      ctx.text(clientCity, margin, y, 10, { color: '#6b7280' })
      y -= 30
    }

    // Line items table header
    const tableTop = y
    ctx.rect(margin, y - 2, pageWidth - 2 * margin, 20, '#f3f4f6')
    ctx.text('Description', margin + 5, y + 12, 10, { color: '#1f2937' })
    ctx.text('Qty', pageWidth - margin - 250, y + 12, 10, { color: '#1f2937', align: 'right' })
    ctx.text('Rate', pageWidth - margin - 170, y + 12, 10, { color: '#1f2937', align: 'right' })
    ctx.text('Amount', pageWidth - margin - 5, y + 12, 10, { color: '#1f2937', align: 'right' })
    y -= 25

    // Line items
    invoice.items.forEach((item, index) => {
      const lineTotal = item.quantity * item.rate

      // Check if we need a new page
      if (y < 150) {
        doc.page((newCtx) => {
          y = pageHeight - 50
          drawLineItem(newCtx, item, lineTotal)
        })
      } else {
        drawLineItem(ctx, item, lineTotal)
      }

      function drawLineItem(context, lineItem, total) {
        context.text(lineItem.description, margin + 5, y, 10, {
          color: '#374151',
          width: 280
        })
        context.text(String(lineItem.quantity), pageWidth - margin - 250, y, 10, {
          color: '#374151',
          align: 'right'
        })
        context.text(formatCurrency(lineItem.rate), pageWidth - margin - 170, y, 10, {
          color: '#374151',
          align: 'right'
        })
        context.text(formatCurrency(total), pageWidth - margin - 5, y, 10, {
          color: '#374151',
          align: 'right'
        })
        y -= 20
      }
    })

    // Separator line
    y -= 10
    ctx.line(margin, y, pageWidth - margin, y, '#e5e7eb', 1)
    y -= 25

    // Totals section
    const totalsX = pageWidth - margin - 150
    ctx.text('Subtotal:', totalsX, y, 10, { color: '#6b7280' })
    ctx.text(formatCurrency(invoice.subtotal), pageWidth - margin - 5, y, 10, {
      color: '#1f2937',
      align: 'right'
    })
    y -= 18

    ctx.text(`Tax (${invoice.tax_rate}%):`, totalsX, y, 10, { color: '#6b7280' })
    ctx.text(formatCurrency(invoice.tax), pageWidth - margin - 5, y, 10, {
      color: '#1f2937',
      align: 'right'
    })
    y -= 18

    // Total line
    ctx.line(totalsX, y + 5, pageWidth - margin, y + 5, '#1f2937', 1)
    y -= 10

    ctx.text('Total:', totalsX, y, 14, { color: '#1f2937' })
    ctx.text(formatCurrency(invoice.total), pageWidth - margin - 5, y, 14, {
      color: '#2563eb',
      align: 'right'
    })
    y -= 25

    // Balance due (if there are payments)
    if (payments && payments.length > 0) {
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
      const balance = invoice.total - totalPaid

      ctx.text('Paid:', totalsX, y, 10, { color: '#6b7280' })
      ctx.text(formatCurrency(totalPaid), pageWidth - margin - 5, y, 10, {
        color: '#059669',
        align: 'right'
      })
      y -= 18

      ctx.text('Balance Due:', totalsX, y, 11, { color: '#1f2937' })
      ctx.text(formatCurrency(balance), pageWidth - margin - 5, y, 11, {
        color: balance > 0 ? '#dc2626' : '#059669',
        align: 'right'
      })
      y -= 30
    }

    // Notes
    if (invoice.notes) {
      y -= 20
      ctx.text('Notes:', margin, y, 11, { color: '#1f2937' })
      y -= 18

      // Word wrap notes
      const words = invoice.notes.split(' ')
      let line = ''
      words.forEach(word => {
        const testLine = line + word + ' '
        const width = measureText(testLine, 10)
        if (width > pageWidth - 2 * margin && line !== '') {
          ctx.text(line, margin, y, 10, { color: '#6b7280' })
          y -= 14
          line = word + ' '
        } else {
          line = testLine
        }
      })
      if (line) {
        ctx.text(line, margin, y, 10, { color: '#6b7280' })
      }
    }

    // Footer
    const footerY = 40
    ctx.line(margin, footerY + 10, pageWidth - margin, footerY + 10, '#e5e7eb', 1)
    ctx.text('Thank you for your business!', pageWidth / 2, footerY, 10, {
      color: '#6b7280',
      align: 'center'
    })
  })

  return doc.build()
}

/**
 * Generate statement PDF for a client
 * @param {Object} client - Client data
 * @param {Array} invoices - Client's invoices
 * @param {Object} settings - Company settings
 * @param {Array} payments - Payment records
 * @returns {Uint8Array} PDF bytes
 */
export function generateStatementPDF(client, invoices, settings, payments = []) {
  const doc = pdf()

  doc.page((ctx) => {
    const pageWidth = 612
    const pageHeight = 792
    const margin = 50
    let y = pageHeight - 50

    // Company logo (top right, if available)
    if (settings.logo && settings.logo.startsWith('data:image/jpeg;base64,')) {
      try {
        const base64Data = settings.logo.split(',')[1]
        const logoBytes = base64ToUint8Array(base64Data)
        ctx.image(logoBytes, pageWidth - margin - 100, y - 40, 100, 40)
      } catch (err) {
        console.warn('Could not load logo:', err)
      }
    }

    // Company info (top right)
    let companyY = y - 50
    if (settings.companyName) {
      ctx.text(settings.companyName, pageWidth - margin, companyY, 12, { align: 'right', color: '#1f2937' })
      companyY -= 14
    }
    if (settings.companyEmail) {
      ctx.text(settings.companyEmail, pageWidth - margin, companyY, 10, { align: 'right', color: '#6b7280' })
      companyY -= 12
    }
    if (settings.companyPhone) {
      ctx.text(settings.companyPhone, pageWidth - margin, companyY, 10, { align: 'right', color: '#6b7280' })
    }

    // Header - Title
    ctx.text('Account Statement', margin, y, 28, { color: '#1f2937' })
    y -= 25
    ctx.text(formatDate(new Date().toISOString()), margin, y, 11, { color: '#6b7280' })
    y -= 40

    // Client info
    ctx.text('Client:', margin, y, 10, { color: '#6b7280' })
    y -= 18
    ctx.text(client.name, margin, y, 14, { color: '#1f2937' })
    y -= 18
    if (client.email) {
      ctx.text(client.email, margin, y, 10, { color: '#374151' })
      y -= 14
    }
    if (client.phone) {
      ctx.text(client.phone, margin, y, 10, { color: '#374151' })
      y -= 14
    }
    if (client.address) {
      ctx.text(client.address, margin, y, 10, { color: '#374151' })
      y -= 14
    }
    const clientCity = [client.city, client.state, client.zip].filter(Boolean).join(', ')
    if (clientCity) {
      ctx.text(clientCity, margin, y, 10, { color: '#374151' })
      y -= 14
    }
    y -= 20

    // Summary section
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
    const totalPaid = payments.reduce((sum, pay) => sum + (parseFloat(pay.amount) || 0), 0)
    const balanceDue = totalInvoiced - totalPaid

    ctx.rect(margin, y - 50, pageWidth - 2 * margin, 55, '#f9fafb')

    const colWidth = (pageWidth - 2 * margin) / 3
    const summaryY = y - 15

    // Total Invoiced
    ctx.text('Total Invoiced', margin + colWidth / 2, summaryY, 10, { color: '#6b7280', align: 'center' })
    ctx.text(formatCurrency(totalInvoiced), margin + colWidth / 2, summaryY - 18, 16, { color: '#1f2937', align: 'center' })

    // Total Paid
    ctx.text('Total Paid', margin + colWidth + colWidth / 2, summaryY, 10, { color: '#6b7280', align: 'center' })
    ctx.text(formatCurrency(totalPaid), margin + colWidth + colWidth / 2, summaryY - 18, 16, { color: '#2563eb', align: 'center' })

    // Balance Due
    ctx.text('Balance Due', margin + 2 * colWidth + colWidth / 2, summaryY, 10, { color: '#6b7280', align: 'center' })
    ctx.text(formatCurrency(balanceDue), margin + 2 * colWidth + colWidth / 2, summaryY - 18, 16, { color: '#dc2626', align: 'center' })

    y -= 70

    // Invoices section
    ctx.text('Invoices', margin, y, 14, { color: '#1f2937' })
    y -= 25

    // Table header
    ctx.rect(margin, y - 2, pageWidth - 2 * margin, 20, '#f3f4f6')
    ctx.text('Invoice #', margin + 5, y + 12, 10, { color: '#6b7280' })
    ctx.text('Date', margin + 100, y + 12, 10, { color: '#6b7280' })
    ctx.text('Due Date', margin + 190, y + 12, 10, { color: '#6b7280' })
    ctx.text('Amount', pageWidth - margin - 100, y + 12, 10, { color: '#6b7280', align: 'right' })
    ctx.text('Status', pageWidth - margin - 5, y + 12, 10, { color: '#6b7280', align: 'right' })
    y -= 25

    // Invoice rows
    if (invoices.length === 0) {
      ctx.text('No invoices', margin + 5, y, 10, { color: '#6b7280' })
      y -= 20
    } else {
      invoices.forEach((invoice) => {
        ctx.text(invoice.invoice_number, margin + 5, y, 10, { color: '#374151' })
        ctx.text(formatDate(invoice.date), margin + 100, y, 10, { color: '#374151' })
        ctx.text(invoice.due_date ? formatDate(invoice.due_date) : '-', margin + 190, y, 10, {
          color: '#374151'
        })
        ctx.text(formatCurrency(invoice.total), pageWidth - margin - 100, y, 10, {
          color: '#374151',
          align: 'right'
        })

        const statusColor = invoice.status === 'paid' ? '#059669' :
                           invoice.status === 'sent' ? '#3b82f6' : '#6b7280'
        ctx.text(invoice.status, pageWidth - margin - 5, y, 9, {
          color: statusColor,
          align: 'right'
        })
        y -= 20
      })
    }

    y -= 15

    // Payment History section
    ctx.text('Payment History', margin, y, 14, { color: '#1f2937' })
    y -= 25

    // Payment table header
    ctx.rect(margin, y - 2, pageWidth - 2 * margin, 20, '#f3f4f6')
    ctx.text('Date', margin + 5, y + 12, 10, { color: '#6b7280' })
    ctx.text('Method', margin + 100, y + 12, 10, { color: '#6b7280' })
    ctx.text('Reference', margin + 200, y + 12, 10, { color: '#6b7280' })
    ctx.text('Amount', pageWidth - margin - 5, y + 12, 10, { color: '#6b7280', align: 'right' })
    y -= 25

    // Payment rows
    if (payments.length === 0) {
      ctx.text('No payments', margin + 5, y, 10, { color: '#6b7280' })
      y -= 20
    } else {
      payments.forEach((payment) => {
        ctx.text(formatDate(payment.date), margin + 5, y, 10, { color: '#374151' })
        ctx.text(payment.method || '-', margin + 100, y, 10, { color: '#374151' })
        ctx.text(payment.reference || '-', margin + 200, y, 10, { color: '#374151' })
        ctx.text(formatCurrency(payment.amount), pageWidth - margin - 5, y, 10, {
          color: '#2563eb',
          align: 'right'
        })
        y -= 20
      })
    }

    // Footer
    const footerY = 40
    ctx.line(margin, footerY + 10, pageWidth - margin, footerY + 10, '#e5e7eb', 1)
    ctx.text('Thank you for your business!', pageWidth / 2, footerY, 10, {
      color: '#6b7280',
      align: 'center'
    })
  })

  return doc.build()
}

/**
 * Download PDF file
 * @param {Uint8Array} pdfBytes - PDF data
 * @param {string} filename - Filename for download
 */
export function downloadPDF(pdfBytes, filename) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Convert base64 to Uint8Array
 * @param {string} base64 - Base64 string
 * @returns {Uint8Array}
 */
function base64ToUint8Array(base64) {
  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}
