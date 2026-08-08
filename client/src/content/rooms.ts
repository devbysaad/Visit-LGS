import { CampusRoom } from '../../../types/Content'

/**
 * Interior rooms — Press E inside a wing after entering via a door portal.
 * Source of truth: docs/CONTENT.md
 *
 * Room ids must match the `roomId` properties emitted by tools/gen_lgs_campus.py.
 * The layout follows the hand-drawn campus plan (ADR-018): each wing has a north
 * band of classrooms and the staff room, a corridor with the stairwell at its
 * east end, and a south band of labs, the open "small ground" courtyard and the
 * six-classroom block. Ground floors add the east column.
 */

export type WingId = 'a-level-block' | 'o-level-block'

/** [roomId, display name, wing, floor label] — 30 classrooms, 8 downstairs and 7 up per wing. */
const CLASS_PLAN: Array<[string, string, WingId, string]> = [
  ['ag-c1', 'AS-A', 'a-level-block', 'A-Level Block · Ground Floor'],
  ['ag-c2', 'AS-B', 'a-level-block', 'A-Level Block · Ground Floor'],
  ['ag-c3', 'AS-C', 'a-level-block', 'A-Level Block · Ground Floor'],
  ['ag-c4', 'AS-D', 'a-level-block', 'A-Level Block · Ground Floor'],
  ['ag-c5', 'A2-A', 'a-level-block', 'A-Level Block · Ground Floor'],
  ['ag-c6', 'A2-B', 'a-level-block', 'A-Level Block · Ground Floor'],
  ['ag-c7', 'A2-C', 'a-level-block', 'A-Level Block · Ground Floor'],
  ['ag-c8', 'A2-D', 'a-level-block', 'A-Level Block · Ground Floor'],
  ['af-c1', 'AS-E', 'a-level-block', 'A-Level Block · First Floor'],
  ['af-c2', 'AS-F', 'a-level-block', 'A-Level Block · First Floor'],
  ['af-c3', 'AS-G', 'a-level-block', 'A-Level Block · First Floor'],
  ['af-c4', 'AS-H', 'a-level-block', 'A-Level Block · First Floor'],
  ['af-c5', 'A2-E', 'a-level-block', 'A-Level Block · First Floor'],
  ['af-c6', 'A2-F', 'a-level-block', 'A-Level Block · First Floor'],
  ['af-c7', 'A2-G', 'a-level-block', 'A-Level Block · First Floor'],
  ['og-c1', 'O-1 A', 'o-level-block', 'O-Level Block · Ground Floor'],
  ['og-c2', 'O-1 B', 'o-level-block', 'O-Level Block · Ground Floor'],
  ['og-c3', 'O-1 C', 'o-level-block', 'O-Level Block · Ground Floor'],
  ['og-c4', 'O-1 D', 'o-level-block', 'O-Level Block · Ground Floor'],
  ['og-c5', 'O-2 A', 'o-level-block', 'O-Level Block · Ground Floor'],
  ['og-c6', 'O-2 B', 'o-level-block', 'O-Level Block · Ground Floor'],
  ['og-c7', 'O-2 C', 'o-level-block', 'O-Level Block · Ground Floor'],
  ['og-c8', 'O-2 D', 'o-level-block', 'O-Level Block · Ground Floor'],
  ['of-c1', 'O-3 A', 'o-level-block', 'O-Level Block · First Floor'],
  ['of-c2', 'O-3 B', 'o-level-block', 'O-Level Block · First Floor'],
  ['of-c3', 'O-3 C', 'o-level-block', 'O-Level Block · First Floor'],
  ['of-c4', 'O-3 D', 'o-level-block', 'O-Level Block · First Floor'],
  ['of-c5', 'IGCSE-A', 'o-level-block', 'O-Level Block · First Floor'],
  ['of-c6', 'IGCSE-B', 'o-level-block', 'O-Level Block · First Floor'],
  ['of-c7', 'IGCSE-C', 'o-level-block', 'O-Level Block · First Floor'],
]

type SpaceKind =
  | 'staff'
  | 'staff-upper'
  | 'prep'
  | 'washroom'
  | 'physics'
  | 'computer'
  | 'biology'
  | 'chemistry'
  | 'court'
  | 'terrace'
  | 'library'
  | 'reception'

const SPACE_COPY: Record<SpaceKind, { tagline: string; description: string }> = {
  staff: {
    tagline: 'Teachers only',
    description:
      'Teachers plan and mark here between periods. Knock and ask for your teacher by name rather than walking in. The stairwell is right next door.',
  },
  'staff-upper': {
    tagline: 'Upper-floor staff room',
    description:
      'The smaller staff room for teachers whose periods sit upstairs. Same rule: knock, ask by name, wait outside.',
  },
  prep: {
    tagline: 'Lab preparation and stores',
    description:
      'Apparatus, chemicals and marked practical scripts are kept here. Lab staff only — ask at the labs if you need something signed out.',
  },
  washroom: {
    tagline: 'Washrooms',
    description: 'Go between periods rather than during them. Report anything broken to the office.',
  },
  physics: {
    tagline: 'Physics practicals',
    description:
      'Mechanics and electricity benches. Wait for a teacher before touching the supply rails, and log any apparatus you take from the prep room.',
  },
  computer: {
    tagline: 'Practical IT',
    description:
      'Log in with school credentials. No unauthorised USB drives, installs or downloads. Printing is at the wing library desk.',
  },
  biology: {
    tagline: 'Biology practicals',
    description:
      'Microscopes, slides and dissection trays. Wash your hands on the way out, and never take specimens beyond the door.',
  },
  chemistry: {
    tagline: 'Chemistry practicals',
    description:
      'Goggles and coats when the sign says so. Never mix reagents "just to see". The side door opens onto the small ground if a bench needs airing out.',
  },
  court: {
    tagline: 'Open-air courtyard',
    description:
      'The small ground at the heart of the wing — light, air and somewhere to eat lunch when the canteen queue is long. Keep it clear during fire drills.',
  },
  terrace: {
    tagline: 'Open terrace',
    description:
      'The upper deck above the labs, looking down into the small ground. Fine for revision between periods; nothing gets thrown over the rail.',
  },
  library: {
    tagline: 'Wing library and issue desk',
    description:
      'Subject textbooks, past papers and a few quiet desks. Ask at the desk to issue a copy and return it before the stamped date.',
  },
  reception: {
    tagline: 'Waiting area',
    description:
      'Queue here for the offices along this corridor. Keep voices low — the offices are working, and the wing library is through the far door.',
  },
}

/** [roomId, display name, wing, kind] for every non-classroom space in a wing. */
const WING_SPACES: Array<[string, string, WingId, SpaceKind]> = [
  ['a-staff-room', 'Staff Room', 'a-level-block', 'staff'],
  ['a-staff-room-upper', 'Staff Room (Upper)', 'a-level-block', 'staff-upper'],
  ['a-prep-room', 'Prep Room', 'a-level-block', 'prep'],
  ['a-washrooms', 'Washrooms', 'a-level-block', 'washroom'],
  ['a-washrooms-upper', 'Washrooms (Upper)', 'a-level-block', 'washroom'],
  ['a-physics-lab', 'Physics Lab', 'a-level-block', 'physics'],
  ['a-computer-lab', 'Computer Lab', 'a-level-block', 'computer'],
  ['a-biology-lab', 'Biology Lab', 'a-level-block', 'biology'],
  ['a-chemistry-lab', 'Chemistry Lab', 'a-level-block', 'chemistry'],
  ['a-small-ground', 'Small Ground', 'a-level-block', 'court'],
  ['a-terrace', 'Terrace', 'a-level-block', 'terrace'],
  ['a-library', 'A-Level Library', 'a-level-block', 'library'],
  ['a-reception', 'Reception', 'a-level-block', 'reception'],
  ['o-staff-room', 'Staff Room', 'o-level-block', 'staff'],
  ['o-staff-room-upper', 'Staff Room (Upper)', 'o-level-block', 'staff-upper'],
  ['o-prep-room', 'Prep Room', 'o-level-block', 'prep'],
  ['o-washrooms', 'Washrooms', 'o-level-block', 'washroom'],
  ['o-washrooms-upper', 'Washrooms (Upper)', 'o-level-block', 'washroom'],
  ['o-physics-lab', 'Physics Lab', 'o-level-block', 'physics'],
  ['o-computer-lab', 'Computer Lab', 'o-level-block', 'computer'],
  ['o-biology-lab', 'Biology Lab', 'o-level-block', 'biology'],
  ['o-chemistry-lab', 'Chemistry Lab', 'o-level-block', 'chemistry'],
  ['o-small-ground', 'Small Ground', 'o-level-block', 'court'],
  ['o-terrace', 'Terrace', 'o-level-block', 'terrace'],
  ['o-library', 'O-Level Library', 'o-level-block', 'library'],
  ['o-reception', 'Reception', 'o-level-block', 'reception'],
]

const classrooms: CampusRoom[] = CLASS_PLAN.map(([id, name, buildingId, floor]) => ({
  id,
  buildingId,
  name,
  tagline: floor,
  description:
    'Be seated before the bell. The whiteboard at the front opens the shared campus notice board — press E on it to read pins or add your own. Press E on a chair to sit.',
}))

const wingSpaces: CampusRoom[] = WING_SPACES.map(([id, name, buildingId, kind]) => ({
  id,
  buildingId,
  name,
  ...SPACE_COPY[kind],
}))

export const rooms: CampusRoom[] = [
  ...classrooms,
  ...wingSpaces,

  // East column of the A-Level Block
  {
    id: 'accounts-office',
    buildingId: 'a-level-block',
    name: 'Accounts Office',
    tagline: 'Fees, challans and receipts',
    description:
      'Submit fee challans and collect receipts here. Keep every slip you are given. Queues are longest in the first week of each term.',
  },
  {
    id: 'principal-office',
    buildingId: 'a-level-block',
    name: 'Principal Office',
    tagline: 'By appointment',
    description:
      'The head of campus sits at the end of the A-Level reception corridor. Knock and wait. Appointments are booked at the Admin Office in the O-Level Block.',
  },
  {
    id: 'a-exam-hall',
    buildingId: 'a-level-block',
    name: 'Exam Hall',
    tagline: 'Mocks and board exams',
    description:
      'Rows of single desks for mocks and Cambridge sittings. Seating plans go up on the door the evening before — check your index number.',
  },

  // East column of the O-Level Block
  {
    id: 'admin-office-room',
    buildingId: 'o-level-block',
    name: 'Admin Office',
    tagline: 'Forms and records',
    description:
      'Admissions follow-ups, character certificates, and official letters. Bring your student ID and allow two working days.',
  },
  {
    id: 'canteen-hall',
    buildingId: 'o-level-block',
    name: 'Canteen',
    tagline: 'Breaks and snacks',
    description:
      'The canteen sits at the end of the O-Level reception corridor. Keep queues orderly and clear your table before you leave.',
  },
  {
    id: 'o-activity-hall',
    buildingId: 'o-level-block',
    name: 'Activity Hall',
    tagline: 'Assemblies, clubs and house events',
    description:
      'Society meetings, debates and house practice happen here. Book it through the Admin Office before you claim a slot.',
  },
]

/** Ids the whiteboard layer hangs a shared notice board on. */
export const classroomIds: string[] = CLASS_PLAN.map(([id]) => id)

export const labIds: string[] = WING_SPACES.filter(([id]) => id.endsWith('-lab')).map(([id]) => id)

export function getRoomById(id: string): CampusRoom | undefined {
  return rooms.find((room) => room.id === id)
}

export function getRoomsByBuilding(buildingId: string): CampusRoom[] {
  return rooms.filter((room) => room.buildingId === buildingId)
}
