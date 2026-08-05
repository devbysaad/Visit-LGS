/**
 * Lightweight client-side moderation for names and chat. This is a courtesy filter for a
 * school orientation tool, not a security boundary — there is no account/auth system
 * (see AGENTS.md non-negotiables), so treat this as reducing accidental abuse, not
 * preventing a determined bad actor.
 */

export const MAX_NAME_LENGTH = 16
export const MAX_CHAT_LENGTH = 200
export const MAX_NOTICE_LENGTH = 280

// Deliberately short and generic; extend if staff report a real problem.
const BLOCKED_WORDS = ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'slut', 'nigger', 'faggot']

function censorBlockedWords(input: string): string {
  let result = input
  BLOCKED_WORDS.forEach((word) => {
    const pattern = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    result = result.replace(pattern, (match) => '*'.repeat(match.length))
  })
  return result
}

export function sanitizeName(rawName: string): string {
  const trimmed = rawName.trim().slice(0, MAX_NAME_LENGTH)
  return censorBlockedWords(trimmed)
}

export function sanitizeChatMessage(rawMessage: string): string {
  const trimmed = rawMessage.trim().slice(0, MAX_CHAT_LENGTH)
  return censorBlockedWords(trimmed)
}

export function sanitizeNoticePost(rawMessage: string): string {
  const trimmed = rawMessage.trim().slice(0, MAX_NOTICE_LENGTH)
  return censorBlockedWords(trimmed)
}
