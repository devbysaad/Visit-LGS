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

import { surface, text, accent, font, radius, shadow, border, cq } from '../theme'

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 620;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse 80% 50% at 20% 0%, ${cq.coral}33 0%, transparent 55%),
    radial-gradient(ellipse 70% 60% at 100% 100%, ${cq.butter}22 0%, transparent 50%),
    linear-gradient(160deg, #0b1f24 0%, #123338 45%, #0b1f24 100%);
  padding: 24px;
  font-family: ${font.body};
`

const Card = styled.div`
  width: min(480px, 100%);
  background: ${surface.raised};
  border: 1px solid ${border.strong};
  border-radius: ${radius.lg};
  padding: 32px 28px 36px;
  box-shadow: ${shadow.panel};
  color: ${text.primary};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`

const Brand = styled.div`
  text-align: center;

  h1 {
    margin: 0;
    font-family: ${font.display};
    font-size: 2.4rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: ${accent.butter};
  }

  p {
    margin: 8px 0 0;
    color: ${text.muted};
    font-size: 0.95rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
`

const Hint = styled.div`
  width: 100%;
  padding: 12px 14px;
  border-radius: ${radius.sm};
  background: ${cq.coral}18;
  border: 1px solid ${border.mint};
  color: ${text.primary};
  font-size: 13px;
  line-height: 1.45;
  text-align: left;
`

const SignedInBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${text.muted};
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
          console.warn('[auth] Profile DB sync skipped:', data.supabase.reason)
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
          Sign in to walk the Gudwal campus — explore buildings, pin campus news, and crack
          orientation clues, and drive the campus car around the ring road.
        </Hint>

        {error && (
          <Alert severity="warning" sx={{ width: '100%', background: '#fb718522', color: '#fda4af' }}>
            {error}
          </Alert>
        )}

        {!isLoaded && <p style={{ color: '#94b0b4' }}>Loading Clerk…</p>}

        {isLoaded && !isSignedIn && (
          <>
            <SignIn
              routing="hash"
              appearance={{
                variables: {
                  colorPrimary: '#fb7185',
                  colorBackground: '#123338',
                  colorText: '#e0f2f1',
                  borderRadius: '14px',
                  fontFamily: 'Manrope, sans-serif',
                },
              }}
            />
            <p style={{ color: '#94b0b4', fontSize: 13, margin: 0 }}>
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
