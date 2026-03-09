<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInvoicesStore } from '@/stores/invoices'
import { useClientsStore } from '@/stores/clients'
import { usePaymentsStore } from '@/stores/payments'
import { useSettingsStore } from '@/stores/settings'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { calculateInvoiceBalance } from '@/utils/calculations'
import { generateInvoicePDF, downloadPDF } from '@/utils/pdfGenerator'
import InvoiceStatusBadge from '@/components/invoices/InvoiceStatusBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import PaymentForm from '@/components/payments/PaymentForm.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const invoicesStore = useInvoicesStore()
const clientsStore = useClientsStore()
const paymentsStore = usePaymentsStore()
const settingsStore = useSettingsStore()

const invoice = ref(null)
const client = ref(null)
const payments = ref([])
const balance = ref(0)
const loading = ref(true)
const showPaymentModal = ref(false)
const showDeleteDialog = ref(false)
const deletingPayment = ref(null)

async function loadData() {
  const invoiceId = parseInt(route.params.id)

  await Promise.all([
    invoicesStore.loadInvoices(),
    clientsStore.loadClients(),
    paymentsStore.loadPayments(),
    settingsStore.loadSettings(),
  ])

  invoice.value = await invoicesStore.getInvoice(invoiceId)

  if (invoice.value) {
    client.value = await clientsStore.getClient(invoice.value.client_id)
    payments.value = await paymentsStore.getPaymentsByInvoice(invoiceId)
    balance.value = calculateInvoiceBalance(invoice.value, payments.value)
  }
}

onMounted(async () => {
  await loadData()
  loading.value = false
})

function handlePrint() {
  window.print()
}

async function downloadInvoicePDF() {
  try {
    const pdfBytes = await generateInvoicePDF(
      invoice.value,
      client.value,
      settingsStore.settings,
      payments.value
    )
    const filename = `${invoice.value.invoice_number}.pdf`
    downloadPDF(pdfBytes, filename)
  } catch (error) {
    console.error('Error generating PDF:', error)
    alert('Failed to generate PDF. Please try again.')
  }
}

function openPaymentModal() {
  showPaymentModal.value = true
}

function closePaymentModal() {
  showPaymentModal.value = false
}

async function handlePaymentSubmit(paymentData) {
  const id = await paymentsStore.addPayment({
    ...paymentData,
    invoice_id: invoice.value.id,
  })

  if (id) {
    await loadData()
    closePaymentModal()
  }
}

function openDeleteDialog(payment) {
  deletingPayment.value = payment
  showDeleteDialog.value = true
}

function closeDeleteDialog() {
  showDeleteDialog.value = false
  deletingPayment.value = null
}

async function confirmDeletePayment() {
  if (deletingPayment.value) {
    const success = await paymentsStore.deletePayment(deletingPayment.value.id)
    if (success) {
      await loadData()
      closeDeleteDialog()
    }
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto py-8 px-4">
    <LoadingSpinner v-if="loading" text="Loading invoice..." />

    <div v-else-if="!invoice" class="text-center py-12">
      <p class="text-gray-600">Invoice not found</p>
      <BaseButton variant="primary" class="mt-4" @click="router.push('/invoices')">
        Back to Invoices
      </BaseButton>
    </div>

    <div v-else>
      <!-- Action bar (hidden on print) -->
      <div class="no-print mb-8 flex items-center justify-between">
        <BaseButton variant="ghost" @click="router.push('/invoices')">
          ← Back to Invoices
        </BaseButton>
        <div class="flex gap-3">
          <BaseButton v-if="balance > 0" variant="primary" @click="openPaymentModal">
            Record Payment
          </BaseButton>
          <BaseButton variant="secondary" @click="downloadInvoicePDF">
            Download PDF
          </BaseButton>
          <BaseButton variant="secondary" @click="router.push(`/invoices/${invoice.id}/edit`)">
            Edit
          </BaseButton>
          <BaseButton variant="secondary" @click="handlePrint">
            Print
          </BaseButton>
        </div>
      </div>

      <!-- Invoice Preview (matches PDF layout) -->
      <div class="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-8 space-y-6">
          <!-- Header: title + invoice info left, logo right -->
          <div class="flex items-start justify-between border-b border-gray-200 pb-6">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 tracking-tight">INVOICE</h1>
              <p class="text-lg font-semibold text-gray-900 mt-2">#{{ invoice.invoice_number }}</p>
              <div class="mt-2 space-y-1 text-sm text-gray-500">
                <p>Date: <span class="text-gray-900 font-medium">{{ formatDate(invoice.date) }}</span></p>
                <p v-if="invoice.due_date">Due Date: <span class="text-gray-900 font-medium">{{ formatDate(invoice.due_date) }}</span></p>
              </div>
            </div>
            <div class="flex flex-col items-end gap-3">
              <InvoiceStatusBadge :status="invoice.status" />
              <img v-if="settingsStore.settings.logo" :src="settingsStore.settings.logo" alt="Company Logo" class="h-12 w-auto" />
            </div>
          </div>

          <!-- Addresses side-by-side -->
          <div class="grid grid-cols-2 gap-8 py-4 border-y border-gray-100">
            <div>
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">From</p>
              <div v-if="settingsStore.settings.companyName">
                <p class="font-semibold text-gray-900">{{ settingsStore.settings.companyName }}</p>
                <p v-if="settingsStore.settings.companyAddress" class="text-sm text-gray-600">{{ settingsStore.settings.companyAddress }}</p>
                <p v-if="settingsStore.settings.companyCity" class="text-sm text-gray-600">
                  {{ settingsStore.settings.companyCity }}{{ settingsStore.settings.companyState ? ', ' + settingsStore.settings.companyState : '' }} {{ settingsStore.settings.companyZip }}
                </p>
                <p v-if="settingsStore.settings.companyEmail" class="text-sm text-gray-600">{{ settingsStore.settings.companyEmail }}</p>
                <p v-if="settingsStore.settings.companyPhone" class="text-sm text-gray-600">{{ settingsStore.settings.companyPhone }}</p>
              </div>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill To</p>
              <div>
                <p class="font-semibold text-gray-900">{{ client?.name }}</p>
                <p v-if="client?.address" class="text-sm text-gray-600">{{ client.address }}</p>
                <p v-if="client?.city" class="text-sm text-gray-600">
                  {{ client.city }}{{ client.state ? ', ' + client.state : '' }} {{ client.zip }}
                </p>
                <p v-if="client?.email" class="text-sm text-gray-600">{{ client.email }}</p>
                <p v-if="client?.phone" class="text-sm text-gray-600">{{ client.phone }}</p>
              </div>
            </div>
          </div>

          <!-- Line items table -->
          <table class="min-w-full">
            <thead>
              <tr class="bg-gray-50">
                <th class="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th class="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                <th class="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Rate</th>
                <th class="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in invoice.items" :key="index" class="border-b border-gray-100">
                <td class="py-3 px-3 text-sm">{{ item.description }}</td>
                <td class="text-right py-3 px-3 text-sm">{{ item.quantity }}</td>
                <td class="text-right py-3 px-3 text-sm">{{ formatCurrency(item.rate) }}</td>
                <td class="text-right py-3 px-3 text-sm font-medium">{{ formatCurrency(item.quantity * item.rate) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Totals -->
          <div class="flex justify-end">
            <div class="w-64 space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Subtotal</span>
                <span>{{ formatCurrency(invoice.subtotal) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Tax ({{ invoice.tax_rate }}%)</span>
                <span>{{ formatCurrency(invoice.tax) }}</span>
              </div>
              <div class="flex justify-between text-lg font-bold border-t border-gray-900 pt-3 mt-2">
                <span>Total</span>
                <span>{{ formatCurrency(invoice.total) }}</span>
              </div>
              <div v-if="balance > 0" class="flex justify-between text-sm text-red-600 pt-1">
                <span>Balance Due</span>
                <span class="font-medium">{{ formatCurrency(balance) }}</span>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="invoice.notes" class="border-t pt-6">
            <h3 class="text-sm font-medium text-gray-500 mb-2">Notes</h3>
            <p class="text-gray-900 text-sm whitespace-pre-line">{{ invoice.notes }}</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-8 py-4 border-t border-gray-100 text-center">
          <p class="text-xs text-gray-400">Thank you for your business!</p>
        </div>
      </div>

      <!-- Payment History (hidden on print) -->
      <div v-if="payments.length > 0" class="mt-6 bg-white rounded-sm shadow-sm border border-gray-200 no-print">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Payment History</h3>
        </div>
        <div class="divide-y divide-gray-200">
          <div
            v-for="payment in payments"
            :key="payment.id"
            class="px-6 py-4"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">{{ formatDate(payment.date) }}</p>
                <p class="text-sm text-gray-500">{{ payment.method }} {{ payment.reference ? `- ${payment.reference}` : '' }}</p>
              </div>
              <div class="flex items-center gap-4">
                <p class="font-medium text-primary-600">{{ formatCurrency(payment.amount) }}</p>
                <button
                  @click="openDeleteDialog(payment)"
                  class="px-2.5 py-1 text-xs font-medium rounded-sm bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :show="showDeleteDialog"
      title="Delete Payment"
      :message="`Are you sure you want to delete this payment of ${deletingPayment ? formatCurrency(deletingPayment.amount) : ''}? This action cannot be undone and will update the invoice status.`"
      confirm-text="Delete"
      variant="danger"
      @confirm="confirmDeletePayment"
      @cancel="closeDeleteDialog"
      @close="closeDeleteDialog"
    />

    <BaseModal
      :show="showPaymentModal"
      title="Record Payment"
      @close="closePaymentModal"
    >
      <PaymentForm
        :max-amount="balance"
        @submit="handlePaymentSubmit"
        @cancel="closePaymentModal"
      />
    </BaseModal>
  </div>
</template>
