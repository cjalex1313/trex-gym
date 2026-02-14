<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import Skeleton from 'primevue/skeleton'
import { useToast } from 'primevue/usetoast'
import { createClient, getClient, updateClient } from '@/services/clients.api'
import { resolveApiErrorMessage } from '@/utils/api-error'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isEdit = computed(() => route.name === 'clients-edit')

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
})

const errors = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  general: '',
})

const loading = ref(false)
const saving = ref(false)
const generatedPin = ref('')
const pinDialogVisible = ref(false)
const createdClientId = ref('')

function resetErrors() {
  errors.firstName = ''
  errors.lastName = ''
  errors.email = ''
  errors.phone = ''
  errors.general = ''
}

function validateForm() {
  resetErrors()

  if (!form.firstName.trim()) {
    errors.firstName = 'Prenumele este obligatoriu.'
  }

  if (!form.lastName.trim()) {
    errors.lastName = 'Numele este obligatoriu.'
  }

  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
    errors.email = 'Introduceți un email valid.'
  }

  if (!/^\+?[0-9]{8,15}$/.test(form.phone.trim())) {
    errors.phone = 'Numărul de telefon trebuie să aibă între 8 și 15 cifre.'
  }

  return !errors.firstName && !errors.lastName && !errors.email && !errors.phone
}

async function loadClientForEdit() {
  if (!isEdit.value) {
    return
  }

  loading.value = true

  try {
    const client = await getClient(String(route.params.id))
    form.firstName = client.firstName
    form.lastName = client.lastName
    form.email = client.email
    form.phone = client.phone
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Eroare',
      detail: resolveApiErrorMessage(error, 'Nu am putut încărca datele clientului.'),
      life: 4000,
    })
    router.replace({ name: 'clients-list' })
  } finally {
    loading.value = false
  }
}

async function onSubmit() {
  if (saving.value || !validateForm()) {
    return
  }

  saving.value = true

  try {
    if (isEdit.value) {
      await updateClient(String(route.params.id), {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      })

      toast.add({
        severity: 'success',
        summary: 'Client actualizat',
        detail: 'Datele clientului au fost salvate.',
        life: 3000,
      })

      await router.push({ name: 'clients-detail', params: { id: String(route.params.id) } })
      return
    }

    const response = await createClient({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    })

    generatedPin.value = response.generatedPin
    createdClientId.value = response.client._id
    pinDialogVisible.value = true

    toast.add({
      severity: 'success',
      summary: 'Client adăugat',
      detail: 'Clientul a fost creat cu succes.',
      life: 3000,
    })
  } catch (error) {
    errors.general = resolveApiErrorMessage(error, 'Nu am putut salva clientul.')
  } finally {
    saving.value = false
  }
}

function goToCreatedClient() {
  pinDialogVisible.value = false
  router.push({ name: 'clients-detail', params: { id: createdClientId.value } })
}

function goBack() {
  if (isEdit.value) {
    router.push({ name: 'clients-detail', params: { id: String(route.params.id) } })
    return
  }

  router.push({ name: 'clients-list' })
}

onMounted(async () => {
  await loadClientForEdit()
})
</script>

<template>
  <div class="page-stack" data-testid="client-form-page">
    <Button
      label="Înapoi"
      icon="pi pi-arrow-left"
      severity="secondary"
      text
      class="inline-button"
      @click="goBack"
    />

    <Card>
      <template #title>{{ isEdit ? 'Editează client' : 'Adaugă client' }}</template>
      <template #content>
        <div v-if="loading" class="skeleton-stack">
          <Skeleton height="2.6rem" />
          <Skeleton height="2.6rem" />
          <Skeleton height="2.6rem" />
          <Skeleton height="2.6rem" />
        </div>

        <form v-else class="form-grid" @submit.prevent="onSubmit">
          <div class="form-field">
            <label class="field-label" for="firstName">Prenume</label>
            <InputText id="firstName" v-model="form.firstName" placeholder="Ion" data-testid="client-first-name" />
            <small v-if="errors.firstName" class="field-error">{{ errors.firstName }}</small>
          </div>

          <div class="form-field">
            <label class="field-label" for="lastName">Nume</label>
            <InputText id="lastName" v-model="form.lastName" placeholder="Popescu" data-testid="client-last-name" />
            <small v-if="errors.lastName" class="field-error">{{ errors.lastName }}</small>
          </div>

          <div class="form-field">
            <label class="field-label" for="email">Email</label>
            <InputText
              id="email"
              v-model="form.email"
              type="email"
              placeholder="client@exemplu.ro"
              data-testid="client-email"
            />
            <small v-if="errors.email" class="field-error">{{ errors.email }}</small>
          </div>

          <div class="form-field">
            <label class="field-label" for="phone">Telefon</label>
            <InputText id="phone" v-model="form.phone" placeholder="+40700111222" data-testid="client-phone" />
            <small v-if="errors.phone" class="field-error">{{ errors.phone }}</small>
          </div>

          <Message v-if="errors.general" severity="error" size="small" variant="simple">
            {{ errors.general }}
          </Message>

          <Button
            type="submit"
            :label="isEdit ? 'Salvează modificările' : 'Creează client'"
            :loading="saving"
            data-testid="client-submit"
          />
        </form>
      </template>
    </Card>

    <Dialog
      v-model:visible="pinDialogVisible"
      modal
      header="Client creat"
      :style="{ width: '26rem' }"
      :closable="false"
    >
      <div class="page-stack">
        <p>PIN-ul generat pentru autentificare este:</p>
        <strong class="pin-value" data-testid="generated-pin">{{ generatedPin }}</strong>
        <small>Comunicați acest PIN clientului în siguranță.</small>
      </div>
      <template #footer>
        <Button label="Vezi detalii client" @click="goToCreatedClient" data-testid="view-created-client" />
      </template>
    </Dialog>
  </div>
</template>
