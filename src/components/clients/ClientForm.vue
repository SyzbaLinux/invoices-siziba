<script setup>
import { ref, watch, onMounted } from 'vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { validateEmail, validateRequired } from '@/utils/validators'

const props = defineProps({
  client: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['submit', 'cancel'])

const formData = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  logo: '',
})

const errors = ref({})
const logoInput = ref(null)

onMounted(() => {
  if (props.client && props.client.id) {
    formData.value = { ...props.client }
  }
})

watch(
  () => props.client,
  (newClient) => {
    if (newClient && newClient.id) {
      formData.value = { ...newClient }
    }
  }
)

function validate() {
  errors.value = {}

  if (!validateRequired(formData.value.name)) {
    errors.value.name = 'Name is required'
  }

  if (!validateRequired(formData.value.email)) {
    errors.value.email = 'Email is required'
  } else if (!validateEmail(formData.value.email)) {
    errors.value.email = 'Invalid email address'
  }

  return Object.keys(errors.value).length === 0
}

function handleLogoUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    errors.value.logo = 'Please select an image file'
    return
  }

  if (file.size > 500 * 1024) {
    errors.value.logo = 'Image must be less than 500KB'
    return
  }

  errors.value.logo = ''

  const reader = new FileReader()
  reader.onload = (e) => {
    formData.value.logo = e.target.result
  }
  reader.readAsDataURL(file)
}

function removeLogo() {
  formData.value.logo = ''
  if (logoInput.value) {
    logoInput.value.value = ''
  }
}

function handleSubmit() {
  if (validate()) {
    emit('submit', { ...formData.value })
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- Logo Upload -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Client Logo</label>
      <div class="flex items-center gap-4">
        <div
          v-if="formData.logo"
          class="relative w-20 h-20 rounded-sm border border-gray-200 overflow-hidden bg-gray-50"
        >
          <img :src="formData.logo" alt="Client logo" class="w-full h-full object-contain" />
          <button
            type="button"
            @click="removeLogo"
            class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div v-else class="w-20 h-20 rounded-sm border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div class="flex-1">
          <input
            ref="logoInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleLogoUpload"
          />
          <BaseButton
            type="button"
            variant="secondary"
            size="sm"
            @click="logoInput?.click()"
          >
            {{ formData.logo ? 'Change Logo' : 'Upload Logo' }}
          </BaseButton>
          <p class="text-xs text-gray-500 mt-1">PNG, JPG up to 500KB</p>
          <p v-if="errors.logo" class="text-xs text-red-500 mt-1">{{ errors.logo }}</p>
        </div>
      </div>
    </div>

    <BaseInput
      v-model="formData.name"
      label="Name"
      placeholder="Client name"
      required
      :error="errors.name"
    />

    <BaseInput
      v-model="formData.email"
      label="Email"
      type="email"
      placeholder="client@email.com"
      required
      :error="errors.email"
    />

    <BaseInput
      v-model="formData.phone"
      label="Phone"
      type="tel"
      placeholder="(555) 123-4567"
    />

    <BaseInput
      v-model="formData.address"
      label="Address"
      placeholder="Street address"
    />

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <BaseInput
        v-model="formData.city"
        label="City"
        placeholder="City"
      />

      <BaseInput
        v-model="formData.state"
        label="State"
        placeholder="State"
      />

      <BaseInput
        v-model="formData.zip"
        label="ZIP Code"
        placeholder="12345"
      />
    </div>

    <div class="flex gap-3 justify-end pt-4">
      <BaseButton variant="secondary" type="button" @click="emit('cancel')">
        Cancel
      </BaseButton>
      <BaseButton variant="primary" type="submit">
        {{ client?.id ? 'Update Client' : 'Add Client' }}
      </BaseButton>
    </div>
  </form>
</template>
