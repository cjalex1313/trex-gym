import { http } from '@/services/http'
import type {
  CreateSubscriptionPayload,
  Subscription,
  UpdateSubscriptionPayload,
} from '@/types/domain'

export async function listClientSubscriptions(clientId: string) {
  const { data } = await http.get<Subscription[]>(`/clients/${clientId}/subscriptions`)
  return data
}

export async function createClientSubscription(clientId: string, payload: CreateSubscriptionPayload) {
  const { data } = await http.post<Subscription>(`/clients/${clientId}/subscriptions`, payload)
  return data
}

export async function updateSubscription(subscriptionId: string, payload: UpdateSubscriptionPayload) {
  const { data } = await http.put<Subscription>(`/subscriptions/${subscriptionId}`, payload)
  return data
}
