import { pdf, measureText } from 'tinypdf'
import { formatCurrency, formatDate } from './formatters'

/**
 * Right-align text: calculates x so text ends at `rightEdge`
 */
function textRight(ctx, str, rightEdge, y, size, color = '#1f2937') {
  const w = measureText(str, size)
  ctx.text(str, rightEdge - w, y, size, { color })
}

/**
 * Center text between x1 and x2
 */
function textCenter(ctx, str, x1, x2, y, size, color = '#1f2937') {
  const w = measureText(str, size)
  ctx.text(str, x1 + (x2 - x1 - w) / 2, y, size, { color })
}

/**
 * Convert any base64 image (PNG, JPG, etc.) to JPEG Uint8Array via canvas.
 * tinypdf only supports JPEG, so we must convert.
 */
function imageToJpegBytes(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const c = canvas.getContext('2d')
      // White background (for PNG transparency)
      c.fillStyle = '#ffffff'
      c.fillRect(0, 0, canvas.width, canvas.height)
      c.drawImage(img, 0, 0)
      const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92)
      const base64 = jpegDataUrl.split(',')[1]
      resolve(base64ToUint8Array(base64))
    }
    img.onerror = () => reject(new Error('Failed to load logo image'))
    img.src = dataUrl
  })
}

/**
 * Generate invoice PDF
 */
export async function generateInvoicePDF(invoice, client, settings, payments = []) {
  // Pre-convert logo to JPEG bytes
  let logoBytes = null
  if (settings.logo && settings.logo.startsWith('data:image/')) {
    try {
      logoBytes = await imageToJpegBytes(settings.logo)
    } catch (err) {
      console.warn('Could not convert logo:', err)
    }
  }

  const doc = pdf()

  doc.page((ctx) => {
    const pw = 612 // page width
    const margin = 50
    const right = pw - margin
    const cw = right - margin // content width
    let y = 742 // start from top

    // ── Header: INVOICE + info left, logo right ──
    ctx.text('INVOICE', margin, y, 28, { color: '#1f2937' })

    if (logoBytes) {
      try {
        ctx.image(logoBytes, right - 80, y - 5, 80, 35)
      } catch (err) {
        console.warn('Could not embed logo:', err)
      }
    }

    y -= 34

    ctx.text(`#${invoice.invoice_number}`, margin, y, 12, { color: '#1f2937' })
    y -= 18

    ctx.text(`Date: ${formatDate(invoice.date)}`, margin, y, 10, { color: '#6b7280' })
    y -= 14
    if (invoice.due_date) {
      ctx.text(`Due Date: ${formatDate(invoice.due_date)}`, margin, y, 10, { color: '#6b7280' })
      y -= 14
    }

    // ── Separator ──
    y -= 6
    ctx.line(margin, y, right, y, '#d1d5db', 0.75)
    y -= 18

    // ── Addresses side-by-side ──
    const midX = margin + cw / 2
    const colRight = midX + 20
    let ly = y // left column y
    let ry = y // right column y

    // FROM
    ctx.text('FROM', margin, ly, 8, { color: '#9ca3af' })
    ly -= 15
    if (settings.companyName) {
      ctx.text(settings.companyName, margin, ly, 11, { color: '#1f2937' })
      ly -= 15
    }
    if (settings.companyAddress) {
      ctx.text(settings.companyAddress, margin, ly, 9, { color: '#6b7280' })
      ly -= 13
    }
    const compCity = [settings.companyCity, settings.companyState, settings.companyZip].filter(Boolean).join(', ')
    if (compCity) {
      ctx.text(compCity, margin, ly, 9, { color: '#6b7280' })
      ly -= 13
    }
    if (settings.companyEmail) {
      ctx.text(settings.companyEmail, margin, ly, 9, { color: '#6b7280' })
      ly -= 13
    }
    if (settings.companyPhone) {
      ctx.text(settings.companyPhone, margin, ly, 9, { color: '#6b7280' })
      ly -= 13
    }

    // BILL TO
    ctx.text('BILL TO', colRight, ry, 8, { color: '#9ca3af' })
    ry -= 15
    if (client.name) {
      ctx.text(client.name, colRight, ry, 11, { color: '#1f2937' })
      ry -= 15
    }
    if (client.address) {
      ctx.text(client.address, colRight, ry, 9, { color: '#6b7280' })
      ry -= 13
    }
    const cliCity = [client.city, client.state, client.zip].filter(Boolean).join(', ')
    if (cliCity) {
      ctx.text(cliCity, colRight, ry, 9, { color: '#6b7280' })
      ry -= 13
    }
    if (client.email) {
      ctx.text(client.email, colRight, ry, 9, { color: '#6b7280' })
      ry -= 13
    }
    if (client.phone) {
      ctx.text(client.phone, colRight, ry, 9, { color: '#6b7280' })
      ry -= 13
    }

    y = Math.min(ly, ry) - 10
    ctx.line(margin, y + 5, right, y + 5, '#d1d5db', 0.75)
    y -= 5

    // ── Table columns ──
    const colDesc = margin + 8
    const colQty = right - 195
    const colRate = right - 115
    const colAmt = right - 8

    // Table header background
    const headerH = 22
    ctx.rect(margin, y - headerH, cw, headerH, '#f3f4f6')
    const headerTextY = y - headerH + 7
    ctx.text('Description', colDesc, headerTextY, 9, { color: '#6b7280' })
    textRight(ctx, 'Qty', colQty, headerTextY, 9, '#6b7280')
    textRight(ctx, 'Rate', colRate, headerTextY, 9, '#6b7280')
    textRight(ctx, 'Amount', colAmt, headerTextY, 9, '#6b7280')
    y -= headerH + 12

    // ── Line items ──
    invoice.items.forEach((item) => {
      if (y < 130) return

      const lineTotal = item.quantity * item.rate
      ctx.text(item.description || '', colDesc, y, 9, { color: '#374151' })
      textRight(ctx, String(item.quantity), colQty, y, 9, '#374151')
      textRight(ctx, formatCurrency(item.rate), colRate, y, 9, '#374151')
      textRight(ctx, formatCurrency(lineTotal), colAmt, y, 9, '#374151')
      y -= 18
    })

    // ── Separator ──
    y -= 4
    ctx.line(margin, y, right, y, '#d1d5db', 0.75)
    y -= 18

    // ── Totals ──
    const labelX = right - 155
    const valX = right - 8

    ctx.text('Subtotal', labelX, y, 9, { color: '#6b7280' })
    textRight(ctx, formatCurrency(invoice.subtotal), valX, y, 9, '#374151')
    y -= 16

    ctx.text(`Tax (${invoice.tax_rate}%)`, labelX, y, 9, { color: '#6b7280' })
    textRight(ctx, formatCurrency(invoice.tax), valX, y, 9, '#374151')
    y -= 16

    ctx.line(labelX, y + 4, right, y + 4, '#1f2937', 0.75)
    y -= 14

    ctx.text('Total', labelX, y, 13, { color: '#1f2937' })
    textRight(ctx, formatCurrency(invoice.total), valX, y, 13, '#1f2937')
    y -= 22

    // ── Balance due ──
    if (payments && payments.length > 0) {
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
      const bal = invoice.total - totalPaid

      ctx.text('Paid', labelX, y, 9, { color: '#6b7280' })
      textRight(ctx, formatCurrency(totalPaid), valX, y, 9, '#059669')
      y -= 16

      ctx.text('Balance Due', labelX, y, 11, { color: '#1f2937' })
      textRight(ctx, formatCurrency(bal), valX, y, 11, bal > 0 ? '#dc2626' : '#059669')
      y -= 24
    }

    // ── Notes ──
    if (invoice.notes && y > 80) {
      y -= 6
      ctx.text('Notes', margin, y, 10, { color: '#1f2937' })
      y -= 16
      const words = invoice.notes.split(' ')
      let line = ''
      words.forEach((word) => {
        const testLine = line + word + ' '
        if (measureText(testLine, 9) > cw && line !== '') {
          ctx.text(line.trim(), margin, y, 9, { color: '#6b7280' })
          y -= 13
          line = word + ' '
        } else {
          line = testLine
        }
      })
      if (line.trim()) {
        ctx.text(line.trim(), margin, y, 9, { color: '#6b7280' })
      }
    }

    // ── Footer ──
    ctx.line(margin, 52, right, 52, '#e5e7eb', 0.5)
    textCenter(ctx, 'Thank you for your business!', margin, right, 40, 9, '#6b7280')
  })

  return doc.build()
}

/**
 * Generate statement PDF for a client
 */
export async function generateStatementPDF(client, invoices, settings, payments = []) {
  let logoBytes = null
  if (settings.logo && settings.logo.startsWith('data:image/')) {
    try {
      logoBytes = await imageToJpegBytes(settings.logo)
    } catch (err) {
      console.warn('Could not convert logo:', err)
    }
  }

  const doc = pdf()

  doc.page((ctx) => {
    const pw = 612
    const margin = 50
    const right = pw - margin
    const cw = right - margin
    let y = 742

    // ── Header ──
    ctx.text('PAYMENT STATEMENT', margin, y, 22, { color: '#1f2937' })

    if (logoBytes) {
      try {
        ctx.image(logoBytes, right - 80, y - 5, 80, 35)
      } catch (err) {
        console.warn('Could not embed logo:', err)
      }
    }

    y -= 18
    ctx.text(formatDate(new Date().toISOString()), margin, y, 10, { color: '#6b7280' })
    y -= 14
    ctx.line(margin, y, right, y, '#d1d5db', 0.75)
    y -= 18

    // ── Addresses side-by-side ──
    const midX = margin + cw / 2
    const colRightAddr = midX + 20
    let ly = y
    let ry = y

    ctx.text('FROM', margin, ly, 8, { color: '#9ca3af' })
    ly -= 15
    if (settings.companyName) { ctx.text(settings.companyName, margin, ly, 11, { color: '#1f2937' }); ly -= 15 }
    if (settings.companyAddress) { ctx.text(settings.companyAddress, margin, ly, 9, { color: '#6b7280' }); ly -= 13 }
    const compCity = [settings.companyCity, settings.companyState, settings.companyZip].filter(Boolean).join(', ')
    if (compCity) { ctx.text(compCity, margin, ly, 9, { color: '#6b7280' }); ly -= 13 }
    if (settings.companyEmail) { ctx.text(settings.companyEmail, margin, ly, 9, { color: '#6b7280' }); ly -= 13 }
    if (settings.companyPhone) { ctx.text(settings.companyPhone, margin, ly, 9, { color: '#6b7280' }); ly -= 13 }

    ctx.text('TO', colRightAddr, ry, 8, { color: '#9ca3af' })
    ry -= 15
    if (client.name) { ctx.text(client.name, colRightAddr, ry, 11, { color: '#1f2937' }); ry -= 15 }
    if (client.address) { ctx.text(client.address, colRightAddr, ry, 9, { color: '#6b7280' }); ry -= 13 }
    const cliCity = [client.city, client.state, client.zip].filter(Boolean).join(', ')
    if (cliCity) { ctx.text(cliCity, colRightAddr, ry, 9, { color: '#6b7280' }); ry -= 13 }
    if (client.email) { ctx.text(client.email, colRightAddr, ry, 9, { color: '#6b7280' }); ry -= 13 }
    if (client.phone) { ctx.text(client.phone, colRightAddr, ry, 9, { color: '#6b7280' }); ry -= 13 }

    y = Math.min(ly, ry) - 14

    // ── Summary ──
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
    const totalPaid = payments.reduce((sum, pay) => sum + (parseFloat(pay.amount) || 0), 0)
    const balanceDue = totalInvoiced - totalPaid

    const boxH = 48
    ctx.rect(margin, y - boxH, cw, boxH, '#f9fafb')
    const col3 = cw / 3
    const sumLabelY = y - 14
    const sumValY = y - 32

    textCenter(ctx, 'Total Invoiced', margin, margin + col3, sumLabelY, 9, '#6b7280')
    textCenter(ctx, formatCurrency(totalInvoiced), margin, margin + col3, sumValY, 14, '#1f2937')
    textCenter(ctx, 'Total Paid', margin + col3, margin + col3 * 2, sumLabelY, 9, '#6b7280')
    textCenter(ctx, formatCurrency(totalPaid), margin + col3, margin + col3 * 2, sumValY, 14, '#2563eb')
    textCenter(ctx, 'Balance Due', margin + col3 * 2, right, sumLabelY, 9, '#6b7280')
    textCenter(ctx, formatCurrency(balanceDue), margin + col3 * 2, right, sumValY, 14, balanceDue > 0 ? '#dc2626' : '#059669')

    y -= boxH + 18

    // ── Invoices table ──
    ctx.text('Invoices', margin, y, 12, { color: '#1f2937' })
    y -= 20

    const hdrH = 20
    ctx.rect(margin, y - hdrH, cw, hdrH, '#f3f4f6')
    const hY = y - hdrH + 6
    ctx.text('Invoice #', margin + 5, hY, 9, { color: '#6b7280' })
    ctx.text('Date', margin + 100, hY, 9, { color: '#6b7280' })
    ctx.text('Due Date', margin + 190, hY, 9, { color: '#6b7280' })
    textRight(ctx, 'Amount', right - 80, hY, 9, '#6b7280')
    textRight(ctx, 'Status', right - 5, hY, 9, '#6b7280')
    y -= hdrH + 4

    if (invoices.length === 0) {
      ctx.text('No invoices', margin + 5, y, 9, { color: '#6b7280' })
      y -= 18
    } else {
      invoices.forEach((inv) => {
        if (y < 80) return
        ctx.text(inv.invoice_number, margin + 5, y, 9, { color: '#374151' })
        ctx.text(formatDate(inv.date), margin + 100, y, 9, { color: '#374151' })
        ctx.text(inv.due_date ? formatDate(inv.due_date) : '-', margin + 190, y, 9, { color: '#374151' })
        textRight(ctx, formatCurrency(inv.total), right - 80, y, 9, '#374151')
        const sc = inv.status === 'paid' ? '#059669' : inv.status === 'sent' ? '#3b82f6' : '#6b7280'
        textRight(ctx, inv.status, right - 5, y, 8, sc)
        y -= 18
      })
    }

    y -= 12

    // ── Payment History ──
    ctx.text('Payment History', margin, y, 12, { color: '#1f2937' })
    y -= 20

    ctx.rect(margin, y - hdrH, cw, hdrH, '#f3f4f6')
    const phY = y - hdrH + 6
    ctx.text('Date', margin + 5, phY, 9, { color: '#6b7280' })
    ctx.text('Method', margin + 100, phY, 9, { color: '#6b7280' })
    ctx.text('Reference', margin + 200, phY, 9, { color: '#6b7280' })
    textRight(ctx, 'Amount', right - 5, phY, 9, '#6b7280')
    y -= hdrH + 4

    if (payments.length === 0) {
      ctx.text('No payments', margin + 5, y, 9, { color: '#6b7280' })
      y -= 18
    } else {
      payments.forEach((p) => {
        if (y < 60) return
        ctx.text(formatDate(p.date), margin + 5, y, 9, { color: '#374151' })
        ctx.text(p.method || '-', margin + 100, y, 9, { color: '#374151' })
        ctx.text(p.reference || '-', margin + 200, y, 9, { color: '#374151' })
        textRight(ctx, formatCurrency(p.amount), right - 5, y, 9, '#2563eb')
        y -= 18
      })
    }

    // ── Footer ──
    ctx.line(margin, 52, right, 52, '#e5e7eb', 0.5)
    textCenter(ctx, 'Thank you for your business!', margin, right, 40, 9, '#6b7280')
  })

  return doc.build()
}

/**
 * Download PDF file
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
