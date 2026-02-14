<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import { useToast } from 'primevue/usetoast'
import { createSubscriptionPayment, listOutstandingPayments } from '@/services/payments.api'
import type { OutstandingPaymentItem, PaymentMethod } from '@/types/domain'
import { resolveApiErrorMessage } from '@/utils/api-error'

const toast = useToast()

const loading = ref(false)
const submittingQuickPayment = ref(false)
const items = ref<OutstandingPaymentItem[]>([])
const selectedItem = ref<OutstandingPaymentItem | null>(null)

const quickPaymentForm = reactive({
  amount: 0,
  paymentDate: new Date(),
  method: 'cash' as PaymentMethod,
  notes: '',
})

const paymentMethodOptions: { label: string; value: PaymentMethod }[] = [
  { label: 'Numerar', value: 'cash' },
  { label: 'Card', value: 'card' },
  { label: 'Transfer', value: 'transfer' },
]

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

async function loadOutstanding() {
  loading.value = true

  try {
    items.value = await listOutstandingPayments()

    if (
      selectedItem.value &&
      !items.value.some((item) => item.subscriptionId === selectedItem.value?.subscriptionId)
    ) {
      selectedItem.value = null
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Eroare',
      detail: resolveApiErrorMessage(error, 'Nu am putut încărca lista de plăți restante.'),
      life: 4000,
    })
  } finally {
    loading.value = false
  }
}

function startQuickPayment(item: OutstandingPaymentItem) {
  selectedItem.value = item
  quickPaymentForm.amount = Number(item.outstandingAmount.toFixed(2))
  quickPaymentForm.paymentDate = new Date()
  quickPaymentForm.method = 'cash'
  quickPaymentForm.notes = ''
}

function clearQuickPayment() {
  selectedItem.value = null
}

async function submitQuickPayment() {
  if (!selectedItem.value) {
    return
  }

  submittingQuickPayment.value = true

  try {
    await createSubscriptionPayment(selectedItem.value.subscriptionId, {
      amount: quickPaymentForm.amount,
      paymentDate: quickPaymentForm.paymentDate.toISOString(),
      method: quickPaymentForm.method,
      notes: quickPaymentForm.notes.trim() || undefined,
    })

    toast.add({
      severity: 'success',
      summary: 'Plată înregistrată',
      detail: 'Plata a fost salvată cu succes.',
      life: 3000,
    })

    await loadOutstanding()
    clearQuickPayment()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Eroare',
      detail: resolveApiErrorMessage(error, 'Nu am putut salva plata rapidă.'),
      life: 4000,
    })
  } finally {
    submittingQuickPayment.value = false
  }
}

onMounted(async () => {
  await loadOutstanding()
})
</script>

<template>
  <div class="page-stack" data-testid="outstanding-payments-page">
    <Card>
      <template #title>Plăți restante</template>
      <template #content>
        <div v-if="loading" class="skeleton-stack">
          <Skeleton height="2.5rem" />
          <Skeleton height="2.5rem" />
          <Skeleton height="2.5rem" />
        </div>

        <DataTable v-else :value="items" data-testid="outstanding-payments-table">
          <template #empty>
            Nu există abonamente cu sume restante.
          </template>

          <Column field="clientName" header="Client" />
          <Column header="Abonament">
            <template #body="{ data }">
              {{ data.planName || data.planType }}
            </template>
          </Column>
          <Column field="endDate" header="Data finală">
            <template #body="{ data }">
              {{ formatDate(data.endDate) }}
            </template>
          </Column>
          <Column header="Total">
            <template #body="{ data }">
              {{ formatCurrency(data.totalPrice, data.currency) }}
            </template>
          </Column>
          <Column header="Plătit">
            <template #body="{ data }">
              {{ formatCurrency(data.totalPaid, data.currency) }}
            </template>
          </Column>
          <Column header="Restant">
            <template #body="{ data }">
              <strong>{{ formatCurrency(data.outstandingAmount, data.currency) }}</strong>
            </template>
          </Column>
          <Column header="Acțiuni">
            <template #body="{ data }">
              <Button
                label="Înregistrează plată"
                icon="pi pi-plus"
                severity="secondary"
                text
                @click="startQuickPayment(data)"
                :data-testid="`quick-pay-${data.subscriptionId}`"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Card v-if="selectedItem" data-testid="quick-payment-card">
      <template #title>Plată rapidă</template>
      <template #content>
        <form class="form-grid" @submit.prevent="submitQuickPayment">
          <div class="form-field">
            <label class="field-label">Client</label>
            <InputText :model-value="selectedItem.clientName" disabled />
          </div>

          <div class="form-field">
            <label class="field-label">Sumă</label>
            <InputNumber
              v-model="quickPaymentForm.amount"
              mode="currency"
              currency="RON"
              locale="ro-RO"
              :min="0.01"
              :max-fraction-digits="2"
              :use-grouping="false"
              fluid
              input-id="outstanding-amount"
              data-testid="quick-payment-amount"
            />
          </div>

          <div class="form-field">
            <label class="field-label">Data plății</label>
            <DatePicker
              v-model="quickPaymentForm.paymentDate"
              date-format="dd.mm.yy"
              show-icon
              fluid
              input-id="outstanding-date"
              data-testid="quick-payment-date"
            />
          </div>

          <div class="form-field">
            <label class="field-label">Metodă</label>
            <Select
              v-model="quickPaymentForm.method"
              :options="paymentMethodOptions"
              option-label="label"
              option-value="value"
              fluid
              input-id="outstanding-method"
              data-testid="quick-payment-method"
            />
          </div>

          <div class="form-field">
            <label class="field-label">Notițe</label>
            <InputText
              v-model="quickPaymentForm.notes"
              placeholder="Detalii opționale"
              maxlength="500"
              data-testid="quick-payment-notes"
            />
          </div>

          <div class="inline-actions">
            <Button
              type="submit"
              label="Salvează plata"
              icon="pi pi-check"
              :loading="submittingQuickPayment"
              data-testid="quick-payment-submit"
            />
            <Button
              type="button"
              label="Anulează"
              severity="secondary"
              text
              @click="clearQuickPayment"
              data-testid="quick-payment-cancel"
            />
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>
