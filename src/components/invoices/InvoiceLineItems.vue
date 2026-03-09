<script setup>
import { computed } from 'vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { calculateLineTotal } from '@/utils/calculations'
import { formatCurrency } from '@/utils/formatters'

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:items'])

function updateItem(index, field, value) {
  const newItems = [...props.items]
  newItems[index] = { ...newItems[index], [field]: value }
  emit('update:items', newItems)
}

function addItem() {
  const newItems = [
    ...props.items,
    { description: '', quantity: 1, rate: 0 },
  ]
  emit('update:items', newItems)
}

function removeItem(index) {
  const newItems = props.items.filter((_, i) => i !== index)
  emit('update:items', newItems)
}

function getLineTotal(item) {
  return calculateLineTotal(item.quantity, item.rate)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-medium text-gray-900">Line Items</h3>
      <BaseButton variant="secondary" size="sm" @click="addItem">
        Add Item
      </BaseButton>
    </div>

    <div class="space-y-3">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="bg-gray-50 rounded-lg p-4 space-y-3"
      >
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
          <div class="md:col-span-5">
            <BaseInput
              :model-value="item.description"
              label="Description"
              placeholder="Item description"
              @update:model-value="updateItem(index, 'description', $event)"
            />
          </div>

          <div class="md:col-span-2">
            <BaseInput
              :model-value="item.quantity"
              label="Quantity"
              type="number"
              min="0"
              step="0.01"
              @update:model-value="updateItem(index, 'quantity', $event)"
            />
          </div>

          <div class="md:col-span-2">
            <BaseInput
              :model-value="item.rate"
              label="Rate"
              type="number"
              min="0"
              step="0.01"
              @update:model-value="updateItem(index, 'rate', $event)"
            />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Total</label>
            <div class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900">
              {{ formatCurrency(getLineTotal(item)) }}
            </div>
          </div>

          <div class="md:col-span-1 flex items-end">
            <button
              type="button"
              @click="removeItem(index)"
              class="w-full h-10 text-red-600 hover:text-red-800 transition-colors"
              title="Remove item"
            >
              <svg
                class="w-5 h-5 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="items.length === 0" class="text-center py-8 text-gray-500">
        No items added. Click "Add Item" to get started.
      </div>
    </div>
  </div>
</template>
