/**
 * LGS Gudwal scavenger facts — SERVER ONLY. Never import from client/.
 */
export type EggKind = 'fact' | 'myth' | 'lore'

export interface Egg {
  id: string
  kind: EggKind
  place?: string
  building?: string
  room?: string
  prompt: string
  accept: string[]
  hint: string
  reveal: string
  source: string
  needsLocalCheck?: boolean
}

export const EGGS: Egg[] = [
  {
    id: 'cq-gate-start',
    kind: 'lore',
    place: 'main-gate',
    prompt: 'Orientation tip: which key opens chat in CampusQuest?',
    accept: ['enter', 'return', 'ent'],
    hint: 'Same key most messengers use to send.',
    reveal: 'Press Enter to open chat; Esc closes overlays. Movement uses WASD or arrows.',
    source: 'student lore: CampusQuest controls (in-game help)',
    needsLocalCheck: true,
  },
  {
    id: 'cq-forms-desk',
    kind: 'fact',
    building: 'a-level-block',
    room: 'accounts-office',
    place: 'a-level-block reception corridor',
    prompt: 'Where do students usually go first for certificates and official letters?',
    accept: ['admin', 'admin office', 'office', 'administration'],
    hint: 'Forms and records — the O-Level Block east column, not the canteen.',
    reveal: 'Admin Office handles certificates, letters, and admissions follow-ups. Bring your student ID.',
    source: 'student lore: LGS orientation briefing placeholder — confirm with Gudwal office',
    needsLocalCheck: true,
  },
  {
    id: 'cq-library-quiet',
    kind: 'myth',
    building: 'a-level-block',
    room: 'a-library',
    place: 'a-level-block wing library',
    prompt: 'Are phones on speaker allowed in the library reading area?',
    accept: ['no', 'never', 'not allowed', 'mute only', 'forbidden'],
    hint: 'Think about quiet-study house rules.',
    reveal: 'No — keep phones muted. Issue desk closes shortly before the final bell.',
    source: 'student lore: typical LGS library house rules — confirm with librarian',
    needsLocalCheck: true,
  },
  {
    id: 'cq-fee-hours',
    kind: 'fact',
    place: 'parking bay by the main gate',
    prompt: 'What should you keep after every fee payment?',
    accept: ['receipt', 'receipts', 'slip', 'challan copy', 'fee slip'],
    hint: 'Paper proof — accounts will ask for it later.',
    reveal: 'Always keep your fee receipt/challan copy. Peak queues hit near term start.',
    source: 'student lore: accounts desk guidance — confirm with fee counter',
    needsLocalCheck: true,
  },
  {
    id: 'cq-lab-rule',
    kind: 'fact',
    building: 'a-level-block',
    room: 'a-physics-lab',
    place: 'a-level-block physics lab',
    prompt: 'Should students enter science practicals without a teacher present?',
    accept: ['no', 'never', 'false', 'not alone', 'unsupervised no'],
    hint: 'Safety first — posted kit and supervision.',
    reveal: 'Never enter unsupervised practicals. Follow posted lab coats/goggles rules.',
    source: 'student lore: science lab safety — confirm with lab staff',
    needsLocalCheck: true,
  },
  {
    id: 'cq-canteen-manners',
    kind: 'lore',
    building: 'o-level-block',
    room: 'canteen-hall',
    place: 'o-level-block canteen',
    prompt: 'Name one polite habit expected at the canteen.',
    accept: ['queue', 'line', 'no litter', 'bin trash', 'tidy'],
    hint: 'Either take your turn calmly, or clean up after snacks.',
    reveal: 'Keep queues orderly and dispose of litter before you leave — small habits, big campus.',
    source: 'student lore: canteen house rules — confirm with staff',
    needsLocalCheck: true,
  },
]

export function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim()
}

export function matches(egg: Egg, guess: string): boolean {
  const g = normalise(guess)
  if (!g) return false
  return egg.accept.some((a) => normalise(a) === g)
}

const byId = new Map(EGGS.map((e) => [e.id, e]))

export function eggById(id: string): Egg | undefined {
  return byId.get(id)
}

export interface EggPublic {
  id: string
  kind: EggKind
  prompt: string
  hint: string
}

export function publicView(egg: Egg): EggPublic {
  return { id: egg.id, kind: egg.kind, prompt: egg.prompt, hint: egg.hint }
}

export function validateEggs(): void {
  const problems: string[] = []
  const seen = new Set<string>()
  for (const e of EGGS) {
    if (seen.has(e.id)) problems.push(`${e.id}: duplicate`)
    seen.add(e.id)
    if (!e.prompt.trim() || !e.hint.trim() || !e.reveal.trim()) problems.push(`${e.id}: empty fields`)
    if (e.accept.length < 2) problems.push(`${e.id}: need ≥2 accept spellings`)
    if (!(e.place || (e.building && e.room))) problems.push(`${e.id}: missing place`)
    for (const a of e.accept) {
      const n = normalise(a)
      if (n.length >= 4 && normalise(e.id).includes(n)) {
        problems.push(`${e.id}: id contains answer`)
      }
    }
  }
  if (problems.length) {
    console.error(problems)
    throw new Error('egg content failed validation')
  }
  console.log(`eggs: ${EGGS.length} loaded`)
}

export function assertNoLeak(): void {
  for (const e of EGGS) {
    const wire = JSON.stringify(publicView(e)).toLowerCase()
    for (const a of e.accept) {
      const n = normalise(a)
      if (n.length >= 4 && normalise(wire).includes(n)) {
        throw new Error(`egg ${e.id}: answer visible in public view`)
      }
    }
  }
}

validateEggs()
assertNoLeak()
