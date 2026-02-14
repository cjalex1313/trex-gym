import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { AUTH_STORAGE_KEY } from '@/constants/auth'
import { loginAdmin } from '@/services/auth.api'
import type { AuthUser } from '@/types/domain'

interface PersistedAuthState {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const accessToken = ref('')
  const refreshToken = ref('')
  const hydrated = ref(false)

  const isAuthenticated = computed(() => !!accessToken.value && user.value?.role === 'admin')

  function persist() {
    if (!user.value || !accessToken.value || !refreshToken.value) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return
    }

    const payload: PersistedAuthState = {
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
      user: user.value,
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload))
  }

  function hydrate() {
    if (hydrated.value) {
      return
    }

    const raw = localStorage.getItem(AUTH_STORAGE_KEY)

    if (!raw) {
      hydrated.value = true
      return
    }

    try {
      const data = JSON.parse(raw) as Partial<PersistedAuthState>
      user.value = data.user ?? null
      accessToken.value = data.accessToken ?? ''
      refreshToken.value = data.refreshToken ?? ''
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }

    hydrated.value = true
  }

  async function login(email: string, password: string) {
    const response = await loginAdmin({ email, password })
    user.value = response.user
    accessToken.value = response.accessToken
    refreshToken.value = response.refreshToken
    persist()
  }

  function logout() {
    user.value = null
    accessToken.value = ''
    refreshToken.value = ''
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  return {
    user,
    accessToken,
    refreshToken,
    hydrated,
    isAuthenticated,
    hydrate,
    login,
    logout,
  }
})
