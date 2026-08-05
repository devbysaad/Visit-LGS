/** Campus areas — outdoor grounds vs building interiors (camera-bounded). */

export interface CampusArea {
  id: string
  name: string
}

export const DEFAULT_AREA_ID = 'outdoor'

export const areas: CampusArea[] = [
  { id: 'outdoor', name: 'Campus Grounds' },
  { id: 'library', name: 'Library' },
  { id: 'classrooms', name: 'Classrooms' },
  { id: 'admin', name: 'Admin Building' },
  { id: 'canteen', name: 'Canteen' },
]

export function getAreaById(id: string): CampusArea | undefined {
  return areas.find((area) => area.id === id)
}
