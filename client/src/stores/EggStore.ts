import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import phaserGame from '../PhaserGame'
import CampusScene from '../scenes/CampusScene'

export interface FoundEgg {
  id: string
  kind: 'fact' | 'myth' | 'lore'
  reveal: string
  source: string
  first: boolean
}

interface EggState {
  dialogOpen: boolean
  eggId: string | null
  prompt: string
  hint: string
  verdict: 'correct' | 'wrong' | 'locked' | 'throttled' | null
  attemptsLeft: number
  reveal: string | null
  source: string | null
  wasFirst: boolean
  solvedBy: number
  found: FoundEgg[]
  codexOpen: boolean
  announcement: string | null
}

const FOUND_KEY = 'cq.eggsFound'

function loadFound(): FoundEgg[] {
  try {
    const raw = localStorage.getItem(FOUND_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveFound(found: FoundEgg[]) {
  try {
    localStorage.setItem(FOUND_KEY, JSON.stringify(found))
  } catch {
    /* ignore */
  }
}

const initialState: EggState = {
  dialogOpen: false,
  eggId: null,
  prompt: '',
  hint: '',
  verdict: null,
  attemptsLeft: 6,
  reveal: null,
  source: null,
  wasFirst: false,
  solvedBy: 0,
  found: loadFound(),
  codexOpen: false,
  announcement: null,
}

function scene() {
  return phaserGame.scene.keys.game as CampusScene | undefined
}

export const eggSlice = createSlice({
  name: 'egg',
  initialState,
  reducers: {
    openEggDialog: (
      state,
      action: PayloadAction<{
        eggId: string
        prompt: string
        hint: string
        solved: boolean
        solvedBy: number
        attemptsLeft: number
      }>
    ) => {
      state.dialogOpen = true
      state.eggId = action.payload.eggId
      state.prompt = action.payload.prompt
      state.hint = action.payload.hint
      state.solvedBy = action.payload.solvedBy
      state.attemptsLeft = action.payload.attemptsLeft
      state.verdict = null
      const already = state.found.find((f) => f.id === action.payload.eggId)
      state.reveal = already?.reveal ?? null
      state.source = already?.source ?? null
      state.wasFirst = already?.first ?? false
      scene()?.disableKeys()
    },
    closeEggDialog: (state) => {
      state.dialogOpen = false
      state.eggId = null
      state.verdict = null
      scene()?.enableKeys()
    },
    eggResult: (
      state,
      action: PayloadAction<{
        eggId: string
        correct: boolean
        first?: boolean
        reveal?: string
        source?: string
        kind?: 'fact' | 'myth' | 'lore'
        attemptsLeft?: number
        lockedOut?: boolean
        throttled?: boolean
        solvedBy?: number
      }>
    ) => {
      const p = action.payload
      if (p.throttled) {
        state.verdict = 'throttled'
        return
      }
      if (p.lockedOut) {
        state.verdict = 'locked'
        state.attemptsLeft = 0
        return
      }
      if (typeof p.solvedBy === 'number') state.solvedBy = p.solvedBy
      if (!p.correct) {
        state.verdict = 'wrong'
        if (typeof p.attemptsLeft === 'number') state.attemptsLeft = p.attemptsLeft
        return
      }
      state.verdict = 'correct'
      state.reveal = p.reveal ?? null
      state.source = p.source ?? null
      state.wasFirst = !!p.first
      if (p.reveal && !state.found.some((f) => f.id === p.eggId)) {
        state.found.push({
          id: p.eggId,
          kind: p.kind ?? 'fact',
          reveal: p.reveal,
          source: p.source ?? '',
          first: !!p.first,
        })
        saveFound(state.found)
      }
    },
    eggAnnounced: (state, action: PayloadAction<string>) => {
      state.announcement = action.payload
    },
    clearAnnouncement: (state) => {
      state.announcement = null
    },
    syncProgress: (state, action: PayloadAction<{ solved: string[] }>) => {
      const authoritative = new Set(action.payload.solved)
      if (authoritative.size === 0) return
      state.found = state.found.filter((f) => authoritative.has(f.id))
      saveFound(state.found)
    },
    openCodex: (state) => {
      state.dialogOpen = false
      state.eggId = null
      state.codexOpen = true
      scene()?.disableKeys()
    },
    closeCodex: (state) => {
      state.codexOpen = false
      scene()?.enableKeys()
    },
  },
})

export const {
  openEggDialog,
  closeEggDialog,
  eggResult,
  eggAnnounced,
  clearAnnouncement,
  syncProgress,
  openCodex,
  closeCodex,
} = eggSlice.actions

export default eggSlice.reducer
