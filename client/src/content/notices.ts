import { StaffNotice } from '../../../types/Content'

/**
 * Staff-pinned notice board copy. Source of truth: docs/CONTENT.md.
 * Player posts are live via Colyseus (see NoticeBoardStore) — not listed here.
 */
export const staffNotices: StaffNotice[] = [
  {
    id: 'staff-timetable',
    title: 'Timetable — Week 1',
    body:
      'Assembly 8:00 at the courtyard. Sections check the Classrooms Block board for room numbers. Substitutions go up by 7:45.',
  },
  {
    id: 'staff-fees',
    title: 'Fee Counter hours',
    body:
      'Open 9:00–13:00 and 14:00–15:30. Peak queues near term start — bring your challan and student ID.',
  },
  {
    id: 'staff-library',
    title: 'Library reminder',
    body:
      'Silence in the reading area. Issue desk closes 15 minutes before the final bell. Overdue books block further loans.',
  },
  {
    id: 'staff-faq',
    title: 'Lost & found',
    body:
      'Lost bags and ID cards go to Admin first. Sports kit left on the ground goes to the PE office.',
  },
]

/**
 * Seeded campus buzz — playful “news” pins so the board never feels empty.
 * Live student posts still sync through Colyseus on top of these.
 */
export type CampusBuzzPin = {
  id: string
  author: string
  title: string
  body: string
  rotation: number
}

export const campusBuzz: CampusBuzzPin[] = [
  {
    id: 'buzz-samosa',
    author: 'Anon · Class 9',
    title: 'BREAKING: Canteen samosa stock',
    body: 'Sources say the first tray sells out before second period. Arrive early or accept your fate (chips).',
    rotation: -3,
  },
  {
    id: 'buzz-library',
    author: 'Bookworm',
    title: 'Quiet hours rumor',
    body: 'Librarian spotted smiling yesterday. Unconfirmed. Proceed with caution and closed mouths.',
    rotation: 2,
  },
  {
    id: 'buzz-pe',
    author: 'House Captain?',
    title: 'Sports ground wet?',
    body: 'Someone left cones in a spiral again. PE says it was “strategic.” We remain unconvinced.',
    rotation: -1,
  },
  {
    id: 'buzz-wifi',
    author: 'IT Lab survivor',
    title: 'Wi‑Fi prophecy',
    body: 'If the lab PCs load before the bell, it is a good omen for the whole week. Statistically rigorous.',
    rotation: 4,
  },
]
