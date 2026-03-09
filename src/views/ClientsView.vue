<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useClientsStore } from '@/stores/clients'
import ClientList from '@/components/clients/ClientList.vue'
import ClientForm from '@/components/clients/ClientForm.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const router = useRouter()
const clientsStore = useClientsStore()

const showModal = ref(false)
const showDeleteDialog = ref(false)
const editingClient = ref(null)
const deletingClient = ref(null)

onMounted(async () => {
  await clientsStore.loadClients()
})

function openAddModal() {
  editingClient.value = null
  showModal.value = true
}

function openEditModal(client) {
  editingClient.value = { ...client }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingClient.value = null
}

async function handleSubmit(clientData) {
  let success = false

  if (editingClient.value?.id) {
    success = await clientsStore.updateClient(editingClient.value.id, clientData)
  } else {
    const id = await clientsStore.addClient(clientData)
    success = !!id
  }

  if (success) {
    closeModal()
  }
}

function openDeleteDialog(client) {
  deletingClient.value = client
  showDeleteDialog.value = true
}

function closeDeleteDialog() {
  showDeleteDialog.value = false
  deletingClient.value = null
}

async function confirmDelete() {
  if (deletingClient.value) {
    const success = await clientsStore.deleteClient(deletingClient.value.id)
    if (success) {
      closeDeleteDialog()
    }
  }
}

function viewClient(client) {
  router.push(`/clients/${client.id}`)
}
</script>

<template>
  <div class="max-w-7xl mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Clients</h1>
        <p class="mt-2 text-gray-600">Manage your clients</p>
      </div>
      <BaseButton variant="primary" @click="openAddModal">
        Add Client
      </BaseButton>
    </div>

    <LoadingSpinner v-if="clientsStore.loading && clientsStore.clients.length === 0" text="Loading clients..." />

    <div v-else-if="clientsStore.error" class="bg-red-50 border border-red-200 rounded-sm p-4">
      <p class="text-sm text-red-800">{{ clientsStore.error }}</p>
    </div>

    <ClientList
      v-else
      :clients="clientsStore.clients"
      @edit="openEditModal"
      @delete="openDeleteDialog"
      @view="viewClient"
    />

    <BaseModal
      :show="showModal"
      :title="editingClient ? 'Edit Client' : 'Add New Client'"
      @close="closeModal"
    >
      <ClientForm
        :client="editingClient"
        @submit="handleSubmit"
        @cancel="closeModal"
      />
    </BaseModal>

    <ConfirmDialog
      :show="showDeleteDialog"
      title="Delete Client"
      :message="`Are you sure you want to delete ${deletingClient?.name}? This action cannot be undone.`"
      confirm-text="Delete"
      variant="danger"
      @confirm="confirmDelete"
      @cancel="closeDeleteDialog"
      @close="closeDeleteDialog"
    />
  </div>
</template>
