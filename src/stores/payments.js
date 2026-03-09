import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as db from '@/services/db'
import { calculateAmountPaid, calculateBalance } from '@/utils/calculations'
import { useInvoicesStore } from './invoices'

export const usePaymentsStore = defineStore('payments', () => {
  const payments = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function loadPayments() {
    loading.value = true
    error.value = null
    try {
      payments.value = await db.getAllRecords('payments')
      // Sort by date descending
      payments.value.sort((a, b) => new Date(b.date) - new Date(a.date))
    } catch (err) {
      error.value = err.message
      console.error('Error loading payments:', err)
    } finally {
      loading.value = false
    }
  }

  async function getPayment(id) {
    try {
      return await db.getRecord('payments', parseInt(id))
    } catch (err) {
      error.value = err.message
      console.error('Error getting payment:', err)
      return null
    }
  }

  async function getPaymentsByInvoice(invoiceId) {
    try {
      return await db.getByIndex('payments', 'invoice_id', parseInt(invoiceId))
    } catch (err) {
      error.value = err.message
      console.error('Error getting payments by invoice:', err)
      return []
    }
  }

  async function addPayment(paymentData) {
    loading.value = true
    error.value = null
    try {
      const payment = {
        ...paymentData,
        date: paymentData.date || new Date().toISOString(),
        created_at: new Date().toISOString(),
      }

      const id = await db.addRecord('payments', payment)

      // Update invoice status if fully paid
      const invoicesStore = useInvoicesStore()
      const invoice = await invoicesStore.getInvoice(paymentData.invoice_id)

      if (invoice) {
        const allPayments = await getPaymentsByInvoice(paymentData.invoice_id)
        const totalPaid = calculateAmountPaid(allPayments)
        const balance = calculateBalance(invoice.total, totalPaid)

        if (balance <= 0.01) {
          // Fully paid (allowing for small rounding errors)
          await invoicesStore.updateInvoiceStatus(paymentData.invoice_id, 'paid')
        } else if (totalPaid > 0 && invoice.status === 'draft') {
          // Partial payment, update from draft
          await invoicesStore.updateInvoiceStatus(paymentData.invoice_id, 'sent')
        }
      }

      await loadPayments()
      return id
    } catch (err) {
      error.value = err.message
      console.error('Error adding payment:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function updatePayment(id, paymentData) {
    loading.value = true
    error.value = null
    try {
      const payment = {
        id,
        ...paymentData,
        updated_at: new Date().toISOString(),
      }

      await db.updateRecord('payments', payment)

      // Recalculate invoice status
      const invoicesStore = useInvoicesStore()
      const invoice = await invoicesStore.getInvoice(paymentData.invoice_id)

      if (invoice) {
        const allPayments = await getPaymentsByInvoice(paymentData.invoice_id)
        const totalPaid = calculateAmountPaid(allPayments)
        const balance = calculateBalance(invoice.total, totalPaid)

        if (balance <= 0.01) {
          await invoicesStore.updateInvoiceStatus(paymentData.invoice_id, 'paid')
        } else if (invoice.status === 'paid') {
          await invoicesStore.updateInvoiceStatus(paymentData.invoice_id, 'sent')
        }
      }

      await loadPayments()
      return true
    } catch (err) {
      error.value = err.message
      console.error('Error updating payment:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function deletePayment(id) {
    loading.value = true
    error.value = null
    try {
      const payment = await getPayment(id)
      if (!payment) {
        error.value = 'Payment not found'
        return false
      }

      await db.deleteRecord('payments', parseInt(id))

      // Recalculate invoice status
      const invoicesStore = useInvoicesStore()
      const invoice = await invoicesStore.getInvoice(payment.invoice_id)

      if (invoice) {
        const allPayments = await getPaymentsByInvoice(payment.invoice_id)
        const totalPaid = calculateAmountPaid(allPayments)
        const balance = calculateBalance(invoice.total, totalPaid)

        if (balance > 0.01 && invoice.status === 'paid') {
          await invoicesStore.updateInvoiceStatus(payment.invoice_id, 'sent')
        }
      }

      await loadPayments()
      return true
    } catch (err) {
      error.value = err.message
      console.error('Error deleting payment:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  function filterPayments({ invoiceId, dateFrom, dateTo, method }) {
    let filtered = [...payments.value]

    if (invoiceId) {
      filtered = filtered.filter((pay) => pay.invoice_id === parseInt(invoiceId))
    }

    if (dateFrom) {
      filtered = filtered.filter((pay) => new Date(pay.date) >= new Date(dateFrom))
    }

    if (dateTo) {
      filtered = filtered.filter((pay) => new Date(pay.date) <= new Date(dateTo))
    }

    if (method && method !== 'all') {
      filtered = filtered.filter((pay) => pay.method === method)
    }

    return filtered
  }

  const paymentsCount = computed(() => payments.value.length)

  const totalPayments = computed(() =>
    payments.value.reduce((sum, pay) => sum + (parseFloat(pay.amount) || 0), 0)
  )

  const recentPayments = computed(() => payments.value.slice(0, 5))

  return {
    payments,
    loading,
    error,
    loadPayments,
    getPayment,
    getPaymentsByInvoice,
    addPayment,
    updatePayment,
    deletePayment,
    filterPayments,
    paymentsCount,
    totalPayments,
    recentPayments,
  }
})
