import { defineStore } from 'pinia'
import { ref } from 'vue'

const API_BASE    = import.meta.env.VITE_API_URL ?? ''
const STORAGE_KEY = 'hiking_auth'

export interface AuthUser {
  email:     string
  name:      string
  avatarUrl: string
}

export const useAuthStore = defineStore('auth', () => {
  const user  = ref<AuthUser | null>(null)
  const token = ref<string | null>(null)

  function init() {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as { token: string; user: AuthUser }
      token.value = parsed.token
      user.value  = parsed.user
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  async function login() {
    const res  = await fetch(`${API_BASE}/api/auth/url`)
    const data = await res.json() as { url: string; state: string }
    sessionStorage.setItem('oauth_state', data.state)
    window.location.href = data.url
  }

  async function handleCallback(code: string, state: string) {
    const expected = sessionStorage.getItem('oauth_state')
    if (state !== expected) throw new Error('Invalid state — possible CSRF')
    sessionStorage.removeItem('oauth_state')

    const res = await fetch(`${API_BASE}/api/auth/exchange`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ code, state }),
    })
    if (!res.ok) throw new Error(`Exchange failed: ${await res.text()}`)

    const data = await res.json() as { token: string; email: string; name: string; avatarUrl: string }
    token.value = data.token
    user.value  = { email: data.email, name: data.name, avatarUrl: data.avatarUrl }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: data.token, user: user.value }))
  }

  function logout() {
    user.value  = null
    token.value = null
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem('oauth_state')
  }

  return { user, token, init, login, handleCallback, logout }
})
