export const STORAGE_KEY = 'campus-life-hub-v1'

export const dateKey = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

export const todayKey = () => dateKey(new Date())
export const makeId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
export const formatDate = (value, options = { month: 'short', day: 'numeric' }) =>
  value ? new Date(`${value}T12:00:00`).toLocaleDateString(undefined, options) : 'No date'
export const daysUntil = (value) => {
  if (!value) return 0
  const today = new Date(`${todayKey()}T00:00:00`)
  const target = new Date(`${value}T00:00:00`)
  return Math.round((target - today) / 86400000)
}

const today = todayKey()
const nextDate = (offset) => dateKey(new Date(Date.now() + offset * 86400000))

export const createInitialData = () => ({
  profile: { name: 'Priya' },
  theme: 'light',
  timetable: [
    { id: makeId(), subject: 'Design Fundamentals', day: 'Monday', start: '09:00', end: '10:30', room: 'Studio 204', teacher: 'Prof. Mehta', demo: true },
    { id: makeId(), subject: 'Human Computer Interaction', day: 'Monday', start: '11:00', end: '12:00', room: 'Block B · 302', teacher: 'Dr. Rao', demo: true },
    { id: makeId(), subject: 'Visual Communication', day: 'Tuesday', start: '10:00', end: '11:30', room: 'Studio 106', teacher: 'Prof. Kapoor', demo: true },
    { id: makeId(), subject: 'Design Research', day: 'Wednesday', start: '13:00', end: '14:30', room: 'Block A · 201', teacher: 'Dr. Shah', demo: true },
    { id: makeId(), subject: 'Digital Prototyping', day: 'Thursday', start: '09:30', end: '11:00', room: 'Lab 3', teacher: 'Prof. Mehta', demo: true },
    { id: makeId(), subject: 'Typography', day: 'Friday', start: '11:00', end: '12:30', room: 'Studio 204', teacher: '', demo: true },
  ],
  assignments: [
    { id: makeId(), title: 'Portfolio case study', subject: 'Design Fundamentals', description: 'Document the process behind your latest studio project.', dueDate: nextDate(2), priority: 'High', status: 'In Progress', demo: true },
    { id: makeId(), title: 'Usability test plan', subject: 'Human Computer Interaction', description: 'Prepare a short plan for next week’s user testing.', dueDate: nextDate(5), priority: 'Medium', status: 'Pending', demo: true },
    { id: makeId(), title: 'Visual research journal', subject: 'Visual Communication', description: 'Collect references and add a few notes about each.', dueDate: nextDate(-1), priority: 'Low', status: 'Pending', demo: true },
  ],
  attendance: [
    { id: makeId(), subject: 'Design Fundamentals', total: 18, attended: 16, target: 75, demo: true },
    { id: makeId(), subject: 'Human Computer Interaction', total: 20, attended: 15, target: 75, demo: true },
    { id: makeId(), subject: 'Visual Communication', total: 16, attended: 12, target: 75, demo: true },
  ],
  tasks: [
    { id: makeId(), subject: 'Design Fundamentals', title: 'Refine portfolio layout', duration: 60, date: today, completed: false, demo: true },
    { id: makeId(), subject: 'Human Computer Interaction', title: 'Review interview notes', duration: 45, date: today, completed: true, demo: true },
    { id: makeId(), subject: 'Visual Communication', title: 'Gather poster references', duration: 30, date: nextDate(1), completed: false, demo: true },
  ],
  exams: [
    { id: makeId(), name: 'Studio critique', subject: 'Design Fundamentals', date: nextDate(14), notes: 'Bring printed portfolio boards.', demo: true },
    { id: makeId(), name: 'Research methods', subject: 'Design Research', date: nextDate(27), notes: '', demo: true },
  ],
})

export const readStoredData = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return { data: createInitialData(), issue: '' }
  try {
    const parsed = JSON.parse(saved)
    const defaults = createInitialData()
    const data = Object.fromEntries(Object.keys(defaults).map((key) => [key, parsed[key] ?? defaults[key]]))
    return { data: validateImport(data), issue: '' }
  } catch (error) {
    console.error('Could not read saved Campus Life Hub data:', error)
    return { data: createInitialData(), issue: 'Saved data could not be read. A fresh demo workspace is shown; export or clear the damaged browser data if this keeps happening.' }
  }
}

export const attendanceStats = (entry) => {
  const total = Number(entry.total) || 0
  const attended = Number(entry.attended) || 0
  const target = Number(entry.target) || 75
  const percentage = total === 0 ? 0 : (attended / total) * 100
  const classesNeeded = target === 100
    ? (percentage >= 100 ? 0 : Infinity)
    : Math.max(0, Math.ceil((target * total - 100 * attended) / (100 - target)))
  return { percentage, classesNeeded, achievable: target < 100 || percentage >= 100 }
}

export const validateImport = (value) => {
  const lists = ['timetable', 'assignments', 'attendance', 'tasks', 'exams']
  const validDate = (date) => {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
    const [year, month, day] = date.split('-').map(Number)
    return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) === date
  }
  const validText = (text) => typeof text === 'string'
  if (!value || typeof value !== 'object' || Array.isArray(value) || !value.profile || typeof value.profile.name !== 'string' ||
      value.profile.name.trim().length < 1 || value.profile.name.length > 40 ||
      !['light', 'dark'].includes(value.theme) || lists.some((key) => !Array.isArray(value[key]))) {
    throw new Error('This file is not a valid Campus Life Hub data export.')
  }
  const normalized = {
    ...value,
    timetable: value.timetable.map((item) => ({ ...item, room: item.room ?? '', teacher: item.teacher ?? '' })),
    assignments: value.assignments.map((item) => ({ ...item, description: item.description ?? '' })),
    exams: value.exams.map((item) => ({ ...item, notes: item.notes ?? '' })),
  }
  for (const key of lists) {
    if (normalized[key].some((item) => !item || typeof item.id !== 'string' || !item.id.trim())) {
      throw new Error(`The ${key} section contains an invalid record.`)
    }
    if (new Set(normalized[key].map((item) => item.id)).size !== normalized[key].length) {
      throw new Error(`The ${key} section contains duplicate record IDs.`)
    }
  }
  const invalid = {
    timetable: (item) => !validText(item.subject) || !item.subject.trim() ||
      !['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(item.day) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.end) ||
      item.end <= item.start || !validText(item.room) || !validText(item.teacher),
    assignments: (item) => !validText(item.title) || !item.title.trim() || !validText(item.subject) || !item.subject.trim() ||
      !validText(item.description) || !validDate(item.dueDate) || !['Low', 'Medium', 'High'].includes(item.priority) ||
      !['Pending', 'In Progress', 'Completed'].includes(item.status),
    attendance: (item) => !validText(item.subject) || !item.subject.trim() ||
      !Number.isInteger(item.total) || item.total < 0 || !Number.isInteger(item.attended) ||
      item.attended < 0 || item.attended > item.total || !Number.isInteger(item.target) || item.target < 1 || item.target > 100,
    tasks: (item) => !validText(item.title) || !item.title.trim() || !validText(item.subject) || !item.subject.trim() ||
      !Number.isInteger(item.duration) || item.duration < 1 || !validDate(item.date) || typeof item.completed !== 'boolean',
    exams: (item) => !validText(item.name) || !item.name.trim() || !validText(item.subject) || !item.subject.trim() ||
      !validDate(item.date) || !validText(item.notes),
  }
  for (const key of lists) {
    if (normalized[key].some(invalid[key])) throw new Error(`The ${key} section contains invalid field values.`)
  }
  return normalized
}
