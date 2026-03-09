<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClientsStore } from '@/stores/clients'
import { useInvoicesStore } from '@/stores/invoices'
import { usePaymentsStore } from '@/stores/payments'
import { useSettingsStore } from '@/stores/settings'
import { calculateInvoiceBalance } from '@/utils/calculations'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { generateStatementPDF, downloadPDF } from '@/utils/pdfGenerator'
import ClientCard from '@/components/clients/ClientCard.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const clientsStore = useClientsStore()
const invoicesStore = useInvoicesStore()
const paymentsStore = usePaymentsStore()
const settingsStore = useSettingsStore()

const client = ref(null)
const clientInvoices = ref([])
const loading = ref(true)

onMounted(async () => {
  const clientId = parseInt(route.params.id)

  await Promise.all([
    clientsStore.loadClients(),
    invoicesStore.loadInvoices(),
    paymentsStore.loadPayments(),
    settingsStore.loadSettings(),
  ])

  client.value = await clientsStore.getClient(clientId)
  clientInvoices.value = await invoicesStore.getInvoicesByClient(clientId)

  loading.value = false
})

const totalOutstanding = computed(() => {
  return clientInvoices.value
    .filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + (inv.total || 0), 0)
})

async function getInvoiceBalance(invoice) {
  const payments = await paymentsStore.getPaymentsByInvoice(invoice.id)
  return calculateInvoiceBalance(invoice, payments)
}

function viewInvoice(invoice) {
  router.push(`/invoices/${invoice.id}`)
}

function createInvoice() {
  router.push({
    path: '/invoices/new',
    query: { clientId: client.value.id },
  })
}

function viewStatement() {
  router.push(`/statements/${client.value.id}`)
}

async function downloadStatement() {
  try {
    const pdfBytes = await generateStatementPDF(
      client.value,
      clientInvoices.value,
      settingsStore.settings
    )
    const filename = `statement-${client.value.name.replace(/\s+/g, '-')}.pdf`
    downloadPDF(pdfBytes, filename)
  } catch (error) {
    console.error('Error generating statement PDF:', error)
    alert('Failed to generate statement. Please try again.')
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto py-8 px-4">
    <LoadingSpinner v-if="loading" text="Loading client details..." />

    <div v-else-if="!client" class="text-center py-12">
      <p class="text-gray-600">Client not found</p>
      <BaseButton variant="primary" class="mt-4" @click="router.push('/clients')">
        Back to Clients
      </BaseButton>
    </div>

    <div v-else class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <BaseButton variant="ghost" @click="router.push('/clients')" class="mb-2">
            ← Back to Clients
          </BaseButton>
          <h1 class="text-3xl font-bold text-gray-900">{{ client.name }}</h1>
        </div>
        <div class="flex gap-3">
          <BaseButton variant="secondary" @click="downloadStatement">
            Download Statement
          </BaseButton>
          <BaseButton variant="secondary" @click="viewStatement">
            View Statement
          </BaseButton>
          <BaseButton variant="primary" @click="createInvoice">
            Create Invoice
          </BaseButton>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ClientCard :client="client" />

        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-gray-500">Total Invoices</label>
                <p class="text-2xl font-bold text-gray-900">{{ clientInvoices.length }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500">Outstanding Balance</label>
                <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(totalOutstanding) }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-sm shadow-sm border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900">Invoices</h3>
            </div>
            <div v-if="clientInvoices.length === 0" class="px-6 py-8 text-center text-gray-500">
              No invoices found
            </div>
            <div v-else class="divide-y divide-gray-200">
              <div
                v-for="invoice in clientInvoices"
                :key="invoice.id"
                class="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                @click="viewInvoice(invoice)"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium text-gray-900">{{ invoice.invoice_number }}</p>
                    <p class="text-sm text-gray-500">{{ formatDate(invoice.date) }}</p>
                  </div>
                  <div class="text-right">
                    <p class="font-medium text-gray-900">{{ formatCurrency(invoice.total) }}</p>
                    <span
                      :class="[
                        'inline-block px-2 py-1 text-xs rounded-sm',
                        invoice.status === 'paid' ? 'bg-primary-100 text-primary-800' :
                        invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                        invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      ]"
                    >
                      {{ invoice.status }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
