<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useClientsStore } from '@/stores/clients'
import { useInvoicesStore } from '@/stores/invoices'
import { usePaymentsStore } from '@/stores/payments'
import { formatCurrency, formatDate } from '@/utils/formatters'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import VueApexCharts from 'vue3-apexcharts'

const router = useRouter()
const clientsStore = useClientsStore()
const invoicesStore = useInvoicesStore()
const paymentsStore = usePaymentsStore()

const loading = ref(true)

onMounted(async () => {
  await Promise.all([
    clientsStore.loadClients(),
    invoicesStore.loadInvoices(),
    paymentsStore.loadPayments(),
  ])
  loading.value = false
})

const stats = computed(() => [
  {
    label: 'Total Clients',
    value: clientsStore.clientsCount,
    color: 'primary',
  },
  {
    label: 'Total Invoices',
    value: invoicesStore.invoicesCount,
    color: 'blue',
  },
  {
    label: 'Total Revenue',
    value: formatCurrency(invoicesStore.totalRevenue),
    color: 'green',
  },
  {
    label: 'Outstanding',
    value: formatCurrency(invoicesStore.totalOutstanding),
    color: 'orange',
  },
])

const recentInvoices = computed(() => invoicesStore.invoices.slice(0, 5))
const recentPayments = computed(() => paymentsStore.recentPayments)

function getClientName(clientId) {
  const client = clientsStore.clients.find((c) => c.id === clientId)
  return client?.name || 'Unknown'
}

function getInvoiceNumber(invoiceId) {
  const invoice = invoicesStore.invoices.find((inv) => inv.id === invoiceId)
  return invoice?.invoice_number || 'Unknown'
}

// Revenue Trend Chart — Jan-Dec comparing current year and last 3 years
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const currentYear = new Date().getFullYear()

const revenueChartOptions = computed(() => {
  const yearlyData = {}
  for (let y = currentYear - 3; y <= currentYear; y++) {
    yearlyData[y] = new Array(12).fill(0)
  }

  paymentsStore.payments.forEach((p) => {
    const d = new Date(p.date)
    const year = d.getFullYear()
    if (yearlyData[year]) {
      yearlyData[year][d.getMonth()] += parseFloat(p.amount) || 0
    }
  })

  const colors = ['#d1d5db', '#93c5fd', '#60a5fa', '#2563eb']
  const series = Object.keys(yearlyData).sort().map((year) => ({
    name: String(year),
    data: yearlyData[year],
  }))

  return {
    series,
    options: {
      chart: { type: 'area', height: 280, toolbar: { show: false }, fontFamily: 'inherit' },
      colors,
      fill: { type: 'solid', opacity: 0.05 },
      stroke: { curve: 'straight', width: [1.5, 1.5, 1.5, 2.5] },
      xaxis: { categories: months },
      yaxis: { labels: { formatter: (v) => '$' + v.toLocaleString() } },
      dataLabels: { enabled: false },
      grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
      tooltip: { y: { formatter: (v) => formatCurrency(v) } },
      legend: { position: 'top', horizontalAlign: 'right', fontSize: '12px' },
    },
  }
})

// Invoice Status Donut Chart
const statusChartOptions = computed(() => {
  const counts = { draft: 0, sent: 0, paid: 0, overdue: 0 }
  invoicesStore.invoices.forEach((inv) => {
    if (counts[inv.status] !== undefined) counts[inv.status]++
  })

  return {
    series: [counts.draft, counts.sent, counts.paid, counts.overdue],
    options: {
      chart: { type: 'donut', height: 260, fontFamily: 'inherit' },
      labels: ['Draft', 'Sent', 'Paid', 'Overdue'],
      colors: ['#9ca3af', '#3b82f6', '#22c55e', '#ef4444'],
      legend: { position: 'bottom', fontSize: '13px' },
      dataLabels: { enabled: true, formatter: (val) => Math.round(val) + '%' },
      plotOptions: { pie: { donut: { size: '55%' } } },
      stroke: { width: 0 },
    },
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p class="mt-2 text-gray-600">Welcome to Invoice Manager</p>
    </div>

    <LoadingSpinner v-if="loading" text="Loading dashboard..." />

    <div v-else class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="bg-white rounded-sm shadow-sm border border-gray-200 p-6"
        >
          <p class="text-sm font-medium text-gray-500">{{ stat.label }}</p>
          <p class="mt-2 text-3xl font-bold text-gray-900">{{ stat.value }}</p>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <VueApexCharts
            v-if="paymentsStore.payments.length > 0"
            type="area"
            height="280"
            :options="revenueChartOptions.options"
            :series="revenueChartOptions.series"
          />
          <div v-else class="flex items-center justify-center h-64 text-gray-400 text-sm">
            No payment data yet
          </div>
        </div>

        <div class="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Invoice Status</h3>
          <VueApexCharts
            v-if="invoicesStore.invoices.length > 0"
            type="donut"
            height="260"
            :options="statusChartOptions.options"
            :series="statusChartOptions.series"
          />
          <div v-else class="flex items-center justify-center h-64 text-gray-400 text-sm">
            No invoices yet
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-sm shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Recent Invoices</h3>
            <BaseButton variant="ghost" size="sm" @click="router.push('/invoices')">
              View All
            </BaseButton>
          </div>
          <div v-if="recentInvoices.length === 0" class="px-6 py-8 text-center text-gray-500">
            No invoices yet
          </div>
          <div v-else class="divide-y divide-gray-200">
            <div
              v-for="invoice in recentInvoices"
              :key="invoice.id"
              class="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
              @click="router.push(`/invoices/${invoice.id}`)"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-gray-900">{{ invoice.invoice_number }}</p>
                  <p class="text-sm text-gray-500">{{ getClientName(invoice.client_id) }}</p>
                </div>
                <div class="text-right">
                  <p class="font-medium text-gray-900">{{ formatCurrency(invoice.total) }}</p>
                  <p class="text-sm text-gray-500">{{ formatDate(invoice.date) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-sm shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Recent Payments</h3>
            <BaseButton variant="ghost" size="sm" @click="router.push('/payments')">
              View All
            </BaseButton>
          </div>
          <div v-if="recentPayments.length === 0" class="px-6 py-8 text-center text-gray-500">
            No payments yet
          </div>
          <div v-else class="divide-y divide-gray-200">
            <div
              v-for="payment in recentPayments"
              :key="payment.id"
              class="px-6 py-4"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-gray-900">{{ getInvoiceNumber(payment.invoice_id) }}</p>
                  <p class="text-sm text-gray-500">{{ payment.method }}</p>
                </div>
                <div class="text-right">
                  <p class="font-medium text-primary-600">{{ formatCurrency(payment.amount) }}</p>
                  <p class="text-sm text-gray-500">{{ formatDate(payment.date) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-4">
        <BaseButton variant="primary" @click="router.push('/invoices/new')">
          Create Invoice
        </BaseButton>
        <BaseButton variant="secondary" @click="router.push('/clients')">
          Manage Clients
        </BaseButton>
      </div>
    </div>
  </div>
</template>
