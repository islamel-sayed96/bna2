import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Clock, Check, AlertCircle, Pencil } from 'lucide-react'
import { useCollection } from '../lib/useCollection'
import { addDays, addDaysKey, DAY_NAMES, DAY_SHORT, formatLong, formatMonth, formatShort, formatTime, fromKey, startOfWeek, toKey, todayKey } from '../lib/dates'
import { color } from '../lib/colors'
import { ConfirmDelete, EmptyState, Modal, PageHeader, PageLoader } from '../components/ui'

export const EVENT_CATEGORIES = {
  work: { name: 'شغل', color: 'indigo' },
  meeting: { name: 'اجتماع', color: 'violet' },
  study: { name: 'دراسة', color: 'sky' },
  personal: { name: 'شخصي', color: 'teal' },
  health: { name: 'صحة ورياضة', color: 'emerald' },
  family: { name: 'عائلة', color: 'rose' },
  other: { name: 'أخرى', color: 'slate' },
}
const PRIORITIES = {
  high: { name: 'عالية', cls: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' },
  normal: { name: 'عادية', cls: '' },
  low: { name: 'منخفضة', cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
}

export const sortEvents = (a, b) =>
  a.date.localeCompare(b.date) || (a.start_time || '99').localeCompare(b.start_time || '99') || (a.created_at ?? '').localeCompare(b.created_at ?? '')

export default function Schedule() {
  const events = useCollection('events')
  const today = todayKey()
  const [selected, setSelected] = useState(today)
  const [editing, setEditing] = useState(null) // null | 'new' | event

  const weekStart = startOfWeek(fromKey(selected))
  const week = Array.from({ length: 7 }, (_, i) => toKey(addDays(weekStart, i)))

  if (events.loading) return <PageLoader />

  const byDay = (d) => events.rows.filter((e) => e.date === d).sort(sortEvents)
  const dayEvents = byDay(selected)
  const overdue = events.rows.filter((e) => !e.done && e.date < today).sort(sortEvents)

  return (
    <>
      <PageHeader
        title="الجدول والالتزامات"
        subtitle="مواعيدك ومهامك، مرتبة يوم بيوم."
        action={<button className="btn-primary" onClick={() => setEditing('new')}><Plus size={18} /> موعد / مهمة</button>}
      />

      {/* Week navigator */}
      <div className="card mb-6 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button className="btn-ghost p-2" onClick={() => setSelected(addDaysKey(selected, -7))} aria-label="الأسبوع السابق"><ChevronRight size={18} /></button>
            <button className="btn-ghost p-2" onClick={() => setSelected(addDaysKey(selected, 7))} aria-label="الأسبوع التالي"><ChevronLeft size={18} /></button>
            <h2 className="ms-2 font-semibold text-slate-900 dark:text-white">{formatMonth(fromKey(selected))}</h2>
          </div>
          {selected !== today && <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => setSelected(today)}>النهارده</button>}
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {week.map((d) => {
            const items = byDay(d)
            const pending = items.filter((e) => !e.done).length
            const isSel = d === selected
            const isToday = d === today
            return (
              <button
                key={d}
                onClick={() => setSelected(d)}
                className={`flex flex-col items-center rounded-2xl px-1 py-2.5 transition sm:py-3 ${
                  isSel ? 'bg-brand-700 text-white shadow-md shadow-brand-700/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`text-[11px] ${isSel ? 'text-brand-100' : 'text-slate-500'}`}>{DAY_SHORT[fromKey(d).getDay()]}</span>
                <span className={`mt-1 text-lg font-bold ${!isSel && isToday ? 'text-brand-700 dark:text-brand-400' : ''}`}>{fromKey(d).getDate()}</span>
                <span className="mt-1 flex h-1.5 gap-0.5">
                  {items.slice(0, 3).map((e) => (
                    <span key={e.id} className={`h-1.5 w-1.5 rounded-full ${isSel ? 'bg-white/80' : e.done ? 'bg-slate-300 dark:bg-slate-600' : color(EVENT_CATEGORIES[e.category]?.color).dot}`} />
                  ))}
                </span>
                {pending > 3 && <span className="sr-only">{pending}</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {selected === today ? 'النهارده' : DAY_NAMES[fromKey(selected).getDay()]} <span className="text-sm font-normal text-slate-500">· {formatLong(fromKey(selected))}</span>
            </h3>
            {dayEvents.length > 0 && <span className="text-xs text-slate-500">{dayEvents.filter((e) => e.done).length} من {dayEvents.length} خلصت</span>}
          </div>
          {dayEvents.length === 0 ? (
            <EmptyState icon="🗓️" title="يوم فاضي" text="مفيش مواعيد أو مهام في اليوم ده." action={<button className="btn-outline" onClick={() => setEditing('new')}><Plus size={16} /> أضف حاجة</button>} />
          ) : (
            <div className="space-y-2.5">
              {dayEvents.map((e) => (
                <EventRow key={e.id} event={e} onToggle={() => events.update(e.id, { done: !e.done })} onEdit={() => setEditing(e)} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {overdue.length > 0 && (
            <div className="card border-rose-200/70 p-5 dark:border-rose-900/50">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-rose-700 dark:text-rose-400"><AlertCircle size={18} /> متأخرة ({overdue.length})</h3>
              <div className="space-y-2">
                {overdue.slice(0, 6).map((e) => (
                  <div key={e.id} className="flex items-center gap-3">
                    <button onClick={() => events.update(e.id, { done: true })} className="h-5 w-5 shrink-0 rounded-md border-2 border-slate-300 hover:border-brand-600 dark:border-slate-600" aria-label="تم" />
                    <button onClick={() => setSelected(e.date)} className="min-w-0 flex-1 text-start">
                      <div className="truncate text-sm text-slate-700 dark:text-slate-200">{e.title}</div>
                      <div className="text-[11px] text-slate-500">{formatShort(fromKey(e.date))}</div>
                    </button>
                    <button onClick={() => events.update(e.id, { date: today })} className="text-[11px] font-medium text-brand-700 hover:underline dark:text-brand-400">للنهارده</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <WeekSummary events={events.rows} week={week} />
        </div>
      </div>

      <EventForm
        key={editing?.id ?? editing}
        open={editing !== null}
        event={editing === 'new' ? null : editing}
        defaultDate={selected}
        onClose={() => setEditing(null)}
        onSave={async (data, repeatWeeks) => {
          if (editing === 'new') {
            for (let i = 0; i <= repeatWeeks; i++) await events.insert({ ...data, date: addDaysKey(data.date, i * 7) })
          } else {
            await events.update(editing.id, data)
          }
          setEditing(null)
        }}
        onDelete={async () => {
          await events.remove(editing.id)
          setEditing(null)
        }}
      />
    </>
  )
}

export function EventRow({ event: e, onToggle, onEdit, compact = false }) {
  const cat = EVENT_CATEGORIES[e.category] ?? EVENT_CATEGORIES.other
  const c = color(cat.color)
  return (
    <div className={`card group flex items-center gap-3 ${compact ? 'p-3' : 'p-4'} ${e.done ? 'opacity-60' : ''}`}>
      <span className={`w-1 self-stretch rounded-full ${c.bar}`} />
      <button
        onClick={onToggle}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition ${e.done ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 hover:border-brand-600 dark:border-slate-600'}`}
        aria-label={e.done ? 'إلغاء الإنجاز' : 'تم'}
      >
        {e.done && <Check size={14} strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <div className={`truncate font-medium text-slate-800 dark:text-slate-100 ${e.done ? 'line-through' : ''}`}>{e.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          {e.start_time && (
            <span className="inline-flex items-center gap-1">
              <Clock size={12} /> {formatTime(e.start_time)}{e.end_time ? ` – ${formatTime(e.end_time)}` : ''}
            </span>
          )}
          <span className={`chip ${c.soft}`}>{cat.name}</span>
          {e.priority !== 'normal' && PRIORITIES[e.priority] && <span className={`chip ${PRIORITIES[e.priority].cls}`}>أولوية {PRIORITIES[e.priority].name}</span>}
        </div>
        {!compact && e.notes && <p className="mt-1.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{e.notes}</p>}
      </div>
      {onEdit && (
        <button onClick={onEdit} className="rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100 focus:opacity-100 dark:hover:bg-slate-800 max-lg:opacity-100" aria-label="تعديل">
          <Pencil size={15} />
        </button>
      )}
    </div>
  )
}

function WeekSummary({ events, week }) {
  const inWeek = events.filter((e) => e.date >= week[0] && e.date <= week[6])
  const done = inWeek.filter((e) => e.done).length
  const byCat = Object.entries(EVENT_CATEGORIES)
    .map(([k, v]) => ({ ...v, key: k, count: inWeek.filter((e) => e.category === k).length }))
    .filter((x) => x.count)
  return (
    <div className="card p-5">
      <h3 className="font-semibold text-slate-900 dark:text-white">ملخص الأسبوع</h3>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-3xl font-bold text-slate-900 dark:text-white">{done}</span>
        <span className="pb-1 text-sm text-slate-500">من {inWeek.length} خلصت</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${inWeek.length ? (done / inWeek.length) * 100 : 0}%` }} />
      </div>
      {byCat.length > 0 && (
        <div className="mt-5 space-y-2">
          {byCat.map((c) => (
            <div key={c.key} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><span className={`h-2.5 w-2.5 rounded-full ${color(c.color).dot}`} />{c.name}</span>
              <span className="font-medium text-slate-900 dark:text-white">{c.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EventForm({ open, event, defaultDate, onClose, onSave, onDelete }) {
  const [f, setF] = useState({
    title: event?.title ?? '',
    date: event?.date ?? defaultDate,
    start_time: event?.start_time?.slice(0, 5) ?? '',
    end_time: event?.end_time?.slice(0, 5) ?? '',
    category: event?.category ?? 'work',
    priority: event?.priority ?? 'normal',
    notes: event?.notes ?? '',
  })
  const [repeat, setRepeat] = useState(0)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!f.title.trim() || !f.date) return
    setBusy(true)
    try {
      await onSave(
        { ...f, title: f.title.trim(), notes: f.notes.trim() || null, start_time: f.start_time || null, end_time: f.end_time || null },
        Number(repeat),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={event ? 'تعديل' : 'موعد أو مهمة جديدة'}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">العنوان</label>
          <input className="input" autoFocus required value={f.title} onChange={set('title')} placeholder="مثلًا: اجتماع الفريق، تسليم التقرير…" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-3 sm:col-span-1">
            <label className="label">التاريخ</label>
            <input type="date" className="input" required value={f.date} onChange={set('date')} />
          </div>
          <div className="col-span-3 grid grid-cols-2 gap-3 sm:col-span-2">
            <div>
              <label className="label">من (اختياري)</label>
              <input type="time" className="input" value={f.start_time} onChange={set('start_time')} />
            </div>
            <div>
              <label className="label">إلى</label>
              <input type="time" className="input" value={f.end_time} onChange={set('end_time')} />
            </div>
          </div>
        </div>
        <div>
          <label className="label">التصنيف</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(EVENT_CATEGORIES).map(([k, v]) => (
              <button type="button" key={k} onClick={() => setF((x) => ({ ...x, category: k }))} className={`chip px-3 py-1.5 text-sm transition ${f.category === k ? color(v.color).fill : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
                {v.name}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">الأولوية</label>
            <select className="input" value={f.priority} onChange={set('priority')}>
              {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
            </select>
          </div>
          {!event && (
            <div>
              <label className="label">تكرار أسبوعي</label>
              <select className="input" value={repeat} onChange={(e) => setRepeat(e.target.value)}>
                <option value={0}>بدون تكرار</option>
                {[3, 7, 11, 25, 51].map((n) => <option key={n} value={n}>لمدة {n + 1} أسبوع</option>)}
              </select>
            </div>
          )}
        </div>
        <div>
          <label className="label">ملاحظات</label>
          <textarea className="input min-h-20" value={f.notes} onChange={set('notes')} placeholder="تفاصيل، رابط الاجتماع، …" />
        </div>
        <div className="flex items-center justify-between gap-3 pt-2">
          {event ? <ConfirmDelete onConfirm={onDelete} /> : <span />}
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn-primary" disabled={busy || !f.title.trim()}>حفظ</button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
