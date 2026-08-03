import { Router, Request, Response } from 'express'
import { createClerkClient, verifyToken } from '@clerk/backend'
import { upsertProfile } from './supabase'

function getBearer(req: Request): string | null {
  const header = req.headers.authorization || ''
  if (header.startsWith('Bearer ')) return header.slice(7)
  return null
}

export function createClerkAuthRouter(): Router {
  const router = Router()

  router.get('/status', (_req, res) => {
    res.json({
      clerkConfigured: Boolean(process.env.CLERK_SECRET_KEY),
      supabaseConfigured: Boolean(
        process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ),
    })
  })

  /**
   * Verify Clerk session JWT and upsert profile into Supabase Postgres.
   * Client calls this after SignIn with getToken().
   */
  router.post('/sync', async (req: Request, res: Response) => {
    try {
      const secret = process.env.CLERK_SECRET_KEY
      if (!secret) {
        return res.status(503).json({
          error: 'CLERK_SECRET_KEY is not set on the server. Add it to .env — see .env.example.',
        })
      }

      const token = getBearer(req)
      if (!token) {
        return res.status(401).json({ error: 'Missing Authorization Bearer token from Clerk.' })
      }

      const payload = await verifyToken(token, { secretKey: secret })
      const clerkId = String(payload.sub)

      const clerk = createClerkClient({ secretKey: secret })
      const user = await clerk.users.getUser(clerkId)
      const email =
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
        user.emailAddresses[0]?.emailAddress ||
        null
      const displayName =
        [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
        user.username ||
        email?.split('@')[0] ||
        'Player'

      const result = await upsertProfile({
        clerk_id: clerkId,
        email,
        display_name: displayName,
        avatar_url: user.imageUrl,
      })

      return res.json({
        ok: true,
        user: {
          clerkId,
          email,
          displayName,
          imageUrl: user.imageUrl,
        },
        supabase: result,
      })
    } catch (error) {
      console.error('[auth/sync]', error)
      return res.status(401).json({
        error: error instanceof Error ? error.message : 'Invalid or expired Clerk session',
      })
    }
  })

  return router
}
