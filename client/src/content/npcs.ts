import { Npc } from '../../../types/Content'

/**
 * Placeholder roster for LGS Wah Cantt (Gudwal).
 * Source of truth for copy is docs/CONTENT.md — mirror changes here.
 */
export const npcs: Npc[] = [
  {
    id: 'npc-senior',
    name: 'Ayesha (Senior)',
    location: 'main-gate',
    dialogue: [
      'Welcome to Gudwal campus!',
      'Start at Admin if you still have forms.',
      'Canteen is past the courtyard — follow the path.',
      'Press J anytime to see your hunt objectives.',
    ],
    questHook: 'Starts hunt if not started',
  },
  {
    id: 'npc-clerk',
    name: 'Mr. Hassan',
    location: 'admin-office',
    dialogue: [
      'Admin handles certificates and letters.',
      'Fee Counter is next door for payments.',
      'Keep a copy of every slip you submit.',
    ],
    questHook: 'Optional tip for fee step',
  },
  {
    id: 'npc-lab',
    name: 'Ms. Sara',
    location: 'science-lab',
    dialogue: [
      "Labs need supervision — don't wander in alone.",
      'Safety goggles when the sign says so.',
      'Computer Lab is across the corridor.',
    ],
  },
  {
    id: 'npc-librarian',
    name: 'Ms. Nadia',
    location: 'library',
    dialogue: [
      'Silence helps everyone revise.',
      'Issue desk is at the front.',
      'Return books before the stamped date.',
    ],
  },
  {
    id: 'npc-teacher',
    name: 'Mr. Imran',
    location: 'classrooms',
    dialogue: [
      'Math, Physics, and Computer rooms are inside this block.',
      'Sit facing the board — Press E on a chair.',
      'Press E on a whiteboard to open the campus notice board and pin news for everyone.',
      'Labs are downstairs in this wing — wait for a teacher before practicals.',
    ],
  },
]

export function getNpcById(id: string): Npc | undefined {
  return npcs.find((npc) => npc.id === id)
}
