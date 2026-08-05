import { PrismaClient } from '@prisma/client'

/**
 * Shared Prisma client for the Colyseus/Express server.
 * Uses DATABASE_URL (transaction pooler). Migrations use DIRECT_URL via schema.prisma.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export function isPrismaConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

export interface ProfileUpsert {
  clerk_id: string
  email?: string | null
  display_name?: string | null
  avatar_url?: string | null
}

/** Upsert a player profile keyed by Clerk user id. No-op if DATABASE_URL is missing. */
export async function upsertProfile(profile: ProfileUpsert) {
  if (!isPrismaConfigured()) {
    return { skipped: true as const, reason: 'DATABASE_URL is not set' }
  }

  const row = await prisma.profile.upsert({
    where: { clerkId: profile.clerk_id },
    create: {
      clerkId: profile.clerk_id,
      email: profile.email ?? null,
      displayName: profile.display_name ?? null,
      avatarUrl: profile.avatar_url ?? null,
    },
    update: {
      email: profile.email ?? null,
      displayName: profile.display_name ?? null,
      avatarUrl: profile.avatar_url ?? null,
    },
  })

  return {
    skipped: false as const,
    profile: {
      id: row.id,
      clerk_id: row.clerkId,
      email: row.email,
      display_name: row.displayName,
      avatar_url: row.avatarUrl,
      created_at: row.createdAt.toISOString(),
      updated_at: row.updatedAt.toISOString(),
    },
  }
}
