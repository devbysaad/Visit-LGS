import React, { useEffect } from 'react'
import styled from 'styled-components'
import { SignIn, UserButton, useAuth, useUser } from '@clerk/clerk-react'
import Alert from '@mui/material/Alert'
import { useAppDispatch, useAppSelector } from '../hooks'
import {
  setAuthError,
  setAuthLoading,
  setAuthSuccess,
  setSupabaseSynced,
  syncClerkSession,
} from '../stores/AuthStore'

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 620;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at top, #2f3251 0%, #0e101c 70%);
  padding: 24px;
`

const Card = styled.div`
  width: min(480px, 100%);
  background: #222639;
  border: 1px solid #3ad4ce55;
  border-radius: 16px;
  padding: 28px 24px 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
  color: #eef1f6;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`

const Brand = styled.div`
  text-align: center;

  h1 {
    margin: 0;
    font-size: 1.6rem;
  }

  p {
    margin: 6px 0 0;
    color: #9aa3b8;
    font-size: 0.9rem;
  }
`

const Hint = styled.div`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  background: #c9a22718;
  border: 1px solid #c9a22755;
  color: #f0e2a8;
  font-size: 12.5px;
  line-height: 1.45;
  text-align: left;
`

const SignedInBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: #9aa3b8;
  font-size: 14px;
`

function ClerkSync() {
  const { isSignedIn, getToken } = useAuth()
  const { user } = useUser()
  const dispatch = useAppDispatch()
  const authenticated = useAppSelector((state) => state.auth.authenticated)

  useEffect(() => {
    if (!isSignedIn || !user || authenticated) return
    let cancelled = false
    ;(async () => {
      dispatch(setAuthLoading())
      try {
        const data = await syncClerkSession(() => getToken())
        if (cancelled) return
        dispatch(
          setAuthSuccess({
            clerkId: data.user.clerkId,
            email: data.user.email,
            displayName: data.user.displayName,
            imageUrl: data.user.imageUrl,
          })
        )
        dispatch(setSupabaseSynced(!data.supabase.skipped))
        if (data.supabase.skipped) {
          console.warn('[auth] Supabase sync skipped:', data.supabase.reason)
        }
      } catch (error) {
        if (!cancelled) {
          dispatch(setAuthError(error instanceof Error ? error.message : 'Sign-in sync failed'))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isSignedIn, user, authenticated, getToken, dispatch])

  return null
}

function ClerkAuthBody() {
  const { isSignedIn, isLoaded } = useAuth()
  const authenticated = useAppSelector((state) => state.auth.authenticated)
  const error = useAppSelector((state) => state.auth.error)
  const status = useAppSelector((state) => state.auth.status)

  if (authenticated) return null

  return (
    <Backdrop>
      <Card>
        <Brand>
          <h1>CampusQuest</h1>
          <p>LGS Wah Cantt · Gudwal</p>
        </Brand>
        <Hint>
          Sign in with Clerk (enable Google, email magic link, etc. in the Clerk dashboard). No
          college student ID required yet — profiles sync to Supabase Postgres after login.
        </Hint>

        {error && (
          <Alert severity="warning" sx={{ width: '100%', background: '#c9a22722', color: '#f0e2a8' }}>
            {error}
          </Alert>
        )}

        {!isLoaded && <p style={{ color: '#9aa3b8' }}>Loading Clerk…</p>}

        {isLoaded && !isSignedIn && (
          <>
            <SignIn
              routing="hash"
              appearance={{
                variables: {
                  colorPrimary: '#33ac96',
                  colorBackground: '#222639',
                  colorText: '#eef1f6',
                },
              }}
            />
            <p style={{ color: '#9aa3b8', fontSize: 13, margin: 0 }}>
              New here? Use the Sign up link inside the Clerk form.
            </p>
          </>
        )}

        {isLoaded && isSignedIn && (
          <>
            <ClerkSync />
            <SignedInBar>
              <UserButton afterSignOutUrl="/" />
              <span>
                {status === 'loading' ? 'Connecting your account…' : 'Signed in — finishing setup…'}
              </span>
            </SignedInBar>
          </>
        )}
      </Card>
    </Backdrop>
  )
}

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined

/**
 * Clerk-hosted sign-in. Configure providers in the Clerk dashboard — no custom password forms.
 */
export default function AuthScreen() {
  const authenticated = useAppSelector((state) => state.auth.authenticated)
  if (authenticated) return null

  if (!publishableKey) {
    return (
      <Backdrop>
        <Card>
          <Brand>
            <h1>CampusQuest</h1>
            <p>Clerk setup required</p>
          </Brand>
          <Hint>
            Add <code>VITE_CLERK_PUBLISHABLE_KEY</code> to <code>client/.env</code> and{' '}
            <code>CLERK_SECRET_KEY</code> to the root <code>.env</code>. Full list:{' '}
            <code>docs/ENV.md</code> and <code>.env.example</code>.
          </Hint>
        </Card>
      </Backdrop>
    )
  }

  return <ClerkAuthBody />
}
