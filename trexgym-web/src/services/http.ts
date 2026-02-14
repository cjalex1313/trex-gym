import axios from 'axios'
import { AUTH_STORAGE_KEY } from '@/constants/auth'

interface AuthStorageData {
  accessToken: string
  refreshToken: string
}

function readAccessToken() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const data = JSON.parse(raw) as Partial<AuthStorageData>
    return data.accessToken ?? null
  } catch {
    return null
  }
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
  timeout: 10000,
})

http.interceptors.request.use((config) => {
  const token = readAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status

    if (status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)
