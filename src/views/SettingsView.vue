<script setup>
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { exportAllData, importAllData } from '@/services/db'
import LogoUploader from '@/components/settings/LogoUploader.vue'
import CompanyInfoForm from '@/components/settings/CompanyInfoForm.vue'
import DefaultsForm from '@/components/settings/DefaultsForm.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const settingsStore = useSettingsStore()
const importFileInput = ref(null)
const dataMessage = ref('')
const dataMessageType = ref('success')

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

function showDataMessage(message, type = 'success') {
  dataMessage.value = message
  dataMessageType.value = type
  setTimeout(() => {
    dataMessage.value = ''
  }, 5000)
}

async function handleExport() {
  try {
    const exportObj = await exportAllData()
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showDataMessage('Data exported successfully')
  } catch (err) {
    showDataMessage('Failed to export data: ' + err.message, 'error')
  }
}

function triggerImport() {
  importFileInput.value?.click()
}

async function handleImport(event) {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const exportObj = JSON.parse(text)
    await importAllData(exportObj)
    // Reload settings into the form
    await settingsStore.loadSettings()
    formData.value = { ...settingsStore.settings }
    showDataMessage('Data imported successfully. All stores have been updated.')
  } catch (err) {
    showDataMessage('Failed to import data: ' + err.message, 'error')
  }

  // Reset file input so the same file can be re-selected
  event.target.value = ''
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
      <div class="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
        <LogoUploader
          :logo="formData.logo"
          @update:logo="handleLogoUpdate"
          @remove="handleLogoRemove"
        />
      </div>

      <div class="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
        <CompanyInfoForm :model-value="formData" @update:model-value="handleFormUpdate" />
      </div>

      <div class="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
        <DefaultsForm :model-value="formData" @update:model-value="handleFormUpdate" />
      </div>

      <!-- Data Export / Import -->
      <div class="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-1">Data Export &amp; Import</h2>
        <p class="text-sm text-gray-500 mb-4">
          Transfer your data between devices by exporting a backup file and importing it elsewhere.
        </p>

        <div v-if="dataMessage" class="mb-4 rounded-sm p-3 text-sm" :class="dataMessageType === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-green-50 border border-green-200 text-green-800'">
          {{ dataMessage }}
        </div>

        <div class="flex gap-3">
          <BaseButton variant="secondary" @click="handleExport">
            Export Data
          </BaseButton>
          <BaseButton variant="secondary" @click="triggerImport">
            Import Data
          </BaseButton>
          <input
            ref="importFileInput"
            type="file"
            accept=".json"
            class="hidden"
            @change="handleImport"
          />
        </div>
      </div>

      <div v-if="settingsStore.error" class="bg-red-50 border border-red-200 rounded-sm p-4">
        <p class="text-sm text-red-800">{{ settingsStore.error }}</p>
      </div>

      <div v-if="successMessage" class="bg-green-50 border border-green-200 rounded-sm p-4">
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
