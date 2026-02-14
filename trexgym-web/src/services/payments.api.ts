import { http } from '@/services/http'
import type {
  CreatePaymentPayload,
  OutstandingPaymentItem,
  Payment,
  UpdatePaymentPayload,
} from '@/types/domain'

export async function listSubscriptionPayments(subscriptionId: string) {
  const { data } = await http.get<Payment[]>(`/subscriptions/${subscriptionId}/payments`)
  return data
}

export async function createSubscriptionPayment(
  subscriptionId: string,
  payload: CreatePaymentPayload,
) {
  const { data } = await http.post<Payment>(`/subscriptions/${subscriptionId}/payments`, payload)
  return data
}

export async function updatePayment(paymentId: string, payload: UpdatePaymentPayload) {
  const { data } = await http.put<Payment>(`/payments/${paymentId}`, payload)
  return data
}

export async function deletePayment(paymentId: string) {
  const { data } = await http.delete<{ deleted: boolean; id: string }>(`/payments/${paymentId}`)
  return data
}

export async function listClientPayments(clientId: string) {
  const { data } = await http.get<Payment[]>(`/clients/${clientId}/payments`)
  return data
}

export async function listOutstandingPayments() {
  const { data } = await http.get<OutstandingPaymentItem[]>('/payments/outstanding')
  return data
}
