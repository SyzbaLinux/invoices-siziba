<script setup>
import { formatPhone } from '@/utils/formatters'

defineProps({
  client: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>

    <div class="space-y-3">
      <div>
        <label class="text-sm font-medium text-gray-500">Name</label>
        <p class="text-gray-900">{{ client.name }}</p>
      </div>

      <div v-if="client.email">
        <label class="text-sm font-medium text-gray-500">Email</label>
        <p class="text-gray-900">
          <a :href="`mailto:${client.email}`" class="text-primary-600 hover:text-primary-700">
            {{ client.email }}
          </a>
        </p>
      </div>

      <div v-if="client.phone">
        <label class="text-sm font-medium text-gray-500">Phone</label>
        <p class="text-gray-900">
          <a :href="`tel:${client.phone}`" class="text-primary-600 hover:text-primary-700">
            {{ formatPhone(client.phone) }}
          </a>
        </p>
      </div>

      <div v-if="client.address || client.city">
        <label class="text-sm font-medium text-gray-500">Address</label>
        <div class="text-gray-900">
          <p v-if="client.address">{{ client.address }}</p>
          <p v-if="client.city || client.state || client.zip">
            {{ client.city }}{{ client.state ? ', ' + client.state : '' }}
            {{ client.zip }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
