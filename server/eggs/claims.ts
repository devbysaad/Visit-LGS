export interface ClaimResult {
  correct: boolean
  first: boolean
  solvedBy: number
  already: boolean
}

const solvers = new Map<string, string[]>()
const byPlayer = new Map<string, Set<string>>()

export function claim(eggId: string, sessionId: string): ClaimResult {
  const list = solvers.get(eggId) ?? []
  const mine = byPlayer.get(sessionId) ?? new Set<string>()

  if (mine.has(eggId)) {
    return { correct: true, first: list[0] === sessionId, solvedBy: list.length, already: true }
  }

  const first = list.length === 0
  list.push(sessionId)
  solvers.set(eggId, list)
  mine.add(eggId)
  byPlayer.set(sessionId, mine)

  return { correct: true, first, solvedBy: list.length, already: false }
}

export function solvedBy(sessionId: string): string[] {
  return [...(byPlayer.get(sessionId) ?? [])]
}

export function hasSolved(eggId: string, sessionId: string): boolean {
  return byPlayer.get(sessionId)?.has(eggId) ?? false
}

export function solveCounts(): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [eggId, list] of solvers) out[eggId] = list.length
  return out
}
