import axios from 'axios'

export function resolveApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  const message = error.response?.data?.message

  if (Array.isArray(message)) {
    return message.join(', ')
  }

  if (typeof message === 'string' && message.trim().length > 0) {
    return message
  }

  return fallback
}
