/** Campus areas — outdoor grounds vs wing floors (each is camera-bounded). */

export interface CampusArea {
  id: string
  name: string
  /** Shown on the area title card when you arrive. */
  subtitle?: string
}

export const DEFAULT_AREA_ID = 'outdoor'

export const areas: CampusArea[] = [
  { id: 'outdoor', name: 'Campus Grounds', subtitle: 'LGS Wah Cantt · Gudwal' },
  {
    id: 'a-level-ground',
    name: 'A-Level Block',
    subtitle: 'Ground Floor · Labs, staff room, library and offices',
  },
  { id: 'a-level-first', name: 'A-Level Block', subtitle: 'First Floor · Classrooms and exam hall' },
  {
    id: 'o-level-ground',
    name: 'O-Level Block',
    subtitle: 'Ground Floor · Labs, staff room, library and canteen',
  },
  {
    id: 'o-level-first',
    name: 'O-Level Block',
    subtitle: 'First Floor · Classrooms and activity hall',
  },
]

export function getAreaById(id: string): CampusArea | undefined {
  return areas.find((area) => area.id === id)
}
