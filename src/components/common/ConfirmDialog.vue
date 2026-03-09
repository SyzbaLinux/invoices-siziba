<script setup>
defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: 'Confirm Action',
  },
  message: {
    type: String,
    required: true,
  },
  confirmText: {
    type: String,
    default: 'Confirm',
  },
  cancelText: {
    type: String,
    default: 'Cancel',
  },
  variant: {
    type: String,
    default: 'danger',
    validator: (value) => ['primary', 'danger'].includes(value),
  },
})

const emit = defineEmits(['confirm', 'cancel', 'close'])
</script>

<template>
  <Transition name="modal">
    <div
      v-if="show"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click.self="emit('close')"
    >
      <div class="flex min-h-full items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
        <div class="relative bg-white rounded-lg shadow-xl w-full max-w-md">
          <div class="p-6">
            <div class="flex items-start">
              <div
                :class="[
                  'flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full',
                  variant === 'danger' ? 'bg-red-100' : 'bg-primary-100',
                ]"
              >
                <svg
                  class="h-6 w-6"
                  :class="variant === 'danger' ? 'text-red-600' : 'text-primary-600'"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    v-if="variant === 'danger'"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                  <path
                    v-else
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div class="ml-4 flex-1">
                <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>
                <p class="mt-2 text-sm text-gray-500">{{ message }}</p>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 bg-gray-50 flex gap-3 justify-end rounded-b-lg">
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
              @click="emit('cancel')"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              :class="[
                'px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
                variant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
              ]"
              @click="emit('confirm')"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
