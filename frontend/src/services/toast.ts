import { ref } from 'vue'

export interface ToastItem {
  id: string
  title?: string
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
  duration?: number
  link?: string
  createdAt: number
}

const toasts = ref<ToastItem[]>([])

export const useToast = () => {
  return { toasts }
}

export function showToast(options: {
  title?: string
  message: string
  type?: 'success' | 'info' | 'warning' | 'error'
  duration?: number
  link?: string
}) {
  const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
  const duration = options.duration ?? 4500
  const item: ToastItem = {
    id,
    title: options.title,
    message: options.message,
    type: options.type || 'info',
    duration,
    link: options.link,
    createdAt: Date.now()
  }

  // Maximum 4 simultaneous toasts
  if (toasts.value.length >= 4) {
    toasts.value.shift()
  }

  toasts.value.push(item)

  if (duration > 0) {
    setTimeout(() => {
      dismissToast(id)
    }, duration)
  }

  return id
}

export function dismissToast(id: string) {
  const idx = toasts.value.findIndex(t => t.id === id)
  if (idx !== -1) {
    toasts.value.splice(idx, 1)
  }
}

export function clearToasts() {
  toasts.value = []
}
