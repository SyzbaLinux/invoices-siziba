<script setup>
import { ref, watch } from 'vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { validateRequired, validatePositiveNumber } from '@/utils/validators'

const props = defineProps({
  payment: {
    type: Object,
    default: () => ({}),
  },
  maxAmount: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['submit', 'cancel'])

const formData = ref({
  amount: '',
  date: new Date().toISOString().split('T')[0],
  method: 'EcoCash',
  reference: '',
})

const errors = ref({})

// Zimbabwe payment methods
const paymentMethods = [
  { value: 'EcoCash', label: 'EcoCash' },
  { value: 'OneMoney', label: 'OneMoney' },
  { value: 'InnBucks', label: 'InnBucks' },
  { value: 'Cash (USD)', label: 'Cash (USD)' },
  { value: 'Cash (ZWG)', label: 'Cash (ZWG)' },
  { value: 'Cash (ZAR)', label: 'Cash (ZAR)' },
  { value: 'Bank Transfer (RTGS)', label: 'Bank Transfer (RTGS)' },
  { value: 'Bank Transfer (Nostro)', label: 'Bank Transfer (Nostro)' },
  { value: 'Zipit', label: 'Zipit' },
  { value: 'POS/Card', label: 'POS/Card' },
  { value: 'Mukuru', label: 'Mukuru' },
  { value: 'WorldRemit', label: 'WorldRemit' },
  { value: 'PayPal', label: 'PayPal' },
  { value: 'Cheque', label: 'Cheque' },
  { value: 'Other', label: 'Other' },
]

watch(
  () => props.payment,
  (newPayment) => {
    if (newPayment && newPayment.id) {
      formData.value = {
        ...newPayment,
        date: newPayment.date?.split('T')[0] || '',
      }
    }
  },
  { immediate: true }
)

function validate() {
  errors.value = {}

  if (!validateRequired(formData.value.amount)) {
    errors.value.amount = 'Amount is required'
  } else if (!validatePositiveNumber(formData.value.amount)) {
    errors.value.amount = 'Amount must be a positive number'
  } else if (props.maxAmount > 0 && parseFloat(formData.value.amount) > props.maxAmount) {
    errors.value.amount = `Amount cannot exceed ${props.maxAmount}`
  }

  if (!validateRequired(formData.value.date)) {
    errors.value.date = 'Date is required'
  }

  if (!validateRequired(formData.value.method)) {
    errors.value.method = 'Payment method is required'
  }

  return Object.keys(errors.value).length === 0
}

function handleSubmit() {
  if (validate()) {
    emit('submit', {
      ...formData.value,
      amount: parseFloat(formData.value.amount),
    })
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <BaseInput
      v-model="formData.amount"
      label="Amount"
      type="number"
      min="0"
      step="0.01"
      placeholder="0.00"
      required
      :error="errors.amount"
    />

    <BaseInput
      v-model="formData.date"
      label="Payment Date"
      type="date"
      required
      :error="errors.date"
    />

    <BaseSelect
      v-model="formData.method"
      label="Payment Method"
      :options="paymentMethods"
      required
      :error="errors.method"
    />

    <BaseInput
      v-model="formData.reference"
      label="Reference / Transaction ID"
      placeholder="e.g. EcoCash confirmation code"
    />

    <div class="flex gap-3 justify-end pt-4">
      <BaseButton variant="secondary" type="button" @click="emit('cancel')">
        Cancel
      </BaseButton>
      <BaseButton variant="primary" type="submit">
        {{ payment?.id ? 'Update Payment' : 'Record Payment' }}
      </BaseButton>
    </div>
  </form>
</template>
