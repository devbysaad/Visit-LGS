import { LibraryBook } from '../../../types/Content'

/**
 * Library shelf copy. Source of truth: docs/CONTENT.md — mirror changes here.
 */
export const libraryBooks: LibraryBook[] = [
  {
    id: 'campus-handbook',
    title: 'Gudwal Campus Handbook',
    author: 'Student Affairs',
    blurb: 'Gates, offices, and how to find your way on day one.',
    pages: [
      'Welcome to LGS Wah Cantt (Gudwal).\n\nThis handbook covers the main places you will visit in your first week: the gate, Admin, Fee Counter, Library, labs, and Canteen.',
      'Main Gate\n\nEnter here each morning. Watch for cars at pickup. Reception just inside can point you to Admin if you still have forms.',
      'Admin & Fees\n\nAdmin handles certificates and letters. The Fee Counter is next door — keep every challan receipt.\n\nBring your student ID for both desks.',
      'Library rules\n\nSilence helps everyone revise. Issue books at the front desk and return them before the stamped date.\n\nAsk Ms. Nadia if you are unsure.',
      'Labs & Canteen\n\nNever enter unsupervised practicals. Computer Lab logins come from IT staff.\n\nCanteen queues stay orderly — dispose of litter before you leave.',
    ],
  },
  {
    id: 'study-skills',
    title: 'Study Skills for New Students',
    author: 'Library Desk',
    blurb: 'Short tips for revising quietly and on time.',
    pages: [
      'Start small\n\nPick one subject and one chapter. Twenty focused minutes beat two distracted hours.',
      'Silence zone\n\nThe library reading tables are for quiet work. Phones on mute. Whisper only if you must.',
      'Ask early\n\nIf a book is out on loan, put your name on the wait list at the issue desk the same day.',
      'Before you leave\n\nCheck return dates. Late books block the next student who needs them.',
    ],
  },
  {
    id: 'science-safety',
    title: 'Lab Safety Primer',
    author: 'Science Department',
    blurb: 'What to do (and not do) before your first practical.',
    pages: [
      'Always wait for a teacher or lab attendant before entering a practical room.',
      'Wear the kit posted on the door — coats, goggles, or closed shoes when required.',
      'Never taste chemicals. Never mix anything “just to see.” Report spills immediately.',
      'Computer Lab: use school credentials only. No unauthorised installs or USB games.',
    ],
  },
  {
    id: 'house-spirit',
    title: 'House Spirit & Sports Days',
    author: 'PE Department',
    blurb: 'Kit, matches, and how to cheer without getting in the way.',
    pages: [
      'Sports days need PE kit. Check the notice board for house colours and match times.',
      'Stay clear of the pitch during active matches unless you are playing or marshalling.',
      'Cheer from the sidelines. Leave water bottles and bags off the running lanes.',
      'Injured? Tell a PE teacher straight away — do not “play through” a twist or fall.',
    ],
  },
]

export function getLibraryBookById(id: string): LibraryBook | undefined {
  return libraryBooks.find((book) => book.id === id)
}
