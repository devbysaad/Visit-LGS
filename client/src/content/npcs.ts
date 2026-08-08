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
      'Two wings, that is the whole campus: the A-Level Block up ahead and the O-Level Block behind it.',
      'Both have two floors. Walk in at the west door, and the stairwell is at the far end of the corridor.',
      'There is usually a car in the parking bay by the gate. Press E beside it if you would rather drive the loop.',
      'Press J anytime to see your hunt objectives.',
    ],
    questHook: 'Starts hunt if not started',
  },
  {
    id: 'npc-teacher',
    name: 'Mr. Imran',
    location: 'a-level-block',
    dialogue: [
      'A-Level Block. Labs and the staff room downstairs, more classrooms and the exam hall upstairs.',
      'The library, Accounts Office and the Principal Office are all off the reception corridor at the east end.',
      'The courtyard in the middle is the small ground — good place to eat if the canteen is packed.',
      'Sit facing the board — press E on a chair. Press E on a whiteboard to pin news for everyone.',
    ],
  },
  {
    id: 'npc-clerk',
    name: 'Mr. Hassan',
    location: 'o-level-block',
    dialogue: [
      'O-Level Block, same plan as the other wing.',
      'Certificates and letters are mine, at the Admin Office off the reception corridor.',
      'Fee challans go to Accounts — that one is in the A-Level Block.',
      'Keep a copy of every slip you submit.',
    ],
    questHook: 'Optional tip for the accounts step',
  },
  {
    id: 'npc-librarian',
    name: 'Ms. Nadia',
    location: 'walking-area',
    dialogue: [
      'I walk this strip every break — quietest corner of the campus.',
      'Each wing has its own library off the reception corridor, so borrow from the one you have classes in.',
      'Silence helps everyone revise. Return books before the stamped date.',
    ],
  },
  {
    id: 'npc-lab',
    name: 'Ms. Sara',
    location: 'playground',
    dialogue: [
      'Sports ground. PE kit on sports days, and stay off it during house matches.',
      'If you are looking for me otherwise, I am in the labs on either ground floor.',
      "Labs need supervision — don't wander in alone, and goggles on when the sign says so.",
    ],
  },
]

export function getNpcById(id: string): Npc | undefined {
  return npcs.find((npc) => npc.id === id)
}
