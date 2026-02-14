import { http } from '@/services/http'
import type {
  Client,
  CreateClientPayload,
  CreateClientResponse,
  ListClientsResponse,
  UpdateClientPayload,
} from '@/types/domain'

interface ListClientsParams {
  page: number
  limit: number
  search?: string
}

export async function listClients(params: ListClientsParams) {
  const { data } = await http.get<ListClientsResponse>('/clients', { params })
  return data
}

export async function getClient(id: string) {
  const { data } = await http.get<Client>(`/clients/${id}`)
  return data
}

export async function createClient(payload: CreateClientPayload) {
  const { data } = await http.post<CreateClientResponse>('/clients', payload)
  return data
}

export async function updateClient(id: string, payload: UpdateClientPayload) {
  const { data } = await http.put<Client>(`/clients/${id}`, payload)
  return data
}

export async function suspendClient(id: string) {
  const { data } = await http.delete<Client>(`/clients/${id}`)
  return data
}
