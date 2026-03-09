<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useInvoicesStore } from '@/stores/invoices'
import { useClientsStore } from '@/stores/clients'
import { useSettingsStore } from '@/stores/settings'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import InvoiceLineItems from '@/components/invoices/InvoiceLineItems.vue'
import { calculateInvoiceTotals } from '@/utils/calculations'
import { formatCurrency } from '@/utils/formatters'

const router = useRouter()
const route = useRoute()
const invoicesStore = useInvoicesStore()
const clientsStore = useClientsStore()
const settingsStore = useSettingsStore()

const formData = ref({
  client_id: '',
  invoice_number: '',
  date: new Date().toISOString().split('T')[0],
  due_date: '',
  payment_terms: '',
  tax_rate: 0,
  items: [{ description: '', quantity: 1, rate: 0 }],
  notes: '',
  status: 'draft',
})

const saving = ref(false)

onMounted(async () => {
  await Promise.all([
    clientsStore.loadClients(),
    settingsStore.loadSettings(),
  ])

  // Generate invoice number
  formData.value.invoice_number = await invoicesStore.generateInvoiceNumber(
    settingsStore.settings.invoicePrefix || 'INV'
  )

  // Set defaults
  formData.value.tax_rate = settingsStore.settings.defaultTaxRate || 0
  formData.value.payment_terms = settingsStore.settings.defaultPaymentTerms || 'Net 30'

  // Pre-select client if coming from client view
  if (route.query.clientId) {
    formData.value.client_id = parseInt(route.query.clientId)
  }
})

const clientOptions = computed(() => {
  return clientsStore.clients.map((client) => ({
    value: client.id,
    label: client.name,
  }))
})

const totals = computed(() => {
  return calculateInvoiceTotals(formData.value.items, formData.value.tax_rate)
})

async function handleSubmit() {
  saving.value = true

  const invoiceData = {
    ...formData.value,
    client_id: parseInt(formData.value.client_id),
    tax_rate: parseFloat(formData.value.tax_rate),
  }

  const id = await invoicesStore.addInvoice(invoiceData)

  if (id) {
    router.push(`/invoices/${id}`)
  }

  saving.value = false
}
</script>

<template>
  <div class="max-w-5xl mx-auto py-8 px-4">
    <div class="mb-8">
      <BaseButton variant="ghost" @click="router.push('/invoices')" class="mb-2">
        ← Back to Invoices
      </BaseButton>
      <h1 class="text-3xl font-bold text-gray-900">Create Invoice</h1>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="bg-white rounded-sm shadow-sm border border-gray-200 p-6 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseSelect
            v-model="formData.client_id"
            label="Client"
            :options="clientOptions"
            required
          />

          <BaseInput
            v-model="formData.invoice_number"
            label="Invoice Number"
            required
          />

          <BaseInput
            v-model="formData.date"
            label="Invoice Date"
            type="date"
            required
          />

          <BaseInput
            v-model="formData.due_date"
            label="Due Date"
            type="date"
          />

          <BaseInput
            v-model="formData.payment_terms"
            label="Payment Terms"
          />

          <BaseInput
            v-model="formData.tax_rate"
            label="Tax Rate (%)"
            type="number"
            min="0"
            max="100"
            step="0.01"
          />
        </div>
      </div>

      <div class="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
        <InvoiceLineItems :items="formData.items" @update:items="formData.items = $event" />
      </div>

      <div class="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
        <div class="max-w-md ml-auto space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Subtotal:</span>
            <span class="font-medium">{{ formatCurrency(totals.subtotal) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Tax ({{ formData.tax_rate }}%):</span>
            <span class="font-medium">{{ formatCurrency(totals.tax) }}</span>
          </div>
          <div class="flex justify-between text-lg font-bold border-t pt-3">
            <span>Total:</span>
            <span>{{ formatCurrency(totals.total) }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
        <textarea
          v-model="formData.notes"
          rows="4"
          class="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Additional notes or payment instructions..."
        ></textarea>
      </div>

      <div class="flex gap-3 justify-end">
        <BaseButton variant="secondary" type="button" @click="router.push('/invoices')">
          Cancel
        </BaseButton>
        <BaseButton variant="primary" type="submit" :disabled="saving">
          {{ saving ? 'Creating...' : 'Create Invoice' }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>
