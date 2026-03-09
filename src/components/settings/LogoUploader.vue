<script setup>
import { ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'

const props = defineProps({
  logo: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:logo', 'remove'])

const fileInput = ref(null)
const uploading = ref(false)
const error = ref('')

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileChange(event) {
  const file = event.target.files[0]
  if (!file) return

  error.value = ''

  // Validate file type
  if (!file.type.startsWith('image/')) {
    error.value = 'Please select an image file'
    return
  }

  // Validate file size (2MB max)
  if (file.size > 2 * 1024 * 1024) {
    error.value = 'Image must be less than 2MB'
    return
  }

  uploading.value = true

  try {
    const reader = new FileReader()
    reader.onload = (e) => {
      emit('update:logo', e.target.result)
      uploading.value = false
    }
    reader.onerror = () => {
      error.value = 'Failed to read file'
      uploading.value = false
    }
    reader.readAsDataURL(file)
  } catch (err) {
    error.value = 'Failed to upload image'
    uploading.value = false
  }
}

function removeLogo() {
  emit('remove')
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="space-y-4">
    <label class="block text-sm font-medium text-gray-700">Company Logo</label>

    <div v-if="logo" class="flex items-start gap-4">
      <div class="flex-shrink-0">
        <img :src="logo" alt="Company Logo" class="h-24 w-24 object-contain border rounded-lg" />
      </div>
      <div class="flex flex-col gap-2">
        <BaseButton variant="secondary" size="sm" @click="triggerFileInput">
          Change Logo
        </BaseButton>
        <BaseButton variant="danger" size="sm" @click="removeLogo">
          Remove Logo
        </BaseButton>
      </div>
    </div>

    <div v-else class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        stroke="currentColor"
        fill="none"
        viewBox="0 0 48 48"
      >
        <path
          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <div class="mt-4">
        <BaseButton variant="primary" size="sm" @click="triggerFileInput" :disabled="uploading">
          {{ uploading ? 'Uploading...' : 'Upload Logo' }}
        </BaseButton>
      </div>
      <p class="mt-2 text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileChange"
    />

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
  </div>
</template>
