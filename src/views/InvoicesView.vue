<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useInvoicesStore } from '@/stores/invoices'
import { useClientsStore } from '@/stores/clients'
import InvoiceList from '@/components/invoices/InvoiceList.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const router = useRouter()
const invoicesStore = useInvoicesStore()
const clientsStore = useClientsStore()

const showDeleteDialog = ref(false)
const deletingInvoice = ref(null)

onMounted(async () => {
  await Promise.all([
    invoicesStore.loadInvoices(),
    clientsStore.loadClients(),
  ])
})

function viewInvoice(invoice) {
  router.push(`/invoices/${invoice.id}`)
}

function editInvoice(invoice) {
  router.push(`/invoices/${invoice.id}/edit`)
}

function openDeleteDialog(invoice) {
  deletingInvoice.value = invoice
  showDeleteDialog.value = true
}

function closeDeleteDialog() {
  showDeleteDialog.value = false
  deletingInvoice.value = null
}

async function confirmDelete() {
  if (deletingInvoice.value) {
    const success = await invoicesStore.deleteInvoice(deletingInvoice.value.id)
    if (success) {
      closeDeleteDialog()
    }
  }
}

async function duplicateInvoice(invoice) {
  const newId = await invoicesStore.duplicateInvoice(invoice.id)
  if (newId) {
    router.push(`/invoices/${newId}/edit`)
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Invoices</h1>
        <p class="mt-2 text-gray-600">Manage your invoices</p>
      </div>
      <BaseButton variant="primary" @click="router.push('/invoices/new')">
        Create Invoice
      </BaseButton>
    </div>

    <LoadingSpinner v-if="invoicesStore.loading && invoicesStore.invoices.length === 0" text="Loading invoices..." />

    <div v-else-if="invoicesStore.error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-sm text-red-800">{{ invoicesStore.error }}</p>
    </div>

    <InvoiceList
      v-else
      :invoices="invoicesStore.invoices"
      :clients="clientsStore.clients"
      @view="viewInvoice"
      @edit="editInvoice"
      @delete="openDeleteDialog"
      @duplicate="duplicateInvoice"
    />

    <ConfirmDialog
      :show="showDeleteDialog"
      title="Delete Invoice"
      :message="`Are you sure you want to delete invoice ${deletingInvoice?.invoice_number}? This will also delete all associated payments.`"
      confirm-text="Delete"
      variant="danger"
      @confirm="confirmDelete"
      @cancel="closeDeleteDialog"
      @close="closeDeleteDialog"
    />
  </div>
</template>
