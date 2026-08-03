export interface Building {
  id: string
  name: string
  tagline: string
  description: string
  photo?: string
  whoToAsk?: string
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
