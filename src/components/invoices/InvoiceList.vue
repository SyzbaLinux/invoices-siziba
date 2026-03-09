<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import InvoiceStatusBadge from './InvoiceStatusBadge.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import { formatCurrency, formatDate } from '@/utils/formatters'

const props = defineProps({
  invoices: {
    type: Array,
    required: true,
  },
  clients: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['edit', 'delete', 'view', 'duplicate'])

const router = useRouter()
const filterStatus = ref('all')

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
]

const filteredInvoices = computed(() => {
  if (filterStatus.value === 'all') return props.invoices
  return props.invoices.filter((inv) => inv.status === filterStatus.value)
})

function getClientName(clientId) {
  const client = props.clients.find((c) => c.id === clientId)
  return client?.name || 'Unknown Client'
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <BaseSelect
        v-model="filterStatus"
        :options="statusOptions"
        class="max-w-xs"
      />
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Invoice #
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Client
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="filteredInvoices.length === 0">
            <td colspan="6" class="px-6 py-8 text-center text-gray-500">
              No invoices found
            </td>
          </tr>
          <tr
            v-for="invoice in filteredInvoices"
            :key="invoice.id"
            class="hover:bg-gray-50 transition-colors"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ invoice.invoice_number }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-600">{{ getClientName(invoice.client_id) }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-600">{{ formatDate(invoice.date) }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ formatCurrency(invoice.total) }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <InvoiceStatusBadge :status="invoice.status" />
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex gap-2 justify-end">
                <button
                  @click="emit('view', invoice)"
                  class="text-primary-600 hover:text-primary-900"
                >
                  View
                </button>
                <button
                  @click="emit('edit', invoice)"
                  class="text-blue-600 hover:text-blue-900"
                >
                  Edit
                </button>
                <button
                  @click="emit('duplicate', invoice)"
                  class="text-gray-600 hover:text-gray-900"
                >
                  Duplicate
                </button>
                <button
                  @click="emit('delete', invoice)"
                  class="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
