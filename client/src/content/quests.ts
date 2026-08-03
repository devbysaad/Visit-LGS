import { Quest } from '../../../types/Content'

/**
 * Source of truth for copy is docs/CONTENT.md — mirror changes here.
 * Bump contentVersion when steps change; this invalidates old localStorage progress.
 */
export const orientationHunt: Quest = {
  id: 'orientation-hunt-v1',
  contentVersion: '1',
  intro: 'Explore campus and check in at five key places. Open your quest log with J.',
  reward: 'Orientation complete — you know your way around Gudwal. See you on day one!',
  steps: [
    {
      id: 'step-1',
      objective: 'Visit the Admin Office',
      targetType: 'building',
      targetId: 'admin-office',
      completionLine: 'Admin found. Next: Fee Counter.',
    },
    {
      id: 'step-2',
      objective: 'Find the Fee Counter',
      targetType: 'building',
      targetId: 'fee-counter',
      completionLine: 'Fees desk checked. Next: Library.',
    },
    {
      id: 'step-3',
      objective: 'Enter the Library',
      targetType: 'building',
      targetId: 'library',
      completionLine: 'Library checked. Next: Science Lab.',
    },
    {
      id: 'step-4',
      objective: 'Check the Science Lab',
      targetType: 'building',
      targetId: 'science-lab',
      completionLine: 'Lab found. Last stop: Canteen.',
    },
    {
      id: 'step-5',
      objective: 'Find the Canteen',
      targetType: 'building',
      targetId: 'canteen',
      completionLine: 'Hunt complete!',
    },
  ],
}

export const quests: Quest[] = [orientationHunt]
