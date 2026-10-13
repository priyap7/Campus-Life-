import { useEffect } from 'react'

const paths = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
  calendar: 'M7 2v4 M17 2v4 M3 9h18 M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z M4 5.5v13 M8 7h8 M8 11h7',
  chart: 'M4 19V5 M4 19h17 M8 16v-5 M13 16V7 M18 16v-8',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  cap: 'M2 10 12 5l10 5-10 5z M6 12v5c3.5 2.5 8.5 2.5 12 0v-5 M22 10v6',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 3.1-.2-.1a1.7 1.7 0 0 0-1.8.1l-.2.1h-3.6l-.1-.2a1.7 1.7 0 0 0-1.6-.9h-.3l-1.8-3.1.1-.2a1.7 1.7 0 0 0-.3-1.8l-.1-.2v-3.6l.2-.1a1.7 1.7 0 0 0 .9-1.6v-.3l3.1-1.8.2.1a1.7 1.7 0 0 0 1.8-.3l.2-.1h3.6l.1.2a1.7 1.7 0 0 0 1.6.9h.3l1.8 3.1-.1.2a1.7 1.7 0 0 0 .3 1.8l.1.2v3.6l-.2.1a1.7 1.7 0 0 0-.9 1.6v.3',
  search: 'm20 20-4.5-4.5 M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4',
  moon: 'M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13z',
  plus: 'M12 5v14 M5 12h14',
  close: 'M18 6 6 18 M6 6l12 12',
  edit: 'm14 5 5 5 M4 20l4-.8L19.5 7.7a2.1 2.1 0 0 0-3-3L5 16.2z',
  trash: 'M3 6h18 M8 6V4h8v2 M19 6l-1 15H6L5 6 M10 11v6 M14 11v6',
  check: 'm5 12 4 4L19 6',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2',
  bookOpen: 'M12 7v14 M3 18V5a2 2 0 0 1 2-2h4a3 3 0 0 1 3 3 3 3 0 0 1 3-3h4a2 2 0 0 1 2 2v13h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z',
  dots: 'M5 12h.01 M12 12h.01 M19 12h.01',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  export: 'M12 15V3 M7 8l5-5 5 5 M4 15v5h16v-5',
}

export function Icon({ name, size = 19, className = '' }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.grid} /></svg>
}

export function ProgressBar({ value, color = 'purple', label }) {
  const width = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  return <div className="progress-track" role="progressbar" aria-valuenow={Math.round(width)} aria-valuemin="0" aria-valuemax="100" aria-label={label}><span className={`progress-fill ${color}`} style={{ width: `${width}%` }} /></div>
}

export function EmptyState({ icon = 'bookOpen', title, detail, action }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={icon} size={23} /></span><strong>{title}</strong><p>{detail}</p>{action}</div>
}

export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title"><header className="modal-header"><h2 id="modal-title">{title}</h2><button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button></header>{children}</section></div>
}

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(onClose, 4000)
    return () => window.clearTimeout(timer)
  }, [toast, onClose])
  if (!toast) return null
  return <div className={`toast toast-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}><Icon name={toast.type === 'error' ? 'close' : 'check'} size={17} />{toast.message}<button type="button" onClick={onClose} aria-label="Dismiss message"><Icon name="close" size={16} /></button></div>
}

export function Field({ label, required = false, children, hint }) {
  return <label className="field"><span>{label}{required && <span className="required"> *</span>}</span>{children}{hint && <small>{hint}</small>}</label>
}

export function SectionHeading({ title, subtitle, action, eyebrow }) {
  return <div className="section-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>
}

export function SummaryCard({ label, value, note, icon, tone, trend }) {
  return <article className="summary-card"><div className="summary-top"><span className={`summary-icon ${tone}`}><Icon name={icon} /></span>{trend && <span className="summary-trend">{trend}</span>}</div><div className="summary-value">{value}</div><div className="summary-label">{label}</div>{note && <div className="summary-note">{note}</div>}</article>
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', onCancel, onConfirm, danger = true }) {
  return <Modal title={title} onClose={onCancel}><p className="confirm-message">{message}</p><div className="modal-actions"><button className="button button-quiet" type="button" onClick={onCancel}>Cancel</button><button className={`button ${danger ? 'button-danger' : 'button-primary'}`} type="button" onClick={onConfirm}>{confirmLabel}</button></div></Modal>
}

export function PageToolbar({ children }) {
  return <div className="page-toolbar">{children}</div>
}
