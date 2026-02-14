export type UserRole = 'admin' | 'client'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}

export interface AuthResponse {
  user: AuthUser
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
}

export type ClientStatus = 'active' | 'inactive' | 'suspended' | 'invited'

export interface Client {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: ClientStatus
  createdAt: string
  updatedAt: string
}

export interface ListClientsResponse {
  items: Client[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateClientPayload {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface UpdateClientPayload {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  status?: ClientStatus
}

export interface CreateClientResponse {
  client: Client
  generatedPin: string
}
