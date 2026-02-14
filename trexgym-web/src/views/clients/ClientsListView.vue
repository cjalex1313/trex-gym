<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import DataTable, { type DataTablePageEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import { useToast } from 'primevue/usetoast'
import { listClients, suspendClient } from '@/services/clients.api'
import type { Client, ClientStatus } from '@/types/domain'
import { resolveApiErrorMessage } from '@/utils/api-error'

const router = useRouter()
const toast = useToast()

const clients = ref<Client[]>([])
const loading = ref(false)
const query = reactive({
  page: 1,
  limit: 10,
  search: '',
  total: 0,
})

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

async function loadClients() {
  loading.value = true

  try {
    const response = await listClients({
      page: query.page,
      limit: query.limit,
      search: query.search.trim() || undefined,
    })

    clients.value = response.items
    query.total = response.pagination.total
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Eroare',
      detail: resolveApiErrorMessage(error, 'Nu am putut încărca lista de clienți.'),
      life: 4000,
    })
  } finally {
    loading.value = false
  }
}

async function onSuspend(client: Client) {
  const confirmed = window.confirm(
    `Sigur doriți să suspendați clientul ${client.firstName} ${client.lastName}?`,
  )

  if (!confirmed) {
    return
  }

  try {
    await suspendClient(client._id)
    toast.add({
      severity: 'success',
      summary: 'Client suspendat',
      detail: 'Statusul clientului a fost actualizat.',
      life: 3000,
    })
    await loadClients()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Eroare',
      detail: resolveApiErrorMessage(error, 'Suspendarea clientului a eșuat.'),
      life: 4000,
    })
  }
}

async function onPageChange(event: DataTablePageEvent) {
  query.page = event.page + 1
  query.limit = event.rows
  await loadClients()
}

async function onSearch() {
  query.page = 1
  await loadClients()
}

function goToClientDetail(clientId: string) {
  router.push({ name: 'clients-detail', params: { id: clientId } })
}

function goToClientEdit(clientId: string) {
  router.push({ name: 'clients-edit', params: { id: clientId } })
}

onMounted(async () => {
  await loadClients()
})
</script>

<template>
  <Card data-testid="clients-list-page">
    <template #title>Clienți</template>
    <template #content>
      <div class="toolbar-row">
        <div class="search-row">
          <InputText
            v-model="query.search"
            class="search-input"
            placeholder="Caută după nume, email sau telefon"
            @keyup.enter="onSearch"
            data-testid="clients-search-input"
          />
          <Button
            label="Caută"
            icon="pi pi-search"
            severity="secondary"
            @click="onSearch"
            data-testid="clients-search-button"
          />
        </div>
        <Button
          label="Adaugă client"
          icon="pi pi-plus"
          @click="router.push({ name: 'clients-create' })"
          data-testid="clients-add-button"
        />
      </div>

      <div v-if="loading && clients.length === 0" class="skeleton-stack">
        <Skeleton height="2.5rem" />
        <Skeleton height="2.5rem" />
        <Skeleton height="2.5rem" />
        <Skeleton height="2.5rem" />
      </div>

      <DataTable
        v-else
        :value="clients"
        :loading="loading"
        paginator
        :rows="query.limit"
        :total-records="query.total"
        :first="(query.page - 1) * query.limit"
        @page="onPageChange"
      >
        <template #empty>
          Nu există clienți care să corespundă căutării.
        </template>

        <Column field="firstName" header="Prenume" sortable />
        <Column field="lastName" header="Nume" sortable />
        <Column field="email" header="Email" sortable />
        <Column field="phone" header="Telefon" />
        <Column header="Status">
          <template #body="{ data }">
            <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
          </template>
        </Column>
        <Column header="Acțiuni">
          <template #body="{ data }">
            <div class="action-row" :data-testid="`client-actions-${data._id}`">
              <Button
                icon="pi pi-eye"
                label="Detalii"
                severity="secondary"
                text
                @click="goToClientDetail(data._id)"
                :data-testid="`client-details-${data._id}`"
              />
              <Button
                icon="pi pi-pencil"
                label="Editează"
                severity="secondary"
                text
                @click="goToClientEdit(data._id)"
                :data-testid="`client-edit-${data._id}`"
              />
              <Button
                icon="pi pi-ban"
                label="Suspendă"
                severity="danger"
                text
                :disabled="data.status === 'suspended'"
                @click="onSuspend(data)"
                :data-testid="`client-suspend-${data._id}`"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>
</template>
