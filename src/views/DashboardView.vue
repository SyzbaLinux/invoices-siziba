<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useClientsStore } from '@/stores/clients'
import { useInvoicesStore } from '@/stores/invoices'
import { usePaymentsStore } from '@/stores/payments'
import { formatCurrency, formatDate } from '@/utils/formatters'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const router = useRouter()
const clientsStore = useClientsStore()
const invoicesStore = useInvoicesStore()
const paymentsStore = usePaymentsStore()

const loading = ref(true)

onMounted(async () => {
  await Promise.all([
    clientsStore.loadClients(),
    invoicesStore.loadInvoices(),
    paymentsStore.loadPayments(),
  ])
  loading.value = false
})

const stats = computed(() => [
  {
    label: 'Total Clients',
    value: clientsStore.clientsCount,
    color: 'primary',
  },
  {
    label: 'Total Invoices',
    value: invoicesStore.invoicesCount,
    color: 'blue',
  },
  {
    label: 'Total Revenue',
    value: formatCurrency(invoicesStore.totalRevenue),
    color: 'green',
  },
  {
    label: 'Outstanding',
    value: formatCurrency(invoicesStore.totalOutstanding),
    color: 'orange',
  },
])

const recentInvoices = computed(() => invoicesStore.invoices.slice(0, 5))
const recentPayments = computed(() => paymentsStore.recentPayments)

function getClientName(clientId) {
  const client = clientsStore.clients.find((c) => c.id === clientId)
  return client?.name || 'Unknown'
}

function getInvoiceNumber(invoiceId) {
  const invoice = invoicesStore.invoices.find((inv) => inv.id === invoiceId)
  return invoice?.invoice_number || 'Unknown'
}
</script>

<template>
  <div class="max-w-7xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p class="mt-2 text-gray-600">Welcome to Invoice Manager</p>
    </div>

    <LoadingSpinner v-if="loading" text="Loading dashboard..." />

    <div v-else class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <p class="text-sm font-medium text-gray-500">{{ stat.label }}</p>
          <p class="mt-2 text-3xl font-bold text-gray-900">{{ stat.value }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Recent Invoices</h3>
            <BaseButton variant="ghost" size="sm" @click="router.push('/invoices')">
              View All
            </BaseButton>
          </div>
          <div v-if="recentInvoices.length === 0" class="px-6 py-8 text-center text-gray-500">
            No invoices yet
          </div>
          <div v-else class="divide-y divide-gray-200">
            <div
              v-for="invoice in recentInvoices"
              :key="invoice.id"
              class="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
              @click="router.push(`/invoices/${invoice.id}`)"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-gray-900">{{ invoice.invoice_number }}</p>
                  <p class="text-sm text-gray-500">{{ getClientName(invoice.client_id) }}</p>
                </div>
                <div class="text-right">
                  <p class="font-medium text-gray-900">{{ formatCurrency(invoice.total) }}</p>
                  <p class="text-sm text-gray-500">{{ formatDate(invoice.date) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Recent Payments</h3>
            <BaseButton variant="ghost" size="sm" @click="router.push('/payments')">
              View All
            </BaseButton>
          </div>
          <div v-if="recentPayments.length === 0" class="px-6 py-8 text-center text-gray-500">
            No payments yet
          </div>
          <div v-else class="divide-y divide-gray-200">
            <div
              v-for="payment in recentPayments"
              :key="payment.id"
              class="px-6 py-4"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-gray-900">{{ getInvoiceNumber(payment.invoice_id) }}</p>
                  <p class="text-sm text-gray-500">{{ payment.method }}</p>
                </div>
                <div class="text-right">
                  <p class="font-medium text-primary-600">{{ formatCurrency(payment.amount) }}</p>
                  <p class="text-sm text-gray-500">{{ formatDate(payment.date) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-4">
        <BaseButton variant="primary" @click="router.push('/invoices/new')">
          Create Invoice
        </BaseButton>
        <BaseButton variant="secondary" @click="router.push('/clients')">
          Manage Clients
        </BaseButton>
      </div>
    </div>
  </div>
</template>
