/** Writable classroom / campus boards — Press E on a board zone. */

export interface BoardInfo {
  id: string
  name: string
  hint: string
}

export const boards: BoardInfo[] = [
  { id: 'campus-notice', name: 'Campus Notice Board', hint: 'Timetables, events, student pins.' },
  { id: 'board-class-math', name: 'Math Board', hint: 'Homework and period notes.' },
  { id: 'board-class-physics', name: 'Physics Board', hint: 'Formulas and lab reminders.' },
  { id: 'board-class-computer', name: 'Computer Class Board', hint: 'Assignments and login tips.' },
  { id: 'board-lab-computer', name: 'Computer Lab Board', hint: 'Practical rota and machine rules.' },
  { id: 'board-lab-physics', name: 'Physics Lab Board', hint: 'Safety + experiment schedule.' },
  { id: 'board-lib-computer', name: 'Library Lab Board', hint: 'Catalogue tips and quiet hours.' },
  { id: 'board-lib-admin', name: 'Library Desk Board', hint: 'Issue desk notices.' },
  { id: 'board-admin', name: 'Admin Board', hint: 'Office queue and form reminders.' },
  { id: 'board-science-lab', name: 'Science Lab Board', hint: 'Department practicals.' },
  { id: 'board-computer-lab', name: 'IT Lab Board', hint: 'Wing computer rules.' },
]

export function getBoardById(id: string): BoardInfo | undefined {
  return boards.find((board) => board.id === id)
}
