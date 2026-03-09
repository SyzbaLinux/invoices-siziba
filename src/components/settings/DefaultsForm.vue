<script setup>
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

function updateField(field, value) {
  const updated = { ...props.modelValue, [field]: value }
  console.log('DefaultsForm emitting:', updated)
  emit('update:modelValue', updated)
}

const paymentTermsOptions = [
  { value: 'Due on Receipt', label: 'Due on Receipt' },
  { value: 'Net 15', label: 'Net 15' },
  { value: 'Net 30', label: 'Net 30' },
  { value: 'Net 60', label: 'Net 60' },
  { value: 'Net 90', label: 'Net 90' },
]

const currencyOptions = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
]
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-lg font-medium text-gray-900">Default Settings</h3>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BaseInput
        :model-value="modelValue.invoicePrefix"
        @update:model-value="updateField('invoicePrefix', $event)"
        label="Invoice Number Prefix"
        placeholder="INV"
        required
      />

      <BaseInput
        :model-value="modelValue.defaultTaxRate"
        @update:model-value="updateField('defaultTaxRate', $event)"
        label="Default Tax Rate (%)"
        type="number"
        min="0"
        max="100"
        step="0.01"
        placeholder="0"
      />

      <BaseSelect
        :model-value="modelValue.defaultPaymentTerms"
        @update:model-value="updateField('defaultPaymentTerms', $event)"
        label="Default Payment Terms"
        :options="paymentTermsOptions"
        required
      />

      <BaseSelect
        :model-value="modelValue.currency"
        @update:model-value="updateField('currency', $event)"
        label="Currency"
        :options="currencyOptions"
        required
      />
    </div>
  </div>
</template>
