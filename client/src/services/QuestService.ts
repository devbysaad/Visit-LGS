import { orientationHunt } from '../content/quests'
import { Quest, QuestStep, QuestTargetType } from '../../../types/Content'

export interface QuestProgress {
  started: boolean
  currentStepIndex: number
  completedStepIds: string[]
}

export interface CompleteStepResult {
  /** Whether this call advanced the quest (i.e. the target matched the current step). */
  completed: boolean
  /** The step that was just completed, if any. */
  step?: QuestStep
  /** True if this call finished the entire quest. */
  questComplete?: boolean
}

function storageKey(quest: Quest): string {
  return `campusquest-quest-${quest.contentVersion}`
}

function defaultProgress(): QuestProgress {
  return { started: false, currentStepIndex: 0, completedStepIds: [] }
}

/**
 * Client-only quest progress tracker (see AGENTS.md: no accounts/DB — progress lives in
 * localStorage keyed by `contentVersion`, so bumping the version in content/quests.ts
 * intentionally invalidates old saves).
 */
class QuestService {
  private quest: Quest
  private progress: QuestProgress

  constructor(quest: Quest = orientationHunt) {
    this.quest = quest
    this.progress = this.loadProgress()
  }

  private loadProgress(): QuestProgress {
    try {
      const raw = window.localStorage.getItem(storageKey(this.quest))
      if (!raw) return defaultProgress()
      const parsed = JSON.parse(raw)
      return {
        started: Boolean(parsed.started),
        currentStepIndex: Number(parsed.currentStepIndex) || 0,
        completedStepIds: Array.isArray(parsed.completedStepIds)
          ? [...parsed.completedStepIds]
          : [],
      }
    } catch {
      return defaultProgress()
    }
  }

  private saveProgress() {
    try {
      window.localStorage.setItem(storageKey(this.quest), JSON.stringify(this.progress))
    } catch {
      // localStorage may be unavailable (private mode, quota); progress just won't persist.
    }
  }

  getQuest(): Quest {
    return this.quest
  }

  getProgress(): QuestProgress {
    return {
      started: this.progress.started,
      currentStepIndex: this.progress.currentStepIndex,
      // Always copy — Redux/Immer freezes arrays put into state; never share refs.
      completedStepIds: [...this.progress.completedStepIds],
    }
  }

  hasStarted(): boolean {
    return this.progress.started
  }

  isComplete(): boolean {
    return this.progress.currentStepIndex >= this.quest.steps.length
  }

  getCurrentStep(): QuestStep | undefined {
    return this.quest.steps[this.progress.currentStepIndex]
  }

  start() {
    if (this.progress.started) return
    this.progress.started = true
    this.saveProgress()
  }

  /**
   * Call when the player interacts with a building/npc. If it matches the current
   * quest step's target, advances progress and persists it.
   */
  completeCurrentIfMatch(targetType: QuestTargetType, targetId: string): CompleteStepResult {
    // Do not auto-start here — Redux must stay in sync via startQuestIfNeeded / LoginDialog.
    if (!this.progress.started) return { completed: false }

    const currentStep = this.getCurrentStep()
    if (!currentStep) return { completed: false }
    if (currentStep.targetType !== targetType || currentStep.targetId !== targetId) {
      return { completed: false }
    }

    // Replace array (don't push) in case a frozen copy was ever assigned back.
    this.progress.completedStepIds = [...this.progress.completedStepIds, currentStep.id]
    this.progress.currentStepIndex += 1
    this.saveProgress()

    return {
      completed: true,
      step: currentStep,
      questComplete: this.isComplete(),
    }
  }

  reset() {
    this.progress = defaultProgress()
    this.saveProgress()
  }
}

export const questService = new QuestService()
export default questService
