<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const phone = ref('')
const pin = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true

  // Small delay to feel natural
  await new Promise((r) => setTimeout(r, 300))

  if (phone.value === '771049950' && pin.value === '203131') {
    sessionStorage.setItem('authenticated', 'true')
    router.push('/dashboard')
  } else {
    error.value = 'Invalid phone number or PIN'
  }

  loading.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Invoice Manager</h1>
        <p class="mt-2 text-gray-500">Sign in to continue</p>
      </div>

      <form @submit.prevent="handleLogin" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            id="phone"
            v-model="phone"
            type="text"
            inputmode="numeric"
            required
            placeholder="Enter phone number"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label for="pin" class="block text-sm font-medium text-gray-700 mb-1">PIN</label>
          <input
            id="pin"
            v-model="pin"
            type="password"
            inputmode="numeric"
            required
            placeholder="Enter PIN"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-3">
          <p class="text-sm text-red-800">{{ error }}</p>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>
