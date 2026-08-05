import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { AppDispatch } from './index'
import { orientationHunt } from '../content/quests'
import { QuestTargetType } from '../../../types/Content'
import questService from '../services/QuestService'
import phaserGame from '../PhaserGame'
import CampusScene from '../scenes/CampusScene'

const initialProgress = questService.getProgress()

function syncPhaserKeys(questLogOpen: boolean) {
  const game = phaserGame.scene.keys.game as CampusScene | undefined
  if (questLogOpen) game?.disableKeys()
  else game?.enableKeys()
}

export const questSlice = createSlice({
  name: 'quest',
  initialState: {
    quest: orientationHunt,
    started: initialProgress.started,
    currentStepIndex: initialProgress.currentStepIndex,
    completedStepIds: [...initialProgress.completedStepIds],
    questLogOpen: false,
    toastMessage: null as string | null,
    showCompletionScreen: false,
  },
  reducers: {
    setProgress: (
      state,
      action: PayloadAction<{ started: boolean; currentStepIndex: number; completedStepIds: string[] }>
    ) => {
      state.started = action.payload.started
      state.currentStepIndex = action.payload.currentStepIndex
      state.completedStepIds = [...action.payload.completedStepIds]
      if (state.started && state.currentStepIndex >= state.quest.steps.length) {
        state.showCompletionScreen = true
      }
    },
    setQuestLogOpen: (state, action: PayloadAction<boolean>) => {
      state.questLogOpen = action.payload
      syncPhaserKeys(state.questLogOpen)
    },
    toggleQuestLog: (state) => {
      state.questLogOpen = !state.questLogOpen
      syncPhaserKeys(state.questLogOpen)
    },
    showToast: (state, action: PayloadAction<string>) => {
      state.toastMessage = action.payload
    },
    clearToast: (state) => {
      state.toastMessage = null
    },
    setShowCompletionScreen: (state, action: PayloadAction<boolean>) => {
      state.showCompletionScreen = action.payload
    },
  },
})

export const {
  setProgress,
  setQuestLogOpen,
  toggleQuestLog,
  showToast,
  clearToast,
  setShowCompletionScreen,
} = questSlice.actions

export default questSlice.reducer

/**
 * Central place that bridges QuestService (plain TS, localStorage-backed) into Redux.
 * Called from BuildingStore/NpcStore event handlers when the player interacts with
 * something that might match the current quest step.
 */
export function completeQuestStepIfMatch(
  dispatch: AppDispatch,
  targetType: QuestTargetType,
  targetId: string
) {
  const result = questService.completeCurrentIfMatch(targetType, targetId)
  if (result.completed && result.step) {
    dispatch(setProgress(questService.getProgress()))
    dispatch(showToast(result.step.completionLine))
    if (result.questComplete) {
      dispatch(showToast(orientationHunt.reward))
      dispatch(setShowCompletionScreen(true))
    }
  }
  return result
}

/** Called on NPC interact for npcs whose questHook implies "start the hunt", or on login. */
export function startQuestIfNeeded(dispatch: AppDispatch) {
  if (questService.hasStarted()) {
    // Keep Redux aligned with localStorage (e.g. after refresh)
    dispatch(setProgress(questService.getProgress()))
    return
  }
  questService.start()
  dispatch(setProgress(questService.getProgress()))
  dispatch(showToast(orientationHunt.intro))
}
