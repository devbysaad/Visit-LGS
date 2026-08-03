import { Building } from '../../../types/Content'

/**
 * Placeholder roster for LGS Wah Cantt (Gudwal).
 * Source of truth for copy is docs/CONTENT.md — mirror changes here.
 * Do not invent permanent official names without staff/campus-walk verification.
 */
export const buildings: Building[] = [
  {
    id: 'main-gate',
    name: 'Main Gate',
    tagline: 'Where orientation begins',
    description:
      'This is the campus entrance. Come in through here when you arrive, and watch for cars at pickup time. If you need directions, ask at reception just inside.',
    photo: 'main-gate.jpg',
    whoToAsk: 'Reception desk',
  },
  {
    id: 'admin-office',
    name: 'Admin Office',
    tagline: 'Forms, letters, and records',
    description:
      'Visit for admissions follow-ups, certificates, and official letters. Bring your student ID.',
    photo: 'admin-office.jpg',
    whoToAsk: 'Office clerk',
  },
  {
    id: 'fee-counter',
    name: 'Fee Counter',
    tagline: 'Pay and collect fee slips',
    description: 'Fee submissions and challan queries. Keep receipts. Peak queues near term start.',
    photo: 'fee-counter.jpg',
    whoToAsk: 'Accounts desk',
  },
  {
    id: 'library',
    name: 'Library',
    tagline: 'Quiet study and book issue',
    description:
      'Borrow textbooks and use reading space. Follow silence rules; return dates matter.',
    photo: 'library.jpg',
    whoToAsk: 'Librarian',
  },
  {
    id: 'canteen',
    name: 'Canteen',
    tagline: 'Snacks and break time',
    description: 'Food and short breaks between periods. Keep queues orderly; dispose of litter.',
    photo: 'canteen.jpg',
    whoToAsk: 'Canteen staff',
  },
  {
    id: 'science-lab',
    name: 'Science Lab',
    tagline: 'Experiments and practicals',
    description: 'Lab coats/rules when posted. Never enter unsupervised practicals.',
    photo: 'science-lab.jpg',
    whoToAsk: 'Lab attendant',
  },
  {
    id: 'computer-lab',
    name: 'Computer Lab',
    tagline: 'IT practicals',
    description: 'Login with school credentials when issued. No unauthorised installs.',
    photo: 'computer-lab.jpg',
    whoToAsk: 'IT teacher',
  },
  {
    id: 'classrooms',
    name: 'Classrooms Block',
    tagline: 'Daily lessons',
    description: 'Find your section on the timetable notice board. Be seated before the bell.',
    photo: 'classrooms.jpg',
    whoToAsk: 'Class teacher',
  },
  {
    id: 'sports-ground',
    name: 'Sports Ground',
    tagline: 'PE and house matches',
    description: 'PE kit on sports days. Stay clear of active matches unless participating.',
    photo: 'sports-ground.jpg',
    whoToAsk: 'PE teacher',
  },
  {
    id: 'notice-board',
    name: 'Notice Board',
    tagline: 'Timetables and announcements',
    description: 'Check daily for substitutions, event notices, and exam schedules.',
    photo: 'notice-board.jpg',
  },
]

export function getBuildingById(id: string): Building | undefined {
  return buildings.find((building) => building.id === id)
}
