<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const props = defineProps({
  clients: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['edit', 'delete', 'view'])

const router = useRouter()
const searchQuery = ref('')

const filteredClients = computed(() => {
  if (!searchQuery.value) return props.clients

  const query = searchQuery.value.toLowerCase()
  return props.clients.filter(
    (client) =>
      client.name?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query)
  )
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <BaseInput
        v-model="searchQuery"
        placeholder="Search clients..."
        class="max-w-md"
      />
    </div>

    <div class="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              City
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="filteredClients.length === 0">
            <td colspan="5" class="px-6 py-8 text-center text-gray-500">
              No clients found
            </td>
          </tr>
          <tr
            v-for="client in filteredClients"
            :key="client.id"
            class="hover:bg-gray-50 transition-colors"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ client.name }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-600">{{ client.email }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-600">{{ client.phone }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-600">{{ client.city }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex gap-1.5 justify-end">
                <button
                  @click="emit('view', client)"
                  class="px-2.5 py-1 text-xs font-medium rounded-sm bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
                >
                  View
                </button>
                <button
                  @click="emit('edit', client)"
                  class="px-2.5 py-1 text-xs font-medium rounded-sm bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  Edit
                </button>
                <button
                  @click="emit('delete', client)"
                  class="px-2.5 py-1 text-xs font-medium rounded-sm bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
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
