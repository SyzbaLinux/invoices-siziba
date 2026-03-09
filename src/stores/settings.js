import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as db from '@/services/db'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref({
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

  const loading = ref(false)
  const error = ref(null)

  async function loadSettings() {
    loading.value = true
    error.value = null
    try {
      const data = await db.getRecord('settings', 1)
      console.log('Data from DB:', data)
      if (data) {
        settings.value = { ...settings.value, ...data }
        console.log('Settings after merge:', settings.value)
      } else {
        console.log('No settings found in DB, using defaults')
      }
    } catch (err) {
      error.value = err.message
      console.error('Error loading settings:', err)
    } finally {
      loading.value = false
    }
  }

  async function saveSettings(data) {
    loading.value = true
    error.value = null
    try {
      const settingsData = { id: 1, ...data }
      console.log('Saving to DB:', settingsData)
      await db.updateRecord('settings', settingsData)
      settings.value = settingsData
      console.log('Successfully saved, store updated')
      return true
    } catch (err) {
      error.value = err.message
      console.error('Error saving settings:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function uploadLogo(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target.result)
      }
      reader.onerror = (e) => {
        reject(e)
      }
      reader.readAsDataURL(file)
    })
  }

  const hasLogo = computed(() => !!settings.value.logo)
  const hasCompanyInfo = computed(
    () => !!settings.value.companyName || !!settings.value.companyEmail
  )

  return {
    settings,
    loading,
    error,
    loadSettings,
    saveSettings,
    uploadLogo,
    hasLogo,
    hasCompanyInfo,
  }
})
