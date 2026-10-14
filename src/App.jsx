import { useCallback, useEffect, useMemo, useState } from 'react'
import { AssignmentsPage, AttendancePage, Dashboard, ExamsPage, SettingsPage, StudyPlannerPage, TimetablePage } from '../Pages.jsx'
import { ConfirmDialog, Field, Icon, Modal, Toast } from '../components.jsx'
import { makeId, readStoredData, STORAGE_KEY, todayKey, validateImport } from '../utils.js'
import '../App.css'

const navigation = [
  { label: 'Dashboard', icon: 'grid' },
  { label: 'Timetable', icon: 'calendar' },
  { label: 'Assignments', icon: 'book' },
  { label: 'Attendance', icon: 'chart' },
  { label: 'Study Planner', icon: 'target' },
  { label: 'Exams', icon: 'cap' },
]
const pageTitles = { Dashboard: 'Your overview', Timetable: 'Weekly schedule', Assignments: 'Assignment tracker', Attendance: 'Attendance overview', 'Study Planner': 'Plan your focus', Exams: 'Exam countdown', Settings: 'Your preferences' }
const entityLabels = { timetable: 'class', assignment: 'assignment', attendance: 'subject', task: 'study task', exam: 'exam' }
const collections = { timetable: 'timetable', assignment: 'assignments', attendance: 'attendance', task: 'tasks', exam: 'exams' }
const emptyData = () => ({ profile: { name: 'Priya' }, theme: 'light', timetable: [], assignments: [], attendance: [], tasks: [], exams: [] })

function initialState() {
  return readStoredData()
}

function App() {
  const [{ data: loaded, issue: loadIssue }] = useState(initialState)
  const [data, setData] = useState(loaded)
  const [page, setPage] = useState('Dashboard')
  const [editor, setEditor] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState(loadIssue ? { type: 'error', message: loadIssue } : null)
  const [query, setQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch (error) {
      console.error('Could not save Campus Life Hub data:', error)
      setToast({ type: 'error', message: 'Your changes could not be saved to this browser. Check available storage.' })
    }
  }, [data])
  useEffect(() => { document.documentElement.dataset.theme = data.theme }, [data.theme])

  const showToast = useCallback((message, type = 'success') => setToast({ message, type }), [])
  const navigate = (label) => { setPage(label); setMobileOpen(false); setQuery(''); setNotificationsOpen(false) }
  const openEditor = (type, item = null) => setEditor({ type, item })
  const updateCollection = (type, updater) => {
    const collection = collections[type]
    setData((previous) => ({ ...previous, [collection]: updater(previous[collection]) }))
  }
  const saveRecord = (type, values) => {
    const item = { ...values, id: editor.item?.id || makeId() }
    updateCollection(type, (records) => editor.item
      ? records.map((record) => record.id === editor.item.id ? { ...item, ...(record.demo ? { demo: true } : {}) } : record)
      : [...records, item])
    showToast(`${entityLabels[type][0].toUpperCase()}${entityLabels[type].slice(1)} ${editor.item ? 'updated' : 'added'}.`)
    setEditor(null)
  }
  const requestDelete = (type, item) => {
    setConfirm({
      title: `Delete ${entityLabels[type]}?`,
      message: `“${item.title || item.subject || item.name}” will be removed from your browser. This can’t be undone.`,
      confirmLabel: 'Delete',
      action: () => {
        updateCollection(type, (records) => records.filter((record) => record.id !== item.id))
        showToast(`${entityLabels[type][0].toUpperCase()}${entityLabels[type].slice(1)} deleted.`)
      },
    })
  }
  const toggleTask = (id) => updateCollection('task', (records) => records.map((item) => item.id === id ? { ...item, completed: !item.completed } : item))
  const updateAssignmentStatus = (item, status) => updateCollection('assignment', (records) => records.map((record) => record.id === item.id ? { ...record, status } : record))

  const notifications = useMemo(() => [
    ...data.assignments.filter((item) => item.status !== 'Completed').map((item) => ({ kind: 'assignment', title: item.title, subject: item.subject, date: item.dueDate })),
    ...data.exams.map((item) => ({ kind: 'exam', title: item.name, subject: item.subject, date: item.date })),
  ].filter((item) => {
    const days = Math.round((new Date(`${item.date}T00:00:00`) - new Date(`${todayKey()}T00:00:00`)) / 86400000)
    return days >= 0 && days <= 7
  }).sort((a, b) => a.date.localeCompare(b.date)), [data.assignments, data.exams])

  const searchResults = useMemo(() => {
    if (!query.trim()) return []
    const needle = query.toLowerCase()
    return [
      ...data.assignments.filter((item) => `${item.title} ${item.subject} ${item.description}`.toLowerCase().includes(needle)).map((item) => ({ title: item.title, subtitle: `Assignment · ${item.subject}`, page: 'Assignments' })),
      ...data.exams.filter((item) => `${item.name} ${item.subject} ${item.notes}`.toLowerCase().includes(needle)).map((item) => ({ title: item.name, subtitle: `Exam · ${item.subject}`, page: 'Exams' })),
      ...data.timetable.filter((item) => `${item.subject} ${item.room} ${item.teacher}`.toLowerCase().includes(needle)).map((item) => ({ title: item.subject, subtitle: `Class · ${item.day}`, page: 'Timetable' })),
      ...data.attendance.filter((item) => item.subject.toLowerCase().includes(needle)).map((item) => ({ title: item.subject, subtitle: 'Attendance subject', page: 'Attendance' })),
      ...data.tasks.filter((item) => `${item.title} ${item.subject}`.toLowerCase().includes(needle)).map((item) => ({ title: item.title, subtitle: `Study task · ${item.subject}`, page: 'Study Planner' })),
    ].slice(0, 7)
  }, [data, query])

  const confirmClearDemo = () => {
    const count = ['timetable', 'assignments', 'attendance', 'tasks', 'exams'].reduce((sum, key) => sum + data[key].filter((item) => item.demo).length, 0)
    if (!count) { showToast('There is no sample data to remove.'); return }
    setConfirm({
      title: 'Remove sample data?',
      message: `${count} sample ${count === 1 ? 'record' : 'records'} will be removed. Your own records will stay.`,
      confirmLabel: 'Remove samples',
      action: () => {
        setData((previous) => Object.fromEntries(Object.entries(previous).map(([key, value]) =>
          Array.isArray(value) ? [key, value.filter((item) => !item.demo)] : [key, value])))
        showToast('Sample data removed.')
      },
    })
  }
  const confirmClearTimetableDemo = () => {
    const count = data.timetable.filter((item) => item.demo).length
    setConfirm({
      title: 'Clear sample timetable entries?',
      message: `${count} sample ${count === 1 ? 'class' : 'classes'} will be removed. Your other timetable entries will stay.`,
      confirmLabel: 'Clear sample entries',
      action: () => {
        updateCollection('timetable', (records) => records.filter((item) => !item.demo))
        showToast('Sample timetable entries removed.')
      },
    })
  }
  const confirmReset = () => setConfirm({
    title: 'Reset all data?',
    message: 'This permanently removes all records and settings stored by Campus Life Hub in this browser. Export a backup first if you may need it.',
    confirmLabel: 'Reset everything',
    action: () => { setData(emptyData()); showToast('All application data has been reset.') },
  })
  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'campus-life-hub-backup.json'
    link.click()
    URL.revokeObjectURL(url)
    showToast('Your data export is ready.')
  }
  const importData = async (file) => {
    if (!file) return
    try {
      const imported = validateImport(JSON.parse(await file.text()))
      setConfirm({
        title: 'Replace saved data?',
        message: 'Importing this backup replaces all current Campus Life Hub records and preferences. Export your current data first if you want to keep it.',
        confirmLabel: 'Import and replace',
        danger: false,
        action: () => { setData(imported); showToast('Data imported successfully.') },
      })
    } catch (error) {
      console.error('Could not import Campus Life Hub data:', error)
      showToast(error instanceof SyntaxError ? 'This file is not valid JSON.' : error.message || 'The selected data file could not be imported.', 'error')
    }
  }

  const activePage = () => {
    const deleteAction = (type) => (item) => requestDelete(type, item)
    switch (page) {
      case 'Timetable': return <TimetablePage items={data.timetable} onAdd={(type) => openEditor(type)} onEdit={openEditor} onDelete={deleteAction('timetable')} onClearDemo={confirmClearTimetableDemo} />
      case 'Assignments': return <AssignmentsPage items={data.assignments} onAdd={(type) => openEditor(type)} onEdit={openEditor} onDelete={deleteAction('assignment')} onStatus={updateAssignmentStatus} />
      case 'Attendance': return <AttendancePage items={data.attendance} onAdd={(type) => openEditor(type)} onEdit={openEditor} onDelete={deleteAction('attendance')} />
      case 'Study Planner': return <StudyPlannerPage items={data.tasks} onAdd={(type) => openEditor(type)} onEdit={openEditor} onDelete={deleteAction('task')} onToggleTask={toggleTask} />
      case 'Exams': return <ExamsPage items={data.exams} onAdd={(type) => openEditor(type)} onEdit={openEditor} onDelete={deleteAction('exam')} />
      case 'Settings': return <SettingsPage name={data.profile.name} theme={data.theme} onName={(name) => { setData((prev) => ({ ...prev, profile: { ...prev.profile, name: name.trim() } })); showToast('Display name updated.') }} onTheme={(theme) => setData((prev) => ({ ...prev, theme }))} onClearDemo={confirmClearDemo} onReset={confirmReset} onExport={exportData} onImport={importData} />
      default: return <Dashboard data={data} name={data.profile.name} onAdd={(type) => openEditor(type)} onNavigate={navigate} onToggleTask={toggleTask} />
    }
  }

  return <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <button className="brand" onClick={() => navigate('Dashboard')} aria-label="Campus Life Hub dashboard"><span className="brand-mark"><span /><span /><span /><span /></span><span className="brand-wordmark">campus<span>life</span><small>HUB</small></span></button>
      <div className="nav-caption">WORKSPACE</div><nav aria-label="Main navigation">{navigation.map((item) => <button key={item.label} className={`nav-link ${page === item.label ? 'active' : ''}`} onClick={() => navigate(item.label)} title={sidebarCollapsed ? item.label : undefined}><Icon name={item.icon} /><span>{item.label}</span>{item.label === 'Assignments' && data.assignments.filter((task) => task.status !== 'Completed').length > 0 && <i className="nav-count">{data.assignments.filter((task) => task.status !== 'Completed').length}</i>}</button>)}</nav>
      <div className="sidebar-spacer" /><div className="sidebar-note"><span className="note-icon"><Icon name="sun" size={18} /></span><strong>Small steps add up.</strong><p>You’re doing better than you think.</p></div><button className={`nav-link settings-link ${page === 'Settings' ? 'active' : ''}`} onClick={() => navigate('Settings')} title={sidebarCollapsed ? 'Settings' : undefined}><Icon name="settings" /><span>Settings</span></button>
      <div className="sidebar-profile"><span className="avatar">{(data.profile.name || 'P').slice(0, 1).toUpperCase()}</span><span className="profile-info"><strong>{data.profile.name}</strong><small>Student workspace</small></span><button className="icon-button sidebar-collapse" onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}><Icon name="dots" /></button></div>
    </aside>
    {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button><div className="topbar-title"><span className="breadcrumb">Campus Life Hub <span>/</span></span><h1>{pageTitles[page]}</h1></div>
        <div className="topbar-actions"><div className="global-search"><Icon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search anything..." aria-label="Search assignments, subjects and exams" onKeyDown={(event) => { if (event.key === 'Escape') setQuery('') }} />{query && <button className="search-clear" onClick={() => setQuery('')} aria-label="Clear search"><Icon name="close" size={15} /></button>}
          {query && <div className="search-results">{searchResults.length ? searchResults.map((result, index) => <button key={`${result.title}-${index}`} onClick={() => navigate(result.page)}><span><strong>{result.title}</strong><small>{result.subtitle}</small></span><Icon name="arrow" size={15} /></button>) : <p>No matches yet. Try another search.</p>}</div>}</div>
          <div className="notification-wrap"><button className={`icon-button notification-button ${notificationsOpen ? 'selected' : ''}`} aria-label={`${notifications.length} upcoming notifications`} onClick={() => { setNotificationsOpen((value) => !value); setQuery('') }}><Icon name="bell" /><i className={notifications.length ? 'notification-dot' : ''} /></button>{notificationsOpen && <div className="notification-popover"><div className="popover-heading"><strong>Coming up</strong><span>{notifications.length}</span></div>{notifications.length ? notifications.slice(0, 6).map((item, index) => <button className="notification-item" key={`${item.kind}-${index}`} onClick={() => navigate(item.kind === 'exam' ? 'Exams' : 'Assignments')}><span className={`notification-icon ${item.kind}`}><Icon name={item.kind === 'exam' ? 'cap' : 'book'} size={16} /></span><span><strong>{item.title}</strong><small>{item.kind === 'exam' ? 'Exam' : 'Assignment'} · {item.subject}</small></span><time>{item.date === todayKey() ? 'Today' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${item.date}T12:00:00`))}</time></button>) : <p className="popover-empty">You’re all clear for the next 7 days.</p>}</div>}</div>
          <button className="icon-button theme-toggle" onClick={() => setData((prev) => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }))} aria-label={`Switch to ${data.theme === 'light' ? 'dark' : 'light'} theme`}><Icon name={data.theme === 'light' ? 'moon' : 'sun'} /></button><div className="top-profile"><span className="avatar">{(data.profile.name || 'P').slice(0, 1).toUpperCase()}</span><span><strong>{data.profile.name}</strong><small>Student</small></span></div>
        </div>
      </header>
      <div className="workspace" onClick={(event) => { if (!event.target.closest('.global-search') && !event.target.closest('.notification-wrap')) { setQuery(''); setNotificationsOpen(false) } }}>{activePage()}</div>
    </main>
    {editor && <RecordEditor editor={editor} onClose={() => setEditor(null)} onSave={saveRecord} />}
    {confirm && <ConfirmDialog title={confirm.title} message={confirm.message} confirmLabel={confirm.confirmLabel} danger={confirm.danger !== false} onCancel={() => setConfirm(null)} onConfirm={() => { const action = confirm.action; setConfirm(null); action() }} />}
    <Toast toast={toast} onClose={() => setToast(null)} />
  </div>
}

const fieldDefinitions = {
  timetable: [
    { key: 'subject', label: 'Subject name', required: true, placeholder: 'e.g. Design Fundamentals' },
    { key: 'day', label: 'Day', kind: 'select', required: true, options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    { key: 'start', label: 'Start time', kind: 'time', required: true },
    { key: 'end', label: 'End time', kind: 'time', required: true },
    { key: 'room', label: 'Room or classroom', placeholder: 'e.g. Studio 204' },
    { key: 'teacher', label: 'Teacher (optional)', placeholder: 'e.g. Prof. Mehta' },
  ],
  assignment: [
    { key: 'title', label: 'Assignment title', required: true, placeholder: 'What do you need to do?' },
    { key: 'subject', label: 'Subject', required: true, placeholder: 'e.g. Design Fundamentals' },
    { key: 'description', label: 'Description', kind: 'textarea', placeholder: 'Add a few details or next steps...' },
    { key: 'dueDate', label: 'Due date', kind: 'date', required: true },
    { key: 'priority', label: 'Priority', kind: 'select', required: true, options: ['Low', 'Medium', 'High'] },
    { key: 'status', label: 'Status', kind: 'select', required: true, options: ['Pending', 'In Progress', 'Completed'] },
  ],
  attendance: [
    { key: 'subject', label: 'Subject name', required: true, placeholder: 'e.g. Design Fundamentals' },
    { key: 'total', label: 'Total classes conducted', kind: 'number', required: true, min: 0, step: 1 },
    { key: 'attended', label: 'Classes attended', kind: 'number', required: true, min: 0, step: 1 },
    { key: 'target', label: 'Required attendance (%)', kind: 'number', required: true, min: 1, max: 100, step: 1, hint: 'Most courses require 75% attendance.' },
  ],
  task: [
    { key: 'title', label: 'Task title', required: true, placeholder: 'e.g. Review lecture notes' },
    { key: 'subject', label: 'Subject', required: true, placeholder: 'e.g. Design Research' },
    { key: 'duration', label: 'Planned duration (minutes)', kind: 'number', required: true, min: 1, step: 1 },
    { key: 'date', label: 'Scheduled date', kind: 'date', required: true },
  ],
  exam: [
    { key: 'name', label: 'Exam name', required: true, placeholder: 'e.g. Semester assessment' },
    { key: 'subject', label: 'Subject', required: true, placeholder: 'e.g. Design Fundamentals' },
    { key: 'date', label: 'Exam date', kind: 'date', required: true },
    { key: 'notes', label: 'Notes (optional)', kind: 'textarea', placeholder: 'Room, materials to bring, topics...' },
  ],
}

function RecordEditor({ editor, onClose, onSave }) {
  const { type, item } = editor
  const defaults = {
    timetable: { day: 'Monday', start: '', end: '', room: '', teacher: '' },
    assignment: { dueDate: todayKey(), priority: 'Medium', status: 'Pending', description: '' },
    attendance: { total: 0, attended: 0, target: 75 },
    task: { duration: 30, date: todayKey() },
    exam: { date: todayKey(), notes: '' },
  }
  const [values, setValues] = useState(() => ({ ...defaults[type], ...(item || {}) }))
  const [error, setError] = useState('')
  const fields = fieldDefinitions[type]
  const update = (key, value) => setValues((previous) => ({ ...previous, [key]: value }))
  const submit = (event) => {
    event.preventDefault()
    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity()
      return
    }
    if (fields.some((field) => field.required && !String(values[field.key] ?? '').trim())) {
      setError('Please fill in all required fields.')
      return
    }
    if (type === 'timetable' && values.end <= values.start) { setError('End time must be later than start time.'); return }
    if (type === 'attendance' && Number(values.attended) > Number(values.total)) { setError('Classes attended cannot exceed total classes conducted.'); return }
    if (type === 'attendance' && (!Number.isInteger(Number(values.total)) || !Number.isInteger(Number(values.attended)))) { setError('Class counts must be non-negative whole numbers.'); return }
    if (type === 'task' && (!Number.isInteger(Number(values.duration)) || Number(values.duration) < 1)) { setError('Planned duration must be a positive whole number of minutes.'); return }
    const normalized = { ...values }
    if (type === 'attendance') ['total', 'attended', 'target'].forEach((key) => { normalized[key] = Number(values[key]) })
    if (type === 'task') normalized.duration = Number(values.duration)
    if (type === 'attendance' && (normalized.target < 1 || normalized.target > 100)) { setError('Required attendance must be between 1% and 100%.'); return }
    onSave(type, normalized)
  }
  return <Modal title={`${item ? 'Edit' : 'Add'} ${entityLabels[type]}`} onClose={onClose}><form className="record-form" onSubmit={submit} noValidate>
    {fields.map((field) => <Field key={field.key} label={field.label} required={field.required} hint={field.hint}>{field.kind === 'select' ? <select required={field.required} value={values[field.key] ?? ''} onChange={(event) => update(field.key, event.target.value)}>{field.options.map((option) => <option key={option}>{option}</option>)}</select> : field.kind === 'textarea' ? <textarea value={values[field.key] || ''} placeholder={field.placeholder} rows={3} onChange={(event) => update(field.key, event.target.value)} /> : <input type={field.kind || 'text'} min={field.min} max={field.max} step={field.step} required={field.required} value={values[field.key] ?? ''} placeholder={field.placeholder} onChange={(event) => update(field.key, event.target.value)} />}</Field>)}
    {error && <div className="form-error" role="alert">{error}</div>}<div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit">{item ? 'Save changes' : `Add ${entityLabels[type]}`}</button></div>
  </form></Modal>
}

export default App
