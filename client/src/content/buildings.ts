import { Building } from '../../../types/Content'

/**
 * Placeholder roster for LGS Wah Cantt (Gudwal).
 * Source of truth for copy is docs/CONTENT.md — mirror changes here.
 * Do not invent permanent official names without staff/campus-walk verification.
 *
 * `photo` is omitted until real files exist under
 * `client/public/assets/images/buildings/` — listing missing JPGs only causes 404 noise.
 */
export const buildings: Building[] = [
  {
    id: 'main-gate',
    name: 'Main Gate',
    tagline: 'Where orientation begins',
    description:
      'This is the campus entrance. Come in through here when you arrive, and watch for cars at pickup time. If you need directions, ask at reception just inside.',
    whoToAsk: 'Reception desk',
  },
  {
    id: 'admin-office',
    name: 'Admin Office',
    tagline: 'Forms, letters, and records',
    description:
      'Visit for admissions follow-ups, certificates, and official letters. Bring your student ID.',
    whoToAsk: 'Office clerk',
  },
  {
    id: 'fee-counter',
    name: 'Fee Counter',
    tagline: 'Pay and collect fee slips',
    description: 'Fee submissions and challan queries. Keep receipts. Peak queues near term start.',
    whoToAsk: 'Accounts desk',
  },
  {
    id: 'library',
    name: 'Library',
    tagline: 'Quiet study and book issue',
    description:
      'Borrow textbooks and use reading space. Follow silence rules; return dates matter.',
    whoToAsk: 'Librarian',
  },
  {
    id: 'canteen',
    name: 'Canteen',
    tagline: 'Snacks and break time',
    description: 'Food and short breaks between periods. Keep queues orderly; dispose of litter.',
    whoToAsk: 'Canteen staff',
  },
  {
    id: 'science-lab',
    name: 'Science Lab',
    tagline: 'Experiments and practicals',
    description: 'Lab coats/rules when posted. Never enter unsupervised practicals.',
    whoToAsk: 'Lab attendant',
  },
  {
    id: 'computer-lab',
    name: 'Computer Lab',
    tagline: 'IT practicals',
    description: 'Login with school credentials when issued. No unauthorised installs.',
    whoToAsk: 'IT teacher',
  },
  {
    id: 'classrooms',
    name: 'Classrooms Block',
    tagline: 'Daily lessons',
    description: 'Find your section on the timetable notice board. Be seated before the bell.',
    whoToAsk: 'Class teacher',
  },
  {
    id: 'sports-ground',
    name: 'Sports Ground',
    tagline: 'PE and house matches',
    description: 'PE kit on sports days. Stay clear of active matches unless participating.',
    whoToAsk: 'PE teacher',
  },
  {
    id: 'notice-board',
    name: 'Notice Board',
    tagline: 'Campus news & student pins',
    description:
      'Fullscreen campus corkboard — staff notices, campus buzz, and notes anyone online can pin for everyone to see.',
    whoToAsk: 'Anyone reading the board',
  },
]

export function getBuildingById(id: string): Building | undefined {
  return buildings.find((building) => building.id === id)
}
