<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePaymentsStore } from '@/stores/payments'
import { useInvoicesStore } from '@/stores/invoices'
import { formatCurrency, formatDate } from '@/utils/formatters'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import PaymentForm from '@/components/payments/PaymentForm.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const paymentsStore = usePaymentsStore()
const invoicesStore = useInvoicesStore()

const showPaymentModal = ref(false)
const selectedInvoiceId = ref('')
const selectedInvoice = ref(null)
const editingPayment = ref(null)
const modalTitle = ref('Add Payment')

// Delete confirmation
const showDeleteConfirm = ref(false)
const paymentToDelete = ref(null)

onMounted(async () => {
  await Promise.all([
    paymentsStore.loadPayments(),
    invoicesStore.loadInvoices(),
  ])
})

function getInvoiceNumber(invoiceId) {
  const invoice = invoicesStore.invoices.find((inv) => inv.id === invoiceId)
  return invoice?.invoice_number || 'Unknown'
}

function getInvoice(invoiceId) {
  return invoicesStore.invoices.find((inv) => inv.id === invoiceId)
}

const unpaidInvoices = computed(() => {
  return invoicesStore.invoices
    .filter(inv => inv.status !== 'paid')
    .map(inv => ({
      value: inv.id,
      label: `${inv.invoice_number} - ${formatCurrency(inv.total)}`
    }))
})

const allInvoices = computed(() => {
  return invoicesStore.invoices.map(inv => ({
    value: inv.id,
    label: `${inv.invoice_number} - ${formatCurrency(inv.total)}`
  }))
})

function openAddPaymentModal() {
  editingPayment.value = null
  selectedInvoiceId.value = ''
  selectedInvoice.value = null
  modalTitle.value = 'Add Payment'
  showPaymentModal.value = true
}

function openEditPaymentModal(payment) {
  editingPayment.value = { ...payment }
  selectedInvoiceId.value = payment.invoice_id
  selectedInvoice.value = getInvoice(payment.invoice_id)
  modalTitle.value = 'Edit Payment'
  showPaymentModal.value = true
}

function closePaymentModal() {
  showPaymentModal.value = false
  selectedInvoiceId.value = ''
  selectedInvoice.value = null
  editingPayment.value = null
}

function handleInvoiceSelect() {
  if (selectedInvoiceId.value) {
    selectedInvoice.value = invoicesStore.invoices.find(inv => inv.id === parseInt(selectedInvoiceId.value))
  }
}

async function handlePaymentSubmit(paymentData) {
  if (!selectedInvoiceId.value) {
    return
  }

  if (editingPayment.value) {
    // Update existing payment
    const success = await paymentsStore.updatePayment(editingPayment.value.id, {
      ...paymentData,
      invoice_id: parseInt(selectedInvoiceId.value),
    })

    if (success) {
      await paymentsStore.loadPayments()
      closePaymentModal()
    }
  } else {
    // Add new payment
    const id = await paymentsStore.addPayment({
      ...paymentData,
      invoice_id: parseInt(selectedInvoiceId.value),
    })

    if (id) {
      await paymentsStore.loadPayments()
      closePaymentModal()
    }
  }
}

function confirmDeletePayment(payment) {
  paymentToDelete.value = payment
  showDeleteConfirm.value = true
}

async function handleDeletePayment() {
  if (paymentToDelete.value) {
    const success = await paymentsStore.deletePayment(paymentToDelete.value.id)
    if (success) {
      await paymentsStore.loadPayments()
    }
  }
  showDeleteConfirm.value = false
  paymentToDelete.value = null
}

function cancelDelete() {
  showDeleteConfirm.value = false
  paymentToDelete.value = null
}
</script>

<template>
  <div class="max-w-7xl mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Payments</h1>
        <p class="mt-2 text-gray-600">View and manage all payment records</p>
      </div>
      <BaseButton variant="primary" @click="openAddPaymentModal">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Payment
      </BaseButton>
    </div>

    <LoadingSpinner v-if="paymentsStore.loading && paymentsStore.payments.length === 0" text="Loading payments..." />

    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="paymentsStore.payments.length === 0">
            <td colspan="6" class="px-6 py-8 text-center text-gray-500">No payments found</td>
          </tr>
          <tr v-for="payment in paymentsStore.payments" :key="payment.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              {{ formatDate(payment.date) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ getInvoiceNumber(payment.invoice_id) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {{ payment.method }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              {{ payment.reference || '—' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600 text-right">
              {{ formatCurrency(payment.amount) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
              <div class="flex items-center justify-end gap-2">
                <button
                  @click="openEditPaymentModal(payment)"
                  class="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit payment"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click="confirmDeletePayment(payment)"
                  class="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete payment"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Payment Modal -->
    <BaseModal
      :show="showPaymentModal"
      :title="modalTitle"
      @close="closePaymentModal"
    >
      <div class="space-y-4">
        <BaseSelect
          v-model="selectedInvoiceId"
          label="Select Invoice"
          :options="editingPayment ? allInvoices : unpaidInvoices"
          placeholder="Choose an invoice"
          required
          :disabled="!!editingPayment"
          @update:model-value="handleInvoiceSelect"
        />

        <div v-if="selectedInvoice" class="bg-gray-50 rounded-lg p-4">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Invoice Total:</span>
            <span class="font-medium">{{ formatCurrency(selectedInvoice.total) }}</span>
          </div>
        </div>

        <PaymentForm
          v-if="selectedInvoice"
          :payment="editingPayment"
          :max-amount="editingPayment ? 0 : selectedInvoice.total"
          @submit="handlePaymentSubmit"
          @cancel="closePaymentModal"
        />
      </div>
    </BaseModal>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      :show="showDeleteConfirm"
      title="Delete Payment"
      :message="`Are you sure you want to delete this payment of ${paymentToDelete ? formatCurrency(paymentToDelete.amount) : ''}? This action cannot be undone and will update the invoice status.`"
      confirm-text="Delete"
      variant="danger"
      @confirm="handleDeletePayment"
      @cancel="cancelDelete"
      @close="cancelDelete"
    />
  </div>
</template>
