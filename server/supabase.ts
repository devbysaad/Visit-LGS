import { createClient, SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return client
}

export interface ProfileUpsert {
  clerk_id: string
  email?: string | null
  display_name?: string | null
  avatar_url?: string | null
}

/** Upsert a player profile keyed by Clerk user id. No-op if Supabase env is missing. */
export async function upsertProfile(profile: ProfileUpsert) {
  const sb = getSupabaseAdmin()
  if (!sb) {
    return { skipped: true as const, reason: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set' }
  }

  const { data, error } = await sb
    .from('profiles')
    .upsert(
      {
        clerk_id: profile.clerk_id,
        email: profile.email ?? null,
        display_name: profile.display_name ?? null,
        avatar_url: profile.avatar_url ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'clerk_id' }
    )
    .select()
    .single()

  if (error) throw error
  return { skipped: false as const, profile: data }
}
