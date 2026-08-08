/** Writable classroom / campus boards — Press E on a board zone. */

import { classroomIds, labIds, getRoomById } from './rooms'

export interface BoardInfo {
  id: string
  name: string
  hint: string
}

/** Every classroom whiteboard opens the same shared campus notice board. */
const classroomBoards: BoardInfo[] = classroomIds.map((roomId) => ({
  id: `board-${roomId}`,
  name: `${getRoomById(roomId)?.name ?? roomId} Whiteboard`,
  hint: 'Homework, period notes and campus pins.',
}))

const labBoards: BoardInfo[] = labIds.map((roomId) => ({
  id: `board-${roomId}`,
  name: `${getRoomById(roomId)?.name ?? roomId} Board`,
  hint: 'Safety rules, practical schedule and campus pins.',
}))

export const boards: BoardInfo[] = [
  { id: 'campus-notice', name: 'Campus Notice Board', hint: 'Timetables, events, student pins.' },
  ...classroomBoards,
  ...labBoards,
  { id: 'board-a-reception', name: 'A-Level Reception Board', hint: 'Office queue and form reminders.' },
  { id: 'board-o-reception', name: 'O-Level Reception Board', hint: 'Office queue and canteen notices.' },
]

export function getBoardById(id: string): BoardInfo | undefined {
  return boards.find((board) => board.id === id)
}
