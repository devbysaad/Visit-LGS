import { Quest } from '../../../types/Content'

/**
 * Source of truth for copy is docs/CONTENT.md — mirror changes here.
 * Bump contentVersion when steps change; this invalidates old localStorage progress.
 */
export const orientationHunt: Quest = {
  id: 'orientation-hunt-v1',
  contentVersion: '3',
  intro: 'Explore campus and check in at six key places. Open your quest log with J.',
  reward: 'Orientation complete — you know your way around Gudwal. See you on day one!',
  steps: [
    {
      id: 'step-1',
      objective: 'Find the parking bay and the campus car',
      targetType: 'building',
      targetId: 'parking',
      completionLine: 'Parking found. Press E beside the car if you want to drive. Next: the A-Level Block.',
    },
    {
      id: 'step-2',
      objective: 'Walk into the A-Level Block',
      targetType: 'building',
      targetId: 'a-level-block',
      completionLine: 'A-Level Block checked — labs, library and the Principal Office are all in there. Next: the O-Level Block.',
    },
    {
      id: 'step-3',
      objective: 'Find the O-Level Block',
      targetType: 'building',
      targetId: 'o-level-block',
      completionLine: 'O-Level Block checked. The canteen is off its reception corridor. Next: the sports ground.',
    },
    {
      id: 'step-4',
      objective: 'Walk out to the sports ground',
      targetType: 'building',
      targetId: 'playground',
      completionLine: 'Ground found. Next: the walking area down the east side.',
    },
    {
      id: 'step-5',
      objective: 'Say hello to the librarian on the walking area',
      targetType: 'npc',
      targetId: 'npc-librarian',
      completionLine: 'Ms. Nadia says hello back. Last stop: the notice board by the gate.',
    },
    {
      id: 'step-6',
      objective: 'Read the campus notice board',
      targetType: 'building',
      targetId: 'notice-board',
      completionLine: 'Hunt complete!',
    },
  ],
}

export const quests: Quest[] = [orientationHunt]
