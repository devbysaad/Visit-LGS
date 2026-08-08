import { Building } from '../../../types/Content'

/**
 * Placeholder roster for LGS Wah Cantt (Gudwal).
 * Source of truth for copy is docs/CONTENT.md — mirror changes here.
 * Do not invent permanent official names without staff/campus-walk verification.
 *
 * The campus is two long two-storey wings plus outdoor areas (ADR-018); the
 * library, offices, canteen and labs are rooms inside the wings, not separate
 * buildings, so they live in content/rooms.ts.
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
      'The campus entrance on the south wall. Cars come through here at drop-off and pickup, so keep to the footpath. The main drive runs straight up the east side of the wings.',
    whoToAsk: 'Security guard',
  },
  {
    id: 'a-level-block',
    name: 'A-Level Block',
    tagline: 'Two floors · 15 classrooms',
    description:
      'The northern wing. Downstairs: four labs, the staff room, the small ground courtyard and an east column holding the wing library, Accounts Office, reception and the Principal Office. Upstairs: more classrooms, the exam hall and the terrace. The stairwell is at the east end of the corridor.',
    whoToAsk: 'Class teacher',
  },
  {
    id: 'o-level-block',
    name: 'O-Level Block',
    tagline: 'Two floors · 15 classrooms',
    description:
      'The southern wing, laid out like its twin. Downstairs: four labs, the staff room, the small ground courtyard and an east column holding the wing library, Admin Office, reception and the canteen. Upstairs: more classrooms, the activity hall and the terrace.',
    whoToAsk: 'Class teacher',
  },
  {
    id: 'walking-area',
    name: 'Walking Area',
    tagline: 'The landscaped strip down the east side',
    description:
      'A shaded loop of paths and benches between the wings and the east wall. Staff walk it at break; it is the quietest place on campus to wait for a pickup.',
    whoToAsk: 'Anyone on the benches',
  },
  {
    id: 'playground',
    name: 'Sports Ground',
    tagline: 'PE, house matches and breaks',
    description:
      'The ground along the south of campus, beside the parking. PE kit on sports days. Stay clear of active matches unless you are playing.',
    whoToAsk: 'PE teacher',
  },
  {
    id: 'parking',
    name: 'Parking',
    tagline: 'Staff and visitor bays',
    description:
      'Marked bays just inside the gate. A campus car is usually parked here — press E beside it to drive, and E again to step out.',
    whoToAsk: 'Security guard',
  },
  {
    id: 'notice-board',
    name: 'Notice Board',
    tagline: 'Campus news & student pins',
    description:
      'Fullscreen campus corkboard beside the gate — staff notices, campus buzz, and notes anyone online can pin for everyone to see.',
    whoToAsk: 'Anyone reading the board',
  },
]

export function getBuildingById(id: string): Building | undefined {
  return buildings.find((building) => building.id === id)
}
