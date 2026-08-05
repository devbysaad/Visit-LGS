export interface Building {
  id: string
  name: string
  tagline: string
  description: string
  photo?: string
  whoToAsk?: string
}

/** A shelf book in the library — pages turn in the reader UI. */
export interface LibraryBook {
  id: string
  title: string
  author: string
  blurb: string
  pages: string[]
}

/** Staff-pinned notice shown above player posts on the shared board. */
export interface StaffNotice {
  id: string
  title: string
  body: string
}

/** Interior room inside an enterable building (walk in through the door). */
export interface CampusRoom {
  id: string
  buildingId: string
  name: string
  tagline: string
  description: string
}

export interface Npc {
  id: string
  name: string
  location: string
  dialogue: string[]
  questHook?: string
}

export type QuestTargetType = 'building' | 'npc'

export interface QuestStep {
  id: string
  objective: string
  targetType: QuestTargetType
  targetId: string
  completionLine: string
}

export interface Quest {
  id: string
  contentVersion: string
  intro: string
  reward: string
  steps: QuestStep[]
}
