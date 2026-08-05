/**
 * @deprecated Prefer `server/prisma.ts` — profiles now go through Prisma + DATABASE_URL.
 * Kept so any leftover imports keep working during the switch.
 */
export { upsertProfile, type ProfileUpsert } from './prisma'
