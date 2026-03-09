<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClientsStore } from '@/stores/clients'
import { useInvoicesStore } from '@/stores/invoices'
import { usePaymentsStore } from '@/stores/payments'
import { useSettingsStore } from '@/stores/settings'
import { formatCurrency, formatDate } from '@/utils/formatters'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import html2pdf from 'html2pdf.js/dist/html2pdf.bundle.min.js'

const route = useRoute()
const router = useRouter()
const clientsStore = useClientsStore()
const invoicesStore = useInvoicesStore()
const paymentsStore = usePaymentsStore()
const settingsStore = useSettingsStore()

const client = ref(null)
const clientInvoices = ref([])
const clientPayments = ref([])
const loading = ref(true)
const statementRef = ref(null)

const statementDate = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

onMounted(async () => {
  const clientId = parseInt(route.params.clientId)

  await Promise.all([
    clientsStore.loadClients(),
    invoicesStore.loadInvoices(),
    paymentsStore.loadPayments(),
    settingsStore.loadSettings(),
  ])

  client.value = await clientsStore.getClient(clientId)
  clientInvoices.value = await invoicesStore.getInvoicesByClient(clientId)

  const invoiceIds = clientInvoices.value.map((inv) => inv.id)
  clientPayments.value = paymentsStore.payments.filter((pay) =>
    invoiceIds.includes(pay.invoice_id)
  )

  loading.value = false
})

const totalInvoiced = computed(() =>
  clientInvoices.value.reduce((sum, inv) => sum + (inv.total || 0), 0)
)

const totalPaid = computed(() =>
  clientPayments.value.reduce((sum, pay) => sum + (parseFloat(pay.amount) || 0), 0)
)

const totalOutstanding = computed(() => totalInvoiced.value - totalPaid.value)

function handlePrint() {
  window.print()
}

function getStatusStyle(status) {
  const styles = {
    paid: { background: '#d1fae5', color: '#065f46' },
    sent: { background: '#dbeafe', color: '#1e40af' },
    overdue: { background: '#fee2e2', color: '#991b1b' },
    draft: { background: '#f1f5f9', color: '#475569' }
  }
  return styles[status] || styles.draft
}

async function downloadStatement() {
  const element = statementRef.value

  if (!element) {
    console.error('Statement element not found')
    alert('Unable to generate PDF. Please try again.')
    return
  }

  const filename = `statement-${client.value.name.replace(/\s+/g, '-')}.pdf`

  const options = {
    margin: [8, 8, 8, 8],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  }

  try {
    await html2pdf().set(options).from(element).save()
  } catch (error) {
    console.error('PDF generation failed:', error)
    alert('Failed to generate PDF: ' + error.message)
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto py-8 px-4">
    <LoadingSpinner v-if="loading" text="Loading statement..." />

    <div v-else-if="!client" class="text-center py-12">
      <p style="color: #4b5563;">Client not found</p>
      <BaseButton variant="primary" class="mt-4" @click="router.push('/clients')">
        Back to Clients
      </BaseButton>
    </div>

    <div v-else>
      <div class="no-print mb-6 flex items-center justify-between">
        <BaseButton variant="ghost" @click="router.push(`/clients/${client.id}`)">
          ← Back to Client
        </BaseButton>
        <div class="flex gap-3">
          <BaseButton variant="secondary" @click="downloadStatement">
            Download PDF
          </BaseButton>
          <BaseButton variant="primary" @click="handlePrint">
            Print Statement
          </BaseButton>
        </div>
      </div>

      <div ref="statementRef" class="statement-container" style="background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="padding: 1rem 1.5rem; border-bottom: 2px solid #e2e8f0;">
          <div class="flex justify-between items-center">
            <div>
              <h1 style="font-size: 1.5rem; font-weight: 700; color: #1e293b; letter-spacing: -0.025em;">PAYMENT STATEMENT</h1>
              <p style="color: #64748b; margin-top: 0.25rem; font-size: 0.875rem;">{{ statementDate }}</p>
            </div>
            <div v-if="settingsStore.settings.logo" class="flex-shrink-0">
              <img
                :src="settingsStore.settings.logo"
                alt="Company Logo"
                style="height: 3rem; width: auto;"
              />
            </div>
          </div>
        </div>

        <!-- Addresses Row -->
        <div class="grid grid-cols-2 gap-6" style="padding: 1rem 1.5rem; border-bottom: 1px solid #e5e7eb;">
          <!-- From (Company) -->
          <div>
            <p style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem;">From</p>
            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
              <p style="font-size: 1.125rem; font-weight: 700; color: #1e293b;">{{ settingsStore.settings.companyName || 'Your Company' }}</p>
              <p v-if="settingsStore.settings.companyAddress" style="color: #475569;">{{ settingsStore.settings.companyAddress }}</p>
              <p v-if="settingsStore.settings.companyCity" style="color: #475569;">
                {{ settingsStore.settings.companyCity }}{{ settingsStore.settings.companyState ? ', ' + settingsStore.settings.companyState : '' }} {{ settingsStore.settings.companyZip }}
              </p>
              <p v-if="settingsStore.settings.companyEmail" style="color: #475569;">{{ settingsStore.settings.companyEmail }}</p>
              <p v-if="settingsStore.settings.companyPhone" style="color: #475569;">{{ settingsStore.settings.companyPhone }}</p>
            </div>
          </div>

          <!-- To (Client) -->
          <div>
            <p style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem;">To</p>
            <div class="flex gap-4">
              <div v-if="client.logo" class="flex-shrink-0">
                <img :src="client.logo" alt="Client Logo" style="height: 3rem; width: 3rem; object-fit: contain; border-radius: 0.25rem;" />
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                <p style="font-size: 1.125rem; font-weight: 700; color: #1e293b;">{{ client.name }}</p>
                <p v-if="client.address" style="color: #475569;">{{ client.address }}</p>
                <p v-if="client.city" style="color: #475569;">
                  {{ client.city }}{{ client.state ? ', ' + client.state : '' }} {{ client.zip }}
                </p>
                <p v-if="client.email" style="color: #475569;">{{ client.email }}</p>
                <p v-if="client.phone" style="color: #475569;">{{ client.phone }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary Cards -->
        <div style="padding: 1rem 1.5rem;">
          <div class="grid grid-cols-3 gap-4">
            <div style="background: #f8fafc; border-radius: 0.5rem; padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">
              <p style="font-size: 0.75rem; font-weight: 500; color: #64748b;">Total Invoiced</p>
              <p style="font-size: 1.25rem; font-weight: 700; color: #1e293b;">{{ formatCurrency(totalInvoiced) }}</p>
            </div>
            <div style="background: #ecfdf5; border-radius: 0.5rem; padding: 0.75rem 1rem; border: 1px solid #a7f3d0;">
              <p style="font-size: 0.75rem; font-weight: 500; color: #059669;">Total Paid</p>
              <p style="font-size: 1.25rem; font-weight: 700; color: #047857;">{{ formatCurrency(totalPaid) }}</p>
            </div>
            <div :style="{
              background: totalOutstanding > 0 ? '#fef2f2' : '#ecfdf5',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              border: totalOutstanding > 0 ? '1px solid #fecaca' : '1px solid #a7f3d0'
            }">
              <p :style="{ fontSize: '0.75rem', fontWeight: '500', color: totalOutstanding > 0 ? '#dc2626' : '#059669' }">Balance Due</p>
              <p :style="{ fontSize: '1.25rem', fontWeight: '700', color: totalOutstanding > 0 ? '#b91c1c' : '#047857' }">{{ formatCurrency(totalOutstanding) }}</p>
            </div>
          </div>
        </div>

        <!-- Invoices with Details -->
        <div style="padding: 0 1.5rem 1rem;">
          <h3 style="font-size: 0.875rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">
            Invoices
          </h3>

          <div v-if="clientInvoices.length === 0" style="padding: 2rem; text-align: center; color: #94a3b8; background: #f8fafc; border-radius: 0.5rem;">
            No invoices found
          </div>

          <!-- Invoice Cards -->
          <div v-for="invoice in clientInvoices" :key="invoice.id" style="margin-bottom: 1rem; border: 1px solid #e2e8f0; border-radius: 0.375rem; overflow: hidden;">
            <!-- Invoice Header Row -->
            <div style="background: #f8fafc; padding: 0.5rem 0.75rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0;">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div>
                  <p style="font-size: 0.625rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Invoice</p>
                  <p style="font-size: 0.75rem; font-weight: 600; color: #1e293b;">{{ invoice.invoice_number }}</p>
                </div>
                <div>
                  <p style="font-size: 0.625rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Date</p>
                  <p style="font-size: 0.75rem; color: #475569;">{{ formatDate(invoice.date) }}</p>
                </div>
                <div>
                  <p style="font-size: 0.625rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Due Date</p>
                  <p style="font-size: 0.75rem; color: #475569;">{{ invoice.due_date ? formatDate(invoice.due_date) : '—' }}</p>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span :style="{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.625rem',
                  fontWeight: '600',
                  background: getStatusStyle(invoice.status).background,
                  color: getStatusStyle(invoice.status).color
                }">
                  {{ invoice.status }}
                </span>
                <div style="text-align: right;">
                  <p style="font-size: 0.625rem; color: #64748b;">Total</p>
                  <p style="font-size: 0.875rem; font-weight: 700; color: #1e293b;">{{ formatCurrency(invoice.total) }}</p>
                </div>
              </div>
            </div>

            <!-- Invoice Items Row -->
            <div style="padding: 0;">
              <table style="min-width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #ffffff;">
                    <th style="padding: 0.375rem 0.75rem; text-align: left; font-size: 0.625rem; font-weight: 600; color: #64748b; border-bottom: 1px solid #f1f5f9;">Description</th>
                    <th style="padding: 0.375rem 0.5rem; text-align: right; font-size: 0.625rem; font-weight: 600; color: #64748b; border-bottom: 1px solid #f1f5f9; width: 50px;">Qty</th>
                    <th style="padding: 0.375rem 0.5rem; text-align: right; font-size: 0.625rem; font-weight: 600; color: #64748b; border-bottom: 1px solid #f1f5f9; width: 70px;">Rate</th>
                    <th style="padding: 0.375rem 0.75rem; text-align: right; font-size: 0.625rem; font-weight: 600; color: #64748b; border-bottom: 1px solid #f1f5f9; width: 80px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in invoice.items" :key="idx">
                    <td style="padding: 0.25rem 0.75rem; font-size: 0.75rem; color: #475569;">{{ item.description }}</td>
                    <td style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: #475569; text-align: right;">{{ item.quantity }}</td>
                    <td style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: #475569; text-align: right;">{{ formatCurrency(item.rate) }}</td>
                    <td style="padding: 0.25rem 0.75rem; font-size: 0.75rem; color: #1e293b; text-align: right; font-weight: 500;">{{ formatCurrency(item.quantity * item.rate) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style="border-top: 1px solid #e2e8f0;">
                    <td colspan="3" style="padding: 0.25rem 0.75rem; text-align: right; font-size: 0.7rem; color: #64748b;">Subtotal</td>
                    <td style="padding: 0.25rem 0.75rem; text-align: right; font-size: 0.75rem; color: #1e293b;">{{ formatCurrency(invoice.subtotal) }}</td>
                  </tr>
                  <tr v-if="invoice.tax > 0">
                    <td colspan="3" style="padding: 0.25rem 0.75rem; text-align: right; font-size: 0.7rem; color: #64748b;">Tax ({{ invoice.tax_rate }}%)</td>
                    <td style="padding: 0.25rem 0.75rem; text-align: right; font-size: 0.75rem; color: #1e293b;">{{ formatCurrency(invoice.tax) }}</td>
                  </tr>
                  <tr style="background: #f8fafc;">
                    <td colspan="3" style="padding: 0.375rem 0.75rem; text-align: right; font-size: 0.75rem; font-weight: 600; color: #1e293b;">Total</td>
                    <td style="padding: 0.375rem 0.75rem; text-align: right; font-size: 0.875rem; font-weight: 700; color: #1e293b;">{{ formatCurrency(invoice.total) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- Payments Table -->
        <div style="padding: 0 1.5rem 0.75rem;">
          <h3 style="font-size: 0.875rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">
            Payment History
          </h3>
          <div style="overflow: hidden; border-radius: 0.375rem; border: 1px solid #e2e8f0;">
            <table style="min-width: 100%; border-collapse: collapse;">
              <thead style="background: #f8fafc;">
                <tr>
                  <th style="padding: 0.375rem 0.75rem; text-align: left; font-size: 0.625rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Date</th>
                  <th style="padding: 0.375rem 0.75rem; text-align: left; font-size: 0.625rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Method</th>
                  <th style="padding: 0.375rem 0.75rem; text-align: left; font-size: 0.625rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Reference</th>
                  <th style="padding: 0.375rem 0.75rem; text-align: right; font-size: 0.625rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Amount</th>
                </tr>
              </thead>
              <tbody style="background: #ffffff;">
                <tr v-if="clientPayments.length === 0">
                  <td colspan="4" style="padding: 1rem; text-align: center; font-size: 0.75rem; color: #94a3b8;">No payments recorded</td>
                </tr>
                <tr v-for="payment in clientPayments" :key="payment.id" style="border-top: 1px solid #f1f5f9;">
                  <td style="padding: 0.375rem 0.75rem; font-size: 0.75rem; color: #475569;">{{ formatDate(payment.date) }}</td>
                  <td style="padding: 0.375rem 0.75rem; font-size: 0.75rem; color: #475569; text-transform: capitalize;">{{ payment.method }}</td>
                  <td style="padding: 0.375rem 0.75rem; font-size: 0.75rem; color: #475569;">{{ payment.reference || '—' }}</td>
                  <td style="padding: 0.375rem 0.75rem; font-size: 0.75rem; font-weight: 600; color: #059669; text-align: right;">+{{ formatCurrency(payment.amount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 0.5rem 1.5rem; border-top: 1px solid #e2e8f0;">
          <p style="text-align: center; font-size: 0.75rem; color: #64748b;">
            Thank you for your business. For questions regarding this statement, please contact us.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.statement-container {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* Prevent page breaks inside elements */
.statement-container table {
  page-break-inside: avoid;
}

.statement-container tr {
  page-break-inside: avoid;
}

.statement-container div {
  page-break-inside: avoid;
}

@media print {
  .no-print {
    display: none !important;
  }

  .statement-container {
    box-shadow: none !important;
  }
}
</style>
