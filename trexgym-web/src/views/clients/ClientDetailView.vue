<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { getClient } from '@/services/clients.api'
import type { Client, ClientStatus } from '@/types/domain'
import { resolveApiErrorMessage } from '@/utils/api-error'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(false)
const client = ref<Client | null>(null)

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

onMounted(async () => {
  await loadClient()
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
        <p>Nu există date disponibile în această etapă.</p>
      </template>
    </Card>

    <Card>
      <template #title>Plăți</template>
      <template #content>
        <p>Nu există date disponibile în această etapă.</p>
      </template>
    </Card>
  </div>
</template>
