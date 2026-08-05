import { CampusRoom } from '../../../types/Content'

/**
 * Interior rooms — Press E inside a building after entering via a door portal.
 * Source of truth: docs/CONTENT.md
 */
export const rooms: CampusRoom[] = [
  // Library
  {
    id: 'lib-study-area',
    buildingId: 'library',
    name: 'Study Area',
    tagline: 'Quiet desks for revision',
    description:
      'Shared reading tables. Phones on mute. Ask the librarian if you need a longer stay near exams.',
  },
  {
    id: 'lib-computer-lab',
    buildingId: 'library',
    name: 'Library Computer Lab',
    tagline: 'Catalogue and research PCs',
    description:
      'Search the catalogue and print notes here. School login only — no games or installs.',
  },
  {
    id: 'lib-stacks',
    buildingId: 'library',
    name: 'Book Stacks',
    tagline: 'Shelves and issue copies',
    description:
      'Browse textbooks by subject. Press E at the Library door for the digital shelf reader, or ask Ms. Nadia at the admin desk.',
  },
  {
    id: 'lib-admin',
    buildingId: 'library',
    name: 'Library Admin Desk',
    tagline: 'Issue and returns',
    description: 'Issue books, renewals, and overdue slips. Return before the stamped date.',
  },
  {
    id: 'lib-washrooms',
    buildingId: 'library',
    name: 'Washrooms',
    tagline: 'Library wing',
    description: 'Keep them tidy. Report leaks or shortages at the admin desk.',
  },

  // Classrooms block
  {
    id: 'class-math',
    buildingId: 'classrooms',
    name: 'Math Classroom',
    tagline: 'Section maths lessons',
    description: 'Be seated before the bell. Board work stays until the next period clears it.',
  },
  {
    id: 'class-physics',
    buildingId: 'classrooms',
    name: 'Physics Classroom',
    tagline: 'Theory periods',
    description: 'Theory here; practicals move to the Physics Lab next door when scheduled.',
  },
  {
    id: 'class-computer',
    buildingId: 'classrooms',
    name: 'Computer Classroom',
    tagline: 'IT theory',
    description: 'Theory and demos. Hands-on sessions use the Computer Lab in this block.',
  },
  {
    id: 'lab-computer',
    buildingId: 'classrooms',
    name: 'Computer Lab',
    tagline: 'Practical IT',
    description: 'Log in with school credentials. No unauthorised USB installs or downloads.',
  },
  {
    id: 'lab-physics',
    buildingId: 'classrooms',
    name: 'Physics Lab',
    tagline: 'Experiments',
    description: 'Wait for a teacher. Wear posted kit. Never mix chemicals “just to see.”',
  },

  // Admin
  {
    id: 'admin-waiting',
    buildingId: 'admin-office',
    name: 'Waiting Area',
    tagline: 'Take a seat',
    description: 'Queue here for certificates and letters. Keep voices low — offices are working.',
  },
  {
    id: 'admin-office-room',
    buildingId: 'admin-office',
    name: 'Admin Office',
    tagline: 'Forms and records',
    description: 'Admissions follow-ups, certificates, and official letters. Bring your student ID.',
  },
  {
    id: 'admin-balcony',
    buildingId: 'admin-office',
    name: 'Balcony',
    tagline: 'Staff overlook',
    description: 'Staff balcony overlooking the plaza. Students only when invited.',
  },

  // Canteen
  {
    id: 'canteen-hall',
    buildingId: 'canteen',
    name: 'Canteen Hall',
    tagline: 'Breaks and snacks',
    description: 'Keep queues orderly and dispose of litter before you leave.',
  },
]

export function getRoomById(id: string): CampusRoom | undefined {
  return rooms.find((room) => room.id === id)
}

export function getRoomsByBuilding(buildingId: string): CampusRoom[] {
  return rooms.filter((room) => room.buildingId === buildingId)
}
