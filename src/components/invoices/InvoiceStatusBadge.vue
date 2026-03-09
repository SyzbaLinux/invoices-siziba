<script setup>
defineProps({
  status: {
    type: String,
    required: true,
  },
})

const statusConfig = {
  draft: { color: 'gray', label: 'Draft' },
  sent: { color: 'blue', label: 'Sent' },
  paid: { color: 'green', label: 'Paid' },
  overdue: { color: 'red', label: 'Overdue' },
  cancelled: { color: 'gray', label: 'Cancelled' },
}

const getColorClasses = (color) => {
  const colors = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-primary-100 text-primary-800',
    red: 'bg-red-100 text-red-800',
  }
  return colors[color] || colors.gray
}
</script>

<template>
  <span
    :class="[
      'inline-block px-2.5 py-0.5 text-xs font-semibold rounded-sm uppercase tracking-wide',
      getColorClasses(statusConfig[status]?.color),
    ]"
  >
    {{ statusConfig[status]?.label || status }}
  </span>
</template>
