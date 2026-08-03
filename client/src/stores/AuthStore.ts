import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AuthUser {
  clerkId: string
  email: string | null
  displayName: string
  imageUrl?: string | null
}

export const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null as AuthUser | null,
    authenticated: false,
    status: 'idle' as 'idle' | 'loading' | 'ready' | 'error',
    error: null as string | null,
    supabaseSynced: false,
  },
  reducers: {
    setAuthLoading: (state) => {
      state.status = 'loading'
      state.error = null
    },
    setAuthSuccess: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload
      state.authenticated = true
      state.status = 'ready'
      state.error = null
    },
    setAuthError: (state, action: PayloadAction<string>) => {
      state.status = 'error'
      state.error = action.payload
    },
    setSupabaseSynced: (state, action: PayloadAction<boolean>) => {
      state.supabaseSynced = action.payload
    },
    clearAuthError: (state) => {
      state.error = null
    },
    logout: (state) => {
      state.user = null
      state.authenticated = false
      state.status = 'idle'
      state.error = null
      state.supabaseSynced = false
    },
  },
})

export const {
  setAuthLoading,
  setAuthSuccess,
  setAuthError,
  setSupabaseSynced,
  clearAuthError,
  logout,
} = authSlice.actions

export default authSlice.reducer

function apiBase(): string {
  if (import.meta.env.PROD) {
    const ws = import.meta.env.VITE_SERVER_URL as string | undefined
    if (ws) return ws.replace(/^ws/, 'http')
  }
  return `${window.location.protocol}//${window.location.hostname}:2567`
}

/** Push Clerk session to our server → verifies JWT + upserts Supabase profile. */
export async function syncClerkSession(getToken: () => Promise<string | null>) {
  const token = await getToken()
  if (!token) throw new Error('No Clerk session token')

  const res = await fetch(`${apiBase()}/auth/sync`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Auth sync failed')
  return data as {
    ok: boolean
    user: { clerkId: string; email: string | null; displayName: string; imageUrl?: string }
    supabase: { skipped: boolean; reason?: string }
  }
}
