<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import { useToast } from 'primevue/usetoast'
import { getClient } from '@/services/clients.api'
import {
  createSubscriptionPayment,
  listClientPayments,
} from '@/services/payments.api'
import {
  createClientSubscription,
  listClientSubscriptions,
} from '@/services/subscriptions.api'
import type {
  Client,
  ClientStatus,
  Payment,
  PaymentMethod,
  Subscription,
  SubscriptionPlanType,
  SubscriptionStatus,
} from '@/types/domain'
import { resolveApiErrorMessage } from '@/utils/api-error'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(false)
const loadingPhaseThree = ref(false)
const submittingSubscription = ref(false)
const submittingPayment = ref(false)
const client = ref<Client | null>(null)
const subscriptions = ref<Subscription[]>([])
const payments = ref<Payment[]>([])

const subscriptionForm = reactive({
  planType: 'monthly' as SubscriptionPlanType,
  planName: '',
  startDate: new Date(),
  endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  price: 0,
  currency: 'RON' as const,
  notes: '',
})

const paymentForm = reactive({
  subscriptionId: '',
  amount: 0,
  paymentDate: new Date(),
  method: 'cash' as PaymentMethod,
  notes: '',
})

const subscriptionPlanOptions: { label: string; value: SubscriptionPlanType }[] = [
  { label: 'Lunar', value: 'monthly' },
  { label: 'Trimestrial', value: 'quarterly' },
  { label: 'Semestrial', value: 'semiannual' },
  { label: 'Anual', value: 'annual' },
  { label: 'Personalizat', value: 'custom' },
]

const paymentMethodOptions: { label: string; value: PaymentMethod }[] = [
  { label: 'Numerar', value: 'cash' },
  { label: 'Card', value: 'card' },
  { label: 'Transfer', value: 'transfer' },
]

const subscriptionSelectOptions = computed(() =>
  subscriptions.value.map((subscription) => ({
    label: `${planTypeLabel(subscription.planType)} • ${formatDate(subscription.startDate)} - ${formatDate(subscription.endDate)}`,
    value: subscription._id,
  })),
)

function statusLabel(status: ClientStatus) {
  const labels: Record<ClientStatus, string> = {
    active: 'Activ',
    inactive: 'Inactiv',
    suspended: 'Suspendat',
    invited: 'Invitat',
  }

  return labels[status]
}

function statusSeverity(status: ClientStatus) {
  switch (status) {
    case 'active':
      return 'success'
    case 'invited':
      return 'info'
    case 'inactive':
      return 'warn'
    case 'suspended':
      return 'danger'
    default:
      return 'secondary'
  }
}

function planTypeLabel(planType: SubscriptionPlanType) {
  const labels: Record<SubscriptionPlanType, string> = {
    monthly: 'Lunar',
    quarterly: 'Trimestrial',
    semiannual: 'Semestrial',
    annual: 'Anual',
    custom: 'Personalizat',
  }

  return labels[planType]
}

function subscriptionStatusLabel(status: SubscriptionStatus) {
  const labels: Record<SubscriptionStatus, string> = {
    active: 'Activ',
    cancelled: 'Anulat',
    expired: 'Expirat',
  }

  return labels[status]
}

function subscriptionStatusSeverity(status: SubscriptionStatus) {
  switch (status) {
    case 'active':
      return 'success'
    case 'expired':
      return 'warn'
    case 'cancelled':
      return 'danger'
    default:
      return 'secondary'
  }
}

function paymentMethodLabel(method: PaymentMethod) {
  const labels: Record<PaymentMethod, string> = {
    cash: 'Numerar',
    card: 'Card',
    transfer: 'Transfer',
  }

  return labels[method]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function formatCurrency(value: number, currency = 'RON') {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

async function loadClient() {
  const id = String(route.params.id)
  loading.value = true

  try {
    client.value = await getClient(id)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Eroare',
      detail: resolveApiErrorMessage(error, 'Nu am putut încărca detaliile clientului.'),
      life: 4000,
    })
    router.replace({ name: 'clients-list' })
  } finally {
    loading.value = false
  }
}

async function loadPhaseThreeData() {
  const id = String(route.params.id)
  loadingPhaseThree.value = true

  try {
    const [subscriptionItems, paymentItems] = await Promise.all([
      listClientSubscriptions(id),
      listClientPayments(id),
    ])

    subscriptions.value = subscriptionItems
    payments.value = paymentItems

    if (!paymentForm.subscriptionId && subscriptionItems.length > 0) {
      paymentForm.subscriptionId = subscriptionItems[0]._id
    }

    if (
      paymentForm.subscriptionId &&
      !subscriptionItems.some((subscription) => subscription._id === paymentForm.subscriptionId)
    ) {
      paymentForm.subscriptionId = subscriptionItems[0]?._id ?? ''
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Eroare',
      detail: resolveApiErrorMessage(error, 'Nu am putut încărca abonamentele și plățile.'),
      life: 4000,
    })
  } finally {
    loadingPhaseThree.value = false
  }
}

async function onCreateSubscription() {
  const id = String(route.params.id)
  submittingSubscription.value = true

  try {
    await createClientSubscription(id, {
      planType: subscriptionForm.planType,
      planName: subscriptionForm.planName.trim() || undefined,
      startDate: subscriptionForm.startDate.toISOString(),
      endDate: subscriptionForm.endDate.toISOString(),
      price: subscriptionForm.price,
      currency: subscriptionForm.currency,
      notes: subscriptionForm.notes.trim() || undefined,
    })

    toast.add({
      severity: 'success',
      summary: 'Abonament adăugat',
      detail: 'Abonamentul a fost creat cu succes.',
      life: 3000,
    })

    subscriptionForm.planName = ''
    subscriptionForm.notes = ''
    subscriptionForm.price = 0
    await Promise.all([loadClient(), loadPhaseThreeData()])
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Eroare',
      detail: resolveApiErrorMessage(error, 'Nu am putut crea abonamentul.'),
      life: 4000,
    })
  } finally {
    submittingSubscription.value = false
  }
}

async function onCreatePayment() {
  if (!paymentForm.subscriptionId) {
    toast.add({
      severity: 'warn',
      summary: 'Abonament necesar',
      detail: 'Selectați un abonament înainte să înregistrați plata.',
      life: 3000,
    })
    return
  }

  submittingPayment.value = true

  try {
    await createSubscriptionPayment(paymentForm.subscriptionId, {
      amount: paymentForm.amount,
      paymentDate: paymentForm.paymentDate.toISOString(),
      method: paymentForm.method,
      notes: paymentForm.notes.trim() || undefined,
    })

    toast.add({
      severity: 'success',
      summary: 'Plată înregistrată',
      detail: 'Plata a fost salvată cu succes.',
      life: 3000,
    })

    paymentForm.amount = 0
    paymentForm.notes = ''
    await loadPhaseThreeData()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Eroare',
      detail: resolveApiErrorMessage(error, 'Nu am putut înregistra plata.'),
      life: 4000,
    })
  } finally {
    submittingPayment.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadClient(), loadPhaseThreeData()])
})
</script>

<template>
  <div class="page-stack" data-testid="client-detail-page">
    <div class="inline-actions">
      <Button
        label="Înapoi la listă"
        icon="pi pi-arrow-left"
        severity="secondary"
        text
        @click="router.push({ name: 'clients-list' })"
      />
      <Button
        v-if="client"
        label="Editează"
        icon="pi pi-pencil"
        @click="router.push({ name: 'clients-edit', params: { id: client._id } })"
        data-testid="client-detail-edit"
      />
    </div>

    <Card>
      <template #title>Detalii client</template>
      <template #content>
        <div v-if="loading" class="skeleton-stack">
          <Skeleton height="2rem" />
          <Skeleton height="2rem" />
          <Skeleton height="2rem" />
          <Skeleton height="2rem" />
        </div>

        <div v-else-if="client" class="detail-grid">
          <div data-testid="detail-name">
            <strong>Nume:</strong> {{ client.firstName }} {{ client.lastName }}
          </div>
          <div data-testid="detail-email">
            <strong>Email:</strong> {{ client.email }}
          </div>
          <div data-testid="detail-phone">
            <strong>Telefon:</strong> {{ client.phone }}
          </div>
          <div data-testid="detail-status">
            <strong>Status:</strong>
            <Tag :value="statusLabel(client.status)" :severity="statusSeverity(client.status)" />
          </div>
        </div>
      </template>
    </Card>

    <Card>
      <template #title>Abonamente</template>
      <template #content>
        <div v-if="loadingPhaseThree" class="skeleton-stack">
          <Skeleton height="2.5rem" />
          <Skeleton height="2.5rem" />
          <Skeleton height="2.5rem" />
        </div>

        <template v-else>
          <DataTable :value="subscriptions" data-testid="subscriptions-table">
            <template #empty>
              Nu există abonamente pentru acest client.
            </template>

            <Column header="Plan">
              <template #body="{ data }">
                {{ data.planName || planTypeLabel(data.planType) }}
              </template>
            </Column>
            <Column header="Perioadă">
              <template #body="{ data }">
                {{ formatDate(data.startDate) }} - {{ formatDate(data.endDate) }}
              </template>
            </Column>
            <Column header="Preț">
              <template #body="{ data }">
                {{ formatCurrency(data.price, data.currency) }}
              </template>
            </Column>
            <Column header="Status">
              <template #body="{ data }">
                <Tag
                  :value="subscriptionStatusLabel(data.status)"
                  :severity="subscriptionStatusSeverity(data.status)"
                />
              </template>
            </Column>
          </DataTable>

          <form class="form-grid" @submit.prevent="onCreateSubscription">
            <div class="form-field">
              <label class="field-label">Tip plan</label>
              <Select
                v-model="subscriptionForm.planType"
                :options="subscriptionPlanOptions"
                option-label="label"
                option-value="value"
                fluid
                input-id="subscription-plan-type"
                data-testid="subscription-plan-type"
              />
            </div>

            <div class="form-field">
              <label class="field-label">Nume plan (opțional)</label>
              <InputText
                v-model="subscriptionForm.planName"
                maxlength="100"
                placeholder="Ex: Acces complet"
                data-testid="subscription-plan-name"
              />
            </div>

            <div class="form-field">
              <label class="field-label">Data început</label>
              <DatePicker
                v-model="subscriptionForm.startDate"
                date-format="dd.mm.yy"
                show-icon
                fluid
                input-id="subscription-start-date"
                data-testid="subscription-start-date"
              />
            </div>

            <div class="form-field">
              <label class="field-label">Data sfârșit</label>
              <DatePicker
                v-model="subscriptionForm.endDate"
                date-format="dd.mm.yy"
                show-icon
                fluid
                input-id="subscription-end-date"
                data-testid="subscription-end-date"
              />
            </div>

            <div class="form-field">
              <label class="field-label">Preț</label>
              <InputNumber
                v-model="subscriptionForm.price"
                mode="currency"
                currency="RON"
                locale="ro-RO"
                :min="0"
                :max-fraction-digits="2"
                :use-grouping="false"
                fluid
                input-id="subscription-price"
                data-testid="subscription-price"
              />
            </div>

            <div class="form-field">
              <label class="field-label">Notițe</label>
              <InputText
                v-model="subscriptionForm.notes"
                maxlength="500"
                placeholder="Detalii opționale"
                data-testid="subscription-notes"
              />
            </div>

            <div>
              <Button
                type="submit"
                label="Adaugă abonament"
                icon="pi pi-plus"
                :loading="submittingSubscription"
                data-testid="subscription-submit"
              />
            </div>
          </form>
        </template>
      </template>
    </Card>

    <Card>
      <template #title>Plăți</template>
      <template #content>
        <div v-if="loadingPhaseThree" class="skeleton-stack">
          <Skeleton height="2.5rem" />
          <Skeleton height="2.5rem" />
          <Skeleton height="2.5rem" />
        </div>

        <template v-else>
          <DataTable :value="payments" data-testid="payments-table">
            <template #empty>
              Nu există plăți înregistrate pentru acest client.
            </template>

            <Column header="Data">
              <template #body="{ data }">
                {{ formatDate(data.paymentDate) }}
              </template>
            </Column>
            <Column header="Suma">
              <template #body="{ data }">
                {{ formatCurrency(data.amount) }}
              </template>
            </Column>
            <Column header="Metodă">
              <template #body="{ data }">
                {{ paymentMethodLabel(data.method) }}
              </template>
            </Column>
            <Column field="notes" header="Notițe" />
          </DataTable>

          <form class="form-grid" @submit.prevent="onCreatePayment">
            <div class="form-field">
              <label class="field-label">Abonament</label>
              <Select
                v-model="paymentForm.subscriptionId"
                :options="subscriptionSelectOptions"
                option-label="label"
                option-value="value"
                placeholder="Selectați abonamentul"
                fluid
                input-id="payment-subscription"
                data-testid="payment-subscription"
              />
            </div>

            <div class="form-field">
              <label class="field-label">Sumă</label>
              <InputNumber
                v-model="paymentForm.amount"
                mode="currency"
                currency="RON"
                locale="ro-RO"
                :min="0.01"
                :max-fraction-digits="2"
                :use-grouping="false"
                fluid
                input-id="payment-amount"
                data-testid="payment-amount"
              />
            </div>

            <div class="form-field">
              <label class="field-label">Data plății</label>
              <DatePicker
                v-model="paymentForm.paymentDate"
                date-format="dd.mm.yy"
                show-icon
                fluid
                input-id="payment-date"
                data-testid="payment-date"
              />
            </div>

            <div class="form-field">
              <label class="field-label">Metodă</label>
              <Select
                v-model="paymentForm.method"
                :options="paymentMethodOptions"
                option-label="label"
                option-value="value"
                fluid
                input-id="payment-method"
                data-testid="payment-method"
              />
            </div>

            <div class="form-field">
              <label class="field-label">Notițe</label>
              <InputText
                v-model="paymentForm.notes"
                maxlength="500"
                placeholder="Detalii opționale"
                data-testid="payment-notes"
              />
            </div>

            <div>
              <Button
                type="submit"
                label="Înregistrează plată"
                icon="pi pi-plus"
                :loading="submittingPayment"
                :disabled="subscriptions.length === 0"
                data-testid="payment-submit"
              />
            </div>
          </form>
        </template>
      </template>
    </Card>
  </div>
</template>
