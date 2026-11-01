import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'

export function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-[#2b2c6b]/30 backdrop-blur-sm animate-[fade_.15s_ease-out]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl animate-[rise_.2s_ease-out] dark:bg-[#1f1c38] sm:rounded-3xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink dark:text-white">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800" aria-label="إغلاق">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Notion-style page title: big emoji icon above the heading.
export function PageHeader({ title, subtitle, action, icon }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {icon && <div className="mb-2 text-5xl leading-none">{icon}</div>}
        <h1 className="text-3xl font-extrabold tracking-tight text-ink dark:text-white sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-ink-soft dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// A widget box with a pastel header band, like a home-screen widget.
export function Widget({ title, icon, head, action, sticker, children, className = '', bodyClass = 'p-4', grid = false }) {
  return (
    <section className={`widget ${className}`}>
      {sticker && <span className="sticker -top-5 end-4 z-10 text-4xl" style={{ animation: 'wiggle 4s ease-in-out infinite' }}>{sticker}</span>}
      {title && (
        <div className="widget-head" style={head ? { background: head } : undefined}>
          <span className="flex items-center gap-2">{icon && <span className="text-base">{icon}</span>}{title}</span>
          {action}
        </div>
      )}
      <div className={`${bodyClass} ${grid ? 'paper-grid rounded-b-[22px]' : ''}`}>{children}</div>
    </section>
  )
}

export function EmptyState({ icon, title, text, action }) {
  return (
    <div className="card paper-grid flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-20 w-20 rotate-[-4deg] items-center justify-center rounded-3xl bg-note text-4xl shadow-note">{icon}</div>
      <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Spinner({ className = '' }) {
  return <Loader2 className={`animate-spin ${className}`} size={20} />
}

export function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center text-brand-600">
      <Spinner />
    </div>
  )
}

export function ProgressRing({ value, size = 64, stroke = 6, color = '#7a64db', children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value || 0))
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-[#eeeaf9] dark:stroke-white/10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

// Two-step delete: first click arms, second click confirms.
export function ConfirmDelete({ onConfirm, label = 'حذف', className = '' }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <button
      type="button"
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      className={`btn-danger ${armed ? 'bg-rose-50 dark:bg-rose-950/40' : ''} ${className}`}
    >
      {armed ? 'متأكد؟ اضغط تاني' : label}
    </button>
  )
}

const TILE = {
  brand: { bg: '#eee8fc', fg: '#5a40b2' },
  amber: { bg: '#fff1cf', fg: '#b45309' },
  violet: { bg: '#e0f1fc', fg: '#0369a1' },
  rose: { bg: '#fde6ec', fg: '#be123c' },
  teal: { bg: '#ddf4ef', fg: '#0f766e' },
}

// Small pastel stat widget.
export function StatCard({ icon: Icon, emoji, label, value, hint, tone = 'brand' }) {
  const t = TILE[tone] ?? TILE.brand
  return (
    <div className="widget overflow-hidden p-4 sm:p-5">
      <div className="absolute -end-6 -top-6 h-20 w-20 rounded-full opacity-70" style={{ background: t.bg }} />
      <div className="relative flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl text-lg" style={{ background: t.bg, color: t.fg }}>
          {emoji ?? (Icon && <Icon size={18} />)}
        </div>
        <span className="text-xs font-semibold text-ink-soft dark:text-slate-400 sm:text-sm">{label}</span>
      </div>
      <div className="relative mt-3 font-display text-4xl font-extrabold leading-none text-ink dark:text-white">{value}</div>
      {hint && <div className="relative mt-1.5 text-xs text-ink-soft/80 dark:text-slate-400">{hint}</div>}
    </div>
  )
}
