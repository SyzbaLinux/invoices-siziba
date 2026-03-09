import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as db from '@/services/db'

export const useClientsStore = defineStore('clients', () => {
  const clients = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function loadClients() {
    loading.value = true
    error.value = null
    try {
      clients.value = await db.getAllRecords('clients')
    } catch (err) {
      error.value = err.message
      console.error('Error loading clients:', err)
    } finally {
      loading.value = false
    }
  }

  async function getClient(id) {
    try {
      return await db.getRecord('clients', parseInt(id))
    } catch (err) {
      error.value = err.message
      console.error('Error getting client:', err)
      return null
    }
  }

  async function addClient(clientData) {
    loading.value = true
    error.value = null
    try {
      const id = await db.addRecord('clients', clientData)
      await loadClients()
      return id
    } catch (err) {
      error.value = err.message
      console.error('Error adding client:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateClient(id, clientData) {
    loading.value = true
    error.value = null
    try {
      await db.updateRecord('clients', { id, ...clientData })
      await loadClients()
      return true
    } catch (err) {
      error.value = err.message
      console.error('Error updating client:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteClient(id) {
    loading.value = true
    error.value = null
    try {
      // Check if client has invoices
      const invoices = await db.getByIndex('invoices', 'client_id', parseInt(id))
      if (invoices && invoices.length > 0) {
        error.value = 'Cannot delete client with existing invoices'
        return false
      }

      await db.deleteRecord('clients', parseInt(id))
      await loadClients()
      return true
    } catch (err) {
      error.value = err.message
      console.error('Error deleting client:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  function searchClients(query) {
    if (!query) return clients.value

    const lowerQuery = query.toLowerCase()
    return clients.value.filter(
      (client) =>
        client.name?.toLowerCase().includes(lowerQuery) ||
        client.email?.toLowerCase().includes(lowerQuery) ||
        client.phone?.toLowerCase().includes(lowerQuery)
    )
  }

  const clientsCount = computed(() => clients.value.length)

  return {
    clients,
    loading,
    error,
    loadClients,
    getClient,
    addClient,
    updateClient,
    deleteClient,
    searchClients,
    clientsCount,
  }
})
