<script setup>
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import LogoUploader from '@/components/settings/LogoUploader.vue'
import CompanyInfoForm from '@/components/settings/CompanyInfoForm.vue'
import DefaultsForm from '@/components/settings/DefaultsForm.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const settingsStore = useSettingsStore()

const formData = ref({
  id: 1,
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
  companyCity: '',
  companyState: '',
  companyZip: '',
  logo: '',
  invoicePrefix: 'INV',
  defaultTaxRate: 0,
  defaultPaymentTerms: 'Net 30',
  currency: 'USD',
})
const saving = ref(false)
const successMessage = ref('')

onMounted(async () => {
  await settingsStore.loadSettings()
  console.log('Loaded settings from store:', settingsStore.settings)
  formData.value = { ...settingsStore.settings }
  console.log('FormData after load:', formData.value)
})

async function handleSave() {
  saving.value = true
  successMessage.value = ''

  console.log('Saving formData:', formData.value)
  const success = await settingsStore.saveSettings(formData.value)
  console.log('Save result:', success)

  if (success) {
    successMessage.value = 'Settings saved successfully'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  }

  saving.value = false
}

function handleLogoUpdate(logo) {
  formData.value = { ...formData.value, logo }
  console.log('Logo updated, formData:', formData.value)
}

function handleLogoRemove() {
  formData.value = { ...formData.value, logo: '' }
  console.log('Logo removed, formData:', formData.value)
}

function handleFormUpdate(newData) {
  console.log('Form update received:', newData)
  formData.value = newData
}
</script>

<template>
  <div class="max-w-4xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Settings</h1>
      <p class="mt-2 text-gray-600">Manage your company information and default settings</p>
    </div>

    <LoadingSpinner v-if="settingsStore.loading && !formData.id" text="Loading settings..." />

    <div v-else class="space-y-8">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <LogoUploader
          :logo="formData.logo"
          @update:logo="handleLogoUpdate"
          @remove="handleLogoRemove"
        />
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <CompanyInfoForm :model-value="formData" @update:model-value="handleFormUpdate" />
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <DefaultsForm :model-value="formData" @update:model-value="handleFormUpdate" />
      </div>

      <div v-if="settingsStore.error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-sm text-red-800">{{ settingsStore.error }}</p>
      </div>

      <div v-if="successMessage" class="bg-green-50 border border-green-200 rounded-lg p-4">
        <p class="text-sm text-green-800">{{ successMessage }}</p>
      </div>

      <div class="flex justify-end">
        <BaseButton
          variant="primary"
          size="lg"
          @click="handleSave"
          :disabled="saving"
        >
          {{ saving ? 'Saving...' : 'Save Settings' }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
