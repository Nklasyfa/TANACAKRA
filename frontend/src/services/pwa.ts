import { ref } from 'vue'

export const canInstall = ref(false)
export const isInstalled = ref(false)
const deferredPrompt = ref<any>(null)

export function initPwa() {
  if (typeof window === 'undefined') return

  // Register Service Worker
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope)
        })
        .catch(err => {
          console.warn('[PWA] Service Worker registration failed:', err)
        })
    })
  }

  // Check if already in standalone display mode (installed)
  if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
    isInstalled.value = true
  }

  // Listen for beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    canInstall.value = true
  })

  // Listen for appinstalled
  window.addEventListener('appinstalled', () => {
    deferredPrompt.value = null
    canInstall.value = false
    isInstalled.value = true
    console.log('[PWA] Tanacakra successfully installed')
  })
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt.value) return false
  try {
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    deferredPrompt.value = null
    canInstall.value = false
    return outcome === 'accepted'
  } catch (err) {
    console.warn('[PWA] Prompt error:', err)
    return false
  }
}
