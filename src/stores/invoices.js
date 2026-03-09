import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { format } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import * as db from '@/services/db'
import { calculateInvoiceTotals } from '@/utils/calculations'

export const useInvoicesStore = defineStore('invoices', () => {
  const invoices = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function loadInvoices() {
    loading.value = true
    error.value = null
    try {
      invoices.value = await db.getAllRecords('invoices')
      // Sort by date descending
      invoices.value.sort((a, b) => new Date(b.date) - new Date(a.date))
    } catch (err) {
      error.value = err.message
      console.error('Error loading invoices:', err)
    } finally {
      loading.value = false
    }
  }

  async function getInvoice(id) {
    try {
      return await db.getRecord('invoices', parseInt(id))
    } catch (err) {
      error.value = err.message
      console.error('Error getting invoice:', err)
      return null
    }
  }

  async function getInvoicesByClient(clientId) {
    try {
      return await db.getByIndex('invoices', 'client_id', parseInt(clientId))
    } catch (err) {
      error.value = err.message
      console.error('Error getting invoices by client:', err)
      return []
    }
  }

  async function generateInvoiceNumber(prefix = 'INV') {
    const year = new Date().getFullYear()
    const allInvoices = await db.getAllRecords('invoices')

    // Filter invoices for current year
    const yearInvoices = allInvoices.filter((inv) =>
      inv.invoice_number?.startsWith(`${prefix}-${year}`)
    )

    const nextNumber = yearInvoices.length + 1
    return `${prefix}-${year}-${String(nextNumber).padStart(3, '0')}`
  }

  async function addInvoice(invoiceData) {
    loading.value = true
    error.value = null
    try {
      // Sanitize items to ensure numeric values
      const sanitizedItems = invoiceData.items.map(item => ({
        description: String(item.description || ''),
        quantity: Number(item.quantity) || 0,
        rate: Number(item.rate) || 0,
      }))

      // Calculate totals
      const totals = calculateInvoiceTotals(sanitizedItems, invoiceData.tax_rate || 0)

      const invoice = {
        client_id: invoiceData.client_id,
        invoice_number: invoiceData.invoice_number,
        date: invoiceData.date || new Date().toISOString(),
        due_date: invoiceData.due_date || '',
        payment_terms: invoiceData.payment_terms || '',
        tax_rate: Number(invoiceData.tax_rate) || 0,
        items: sanitizedItems,
        notes: invoiceData.notes || '',
        status: invoiceData.status || 'draft',
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        created_at: new Date().toISOString(),
      }

      console.log('Saving invoice to DB:', invoice)
      const id = await db.addRecord('invoices', invoice)
      await loadInvoices()
      return id
    } catch (err) {
      error.value = err.message
      console.error('Error adding invoice:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateInvoice(id, invoiceData) {
    loading.value = true
    error.value = null
    try {
      // Sanitize items to ensure plain objects with numeric values
      const sanitizedItems = (invoiceData.items || []).map(item => ({
        description: String(item.description || ''),
        quantity: Number(item.quantity) || 0,
        rate: Number(item.rate) || 0,
      }))

      // Calculate totals
      const totals = calculateInvoiceTotals(sanitizedItems, invoiceData.tax_rate || 0)

      const invoice = {
        id,
        client_id: Number(invoiceData.client_id),
        invoice_number: String(invoiceData.invoice_number || ''),
        date: invoiceData.date || '',
        due_date: invoiceData.due_date || '',
        payment_terms: String(invoiceData.payment_terms || ''),
        tax_rate: Number(invoiceData.tax_rate) || 0,
        items: sanitizedItems,
        notes: String(invoiceData.notes || ''),
        status: invoiceData.status || 'draft',
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        created_at: invoiceData.created_at,
        updated_at: new Date().toISOString(),
      }

      await db.updateRecord('invoices', invoice)
      await loadInvoices()
      return true
    } catch (err) {
      error.value = err.message
      console.error('Error updating invoice:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteInvoice(id) {
    loading.value = true
    error.value = null
    try {
      // Delete associated payments
      const payments = await db.getByIndex('payments', 'invoice_id', parseInt(id))
      for (const payment of payments) {
        await db.deleteRecord('payments', payment.id)
      }

      await db.deleteRecord('invoices', parseInt(id))
      await loadInvoices()
      return true
    } catch (err) {
      error.value = err.message
      console.error('Error deleting invoice:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateInvoiceStatus(id, status) {
    try {
      const invoice = await getInvoice(id)
      if (invoice) {
        invoice.status = status
        await db.updateRecord('invoices', invoice)
        await loadInvoices()
        return true
      }
      return false
    } catch (err) {
      error.value = err.message
      console.error('Error updating invoice status:', err)
      return false
    }
  }

  async function duplicateInvoice(id) {
    loading.value = true
    error.value = null
    try {
      const original = await getInvoice(id)
      if (!original) {
        error.value = 'Invoice not found'
        return null
      }

      const duplicate = {
        ...original,
        invoice_number: await generateInvoiceNumber(original.invoice_number?.split('-')[0] || 'INV'),
        date: new Date().toISOString(),
        status: 'draft',
        created_at: new Date().toISOString(),
      }

      delete duplicate.id
      delete duplicate.updated_at

      const newId = await db.addRecord('invoices', duplicate)
      await loadInvoices()
      return newId
    } catch (err) {
      error.value = err.message
      console.error('Error duplicating invoice:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  function filterInvoices({ status, clientId, dateFrom, dateTo }) {
    let filtered = [...invoices.value]

    if (status && status !== 'all') {
      filtered = filtered.filter((inv) => inv.status === status)
    }

    if (clientId) {
      filtered = filtered.filter((inv) => inv.client_id === parseInt(clientId))
    }

    if (dateFrom) {
      filtered = filtered.filter((inv) => new Date(inv.date) >= new Date(dateFrom))
    }

    if (dateTo) {
      filtered = filtered.filter((inv) => new Date(inv.date) <= new Date(dateTo))
    }

    return filtered
  }

  const invoicesCount = computed(() => invoices.value.length)
  const draftInvoices = computed(() => invoices.value.filter((inv) => inv.status === 'draft'))
  const paidInvoices = computed(() => invoices.value.filter((inv) => inv.status === 'paid'))
  const unpaidInvoices = computed(() => invoices.value.filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled'))
  const overdueInvoices = computed(() => {
    const today = new Date()
    return invoices.value.filter(
      (inv) =>
        inv.status !== 'paid' &&
        inv.status !== 'cancelled' &&
        inv.due_date &&
        new Date(inv.due_date) < today
    )
  })

  const totalRevenue = computed(() =>
    paidInvoices.value.reduce((sum, inv) => sum + (inv.total || 0), 0)
  )

  const totalOutstanding = computed(() =>
    unpaidInvoices.value.reduce((sum, inv) => sum + (inv.total || 0), 0)
  )

  return {
    invoices,
    loading,
    error,
    loadInvoices,
    getInvoice,
    getInvoicesByClient,
    generateInvoiceNumber,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    updateInvoiceStatus,
    duplicateInvoice,
    filterInvoices,
    invoicesCount,
    draftInvoices,
    paidInvoices,
    unpaidInvoices,
    overdueInvoices,
    totalRevenue,
    totalOutstanding,
  }
})
