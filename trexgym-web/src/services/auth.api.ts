import { http } from '@/services/http'
import type { AuthResponse } from '@/types/domain'

interface AdminLoginPayload {
  email: string
  password: string
}

export async function loginAdmin(payload: AdminLoginPayload) {
  const { data } = await http.post<AuthResponse>('/auth/admin/login', payload)
  return data
}
