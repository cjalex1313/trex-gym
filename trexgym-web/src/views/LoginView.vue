<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import { resolveApiErrorMessage } from '@/utils/api-error'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

const loading = ref(false)
const formError = ref('')

function validateForm() {
  if (!form.email.trim()) {
    formError.value = 'Email-ul este obligatoriu.'
    return false
  }

  if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    formError.value = 'Introduceți un email valid.'
    return false
  }

  if (form.password.trim().length < 6) {
    formError.value = 'Parola trebuie să conțină cel puțin 6 caractere.'
    return false
  }

  formError.value = ''
  return true
}

async function onSubmit() {
  if (loading.value || !validateForm()) {
    return
  }

  loading.value = true

  try {
    await authStore.login(form.email.trim(), form.password)
    toast.add({
      severity: 'success',
      summary: 'Autentificare reușită',
      detail: 'Bine ați revenit în dashboard.',
      life: 3000,
    })
    await router.replace({ name: 'clients-list' })
  } catch (error) {
    formError.value = resolveApiErrorMessage(error, 'Autentificare eșuată. Verificați datele introduse.')
    toast.add({
      severity: 'error',
      summary: 'Eroare',
      detail: formError.value,
      life: 4000,
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page" data-testid="login-page">
    <Card class="login-card">
      <template #title>Autentificare administrator</template>
      <template #content>
        <form class="login-form" @submit.prevent="onSubmit">
          <label class="field-label" for="email">Email</label>
          <InputText
            id="email"
            v-model="form.email"
            type="email"
            placeholder="email@exemplu.ro"
            data-testid="login-email"
          />

          <label class="field-label" for="password">Parolă</label>
          <Password
            id="password"
            v-model="form.password"
            input-class="full-width"
            :feedback="false"
            toggle-mask
            fluid
            placeholder="Introduceți parola"
          />

          <Message v-if="formError" severity="error" size="small" variant="simple">{{ formError }}</Message>

          <Button type="submit" label="Conectare" :loading="loading" fluid data-testid="login-submit" />
        </form>
      </template>
    </Card>
  </div>
</template>
