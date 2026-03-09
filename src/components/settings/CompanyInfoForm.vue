<script setup>
import BaseInput from '@/components/common/BaseInput.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

function updateField(field, value) {
  const updated = { ...props.modelValue, [field]: value }
  console.log('CompanyInfoForm emitting:', updated)
  emit('update:modelValue', updated)
}
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-lg font-medium text-gray-900">Company Information</h3>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BaseInput
        :model-value="modelValue.companyName"
        @update:model-value="updateField('companyName', $event)"
        label="Company Name"
        placeholder="Enter company name"
        required
      />

      <BaseInput
        :model-value="modelValue.companyEmail"
        @update:model-value="updateField('companyEmail', $event)"
        label="Email"
        type="email"
        placeholder="email@company.com"
        required
      />

      <BaseInput
        :model-value="modelValue.companyPhone"
        @update:model-value="updateField('companyPhone', $event)"
        label="Phone"
        type="tel"
        placeholder="(555) 123-4567"
      />

      <BaseInput
        :model-value="modelValue.companyAddress"
        @update:model-value="updateField('companyAddress', $event)"
        label="Address"
        placeholder="Street address"
      />

      <BaseInput
        :model-value="modelValue.companyCity"
        @update:model-value="updateField('companyCity', $event)"
        label="City"
        placeholder="City"
      />

      <div class="grid grid-cols-2 gap-4">
        <BaseInput
          :model-value="modelValue.companyState"
          @update:model-value="updateField('companyState', $event)"
          label="State"
          placeholder="State"
        />

        <BaseInput
          :model-value="modelValue.companyZip"
          @update:model-value="updateField('companyZip', $event)"
          label="ZIP Code"
          placeholder="12345"
        />
      </div>
    </div>
  </div>
</template>
