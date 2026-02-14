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

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired'
export type SubscriptionPlanType = 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'custom'
export type CurrencyCode = 'RON' | 'EUR'

export interface Subscription {
  _id: string
  clientId: string
  planType: SubscriptionPlanType
  planName?: string | null
  startDate: string
  endDate: string
  status: SubscriptionStatus
  price: number
  currency: CurrencyCode
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateSubscriptionPayload {
  planType: SubscriptionPlanType
  planName?: string
  startDate: string
  endDate: string
  price: number
  currency?: CurrencyCode
  notes?: string
}

export interface UpdateSubscriptionPayload {
  planType?: SubscriptionPlanType
  planName?: string
  startDate?: string
  endDate?: string
  status?: SubscriptionStatus
  price?: number
  currency?: CurrencyCode
  notes?: string
}

export type PaymentMethod = 'cash' | 'card' | 'transfer'

export interface Payment {
  _id: string
  subscriptionId: string
  clientId: string
  amount: number
  paymentDate: string
  method: PaymentMethod
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreatePaymentPayload {
  amount: number
  paymentDate: string
  method: PaymentMethod
  notes?: string
}

export interface UpdatePaymentPayload {
  amount?: number
  paymentDate?: string
  method?: PaymentMethod
  notes?: string
}

export interface OutstandingPaymentItem {
  subscriptionId: string
  clientId: string
  clientName: string
  planType: SubscriptionPlanType
  planName?: string | null
  endDate: string
  totalPrice: number
  totalPaid: number
  outstandingAmount: number
  currency: CurrencyCode
  lastPaymentDate?: string
}
