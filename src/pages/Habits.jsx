import { useMemo, useState } from 'react'
import { Plus, Flame, Pencil, Check, Trophy } from 'lucide-react'
import { useCollection } from '../lib/useCollection'
import { addDaysKey, DAY_SHORT, fromKey, todayKey, WEEK_ORDER, formatShort } from '../lib/dates'
import { buildLogSet, completionRate, currentStreak, bestStreak, HABIT_ICONS, isScheduled, logKey } from '../lib/habits'
import { color, HABIT_COLORS } from '../lib/colors'
import { ConfirmDelete, EmptyState, Modal, PageHeader, PageLoader } from '../components/ui'

export function useHabitToggle(logs) {
  const logSet = useMemo(() => buildLogSet(logs.rows), [logs.rows])
  const toggle = async (habit, date) => {
    const existing = logs.rows.find((l) => l.habit_id === habit.id && l.date === date)
    if (existing) await logs.remove(existing.id)
    else await logs.insert({ habit_id: habit.id, date })
  }
  return { logSet, toggle }
}

export default function Habits() {
  const habits = useCollection('habits')
  const logs = useCollection('habit_logs')
  const { logSet, toggle } = useHabitToggle(logs)
  const [editing, setEditing] = useState(null) // null | 'new' | habit
  const today = todayKey()
  const days = Array.from({ length: 7 }, (_, i) => addDaysKey(today, i - 6))

  const active = habits.rows.filter((h) => !h.archived)

  if (habits.loading || logs.loading) return <PageLoader />

  return (
    <>
      <PageHeader
        icon="🔁"
        title="العادات"
        subtitle="ابني عاداتك يوم بيوم — المهم الاستمرار مش الكمال."
        action={
          <button className="btn-primary" onClick={() => setEditing('new')}>
            <Plus size={18} /> عادة جديدة
          </button>
        }
      />

      {active.length === 0 ? (
        <EmptyState
          icon="🌱"
          title="لسه مفيش عادات"
          text="ابدأ بعادة واحدة صغيرة وسهلة — زي شرب مية، قراءة 10 صفحات، أو مشي ربع ساعة."
          action={<button className="btn-primary" onClick={() => setEditing('new')}><Plus size={18} /> أضف أول عادة</button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {active.map((h) => {
            const c = color(h.color)
            const streak = currentStreak(h, logSet, today)
            const best = bestStreak(h, logSet, today)
            const rate = completionRate(h, logSet, 30, today)
            return (
              <div key={h.id} className="widget overflow-hidden">
                <div className="flex items-start gap-3 px-5 pb-4 pt-5" style={{ background: c.row }}>
                  <div className="flex h-12 w-12 shrink-0 rotate-[-4deg] items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">{h.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-lg font-bold text-ink">{h.name}</h3>
                      <button onClick={() => setEditing(h)} className="rounded-md p-1 text-ink-soft hover:bg-white/70" aria-label="تعديل">
                        <Pencil size={14} />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {h.days?.length === 7 ? 'كل يوم' : WEEK_ORDER.filter((d) => h.days?.includes(d)).map((d) => DAY_SHORT[d]).join('، ')}
                      {h.note ? ` · ${h.note}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-display text-base font-bold text-orange-500 shadow-sm" title="السلسلة الحالية">
                    <Flame size={15} /> {streak}
                  </div>
                </div>

                <div className="paper-grid px-5 pb-5">
                <div className="grid grid-cols-7 gap-1.5 pt-4">
                  {days.map((d) => {
                    const scheduled = isScheduled(h, d)
                    const done = logSet.has(logKey(h.id, d))
                    const isToday = d === today
                    return (
                      <button
                        key={d}
                        onClick={() => toggle(h, d)}
                        className="group flex flex-col items-center gap-1.5"
                        title={formatShort(fromKey(d))}
                      >
                        <span className={`text-[10px] font-medium ${isToday ? 'font-bold text-ink dark:text-white' : 'text-ink-soft'}`}>
                          {isToday ? 'النهارده' : DAY_SHORT[fromKey(d).getDay()]}
                        </span>
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                            done
                              ? `${c.fill} shadow-sm`
                              : scheduled
                                ? `border-2 border-dashed border-ink/20 bg-white group-hover:border-ink/40 dark:border-white/20 dark:bg-transparent ${isToday ? `ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#1f1c38] ${c.ring}` : ''}`
                                : 'bg-[#f3f0fb] dark:bg-white/5'
                          }`}
                          style={done ? { animation: 'pop .25s ease-out' } : undefined}
                        >
                          {done && <Check size={17} strokeWidth={3} />}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-5 flex items-center gap-4 border-t border-dashed border-[#e3ddf5] pt-4 text-xs text-ink-soft dark:border-white/10">
                  <div className="flex-1">
                    <div className="mb-1.5 flex justify-between">
                      <span>الالتزام آخر 30 يوم</span>
                      <span className="font-bold text-ink dark:text-white">{Math.round(rate * 100)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#f3f0fb] dark:bg-white/5">
                      <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${rate * 100}%`, transition: 'width .5s' }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1" title="أطول سلسلة">
                    <Trophy size={14} className="text-amber-500" /> {best}
                  </div>
                </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {active.length > 0 && <HabitHeatmap habits={active} logSet={logSet} />}

      <HabitForm
        key={editing?.id ?? editing}
        open={editing !== null}
        habit={editing === 'new' ? null : editing}
        defaultColor={HABIT_COLORS[habits.rows.length % HABIT_COLORS.length]}
        onClose={() => setEditing(null)}
        onSave={async (data) => {
          if (editing === 'new') await habits.insert(data)
          else await habits.update(editing.id, data)
          setEditing(null)
        }}
        onDelete={async () => {
          await habits.remove(editing.id)
          logs.reload()
          setEditing(null)
        }}
      />
    </>
  )
}

// 12-week overview: how many scheduled habits were done each day.
function HabitHeatmap({ habits, logSet }) {
  const today = todayKey()
  const weeks = 15
  // Align the grid so each column is a Saturday→Friday week.
  const end = fromKey(today)
  const lastCol = addDaysKey(today, (5 - end.getDay() + 7) % 7)
  const first = addDaysKey(lastCol, -(weeks * 7 - 1))
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDaysKey(first, i))

  const levels = ['bg-[#f0edf9] dark:bg-white/5', 'bg-brand-200 dark:bg-brand-900', 'bg-brand-300 dark:bg-brand-700', 'bg-brand-400 dark:bg-brand-500', 'bg-brand-600 dark:bg-brand-300']

  return (
    <div className="widget mt-6 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-ink dark:text-white">🗺️ خريطة الالتزام</h3>
        <span className="text-xs text-slate-500">آخر {weeks} أسبوع</span>
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="grid w-max grid-flow-col grid-rows-7 gap-1">
          {cells.map((d) => {
            if (d > today) return <div key={d} className="h-3.5 w-3.5" />
            const scheduled = habits.filter((h) => isScheduled(h, d) && (h.created_at ?? '').slice(0, 10) <= d)
            const done = scheduled.filter((h) => logSet.has(logKey(h.id, d))).length
            const ratio = scheduled.length ? done / scheduled.length : 0
            const lvl = done === 0 ? 0 : Math.min(4, Math.ceil(ratio * 4))
            return <div key={d} title={`${formatShort(fromKey(d))}: ${done}/${scheduled.length}`} className={`h-3.5 w-3.5 rounded-[4px] ${levels[lvl]}`} />
          })}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-slate-500">
        أقل {levels.map((l) => <span key={l} className={`h-3 w-3 rounded-[3px] ${l}`} />)} أكثر
      </div>
    </div>
  )
}

function HabitForm({ open, habit, defaultColor = 'violet', onClose, onSave, onDelete }) {
  const [name, setName] = useState(habit?.name ?? '')
  const [icon, setIcon] = useState(habit?.icon ?? '💧')
  const [col, setCol] = useState(habit?.color ?? defaultColor)
  const [days, setDays] = useState(habit?.days ?? [0, 1, 2, 3, 4, 5, 6])
  const [note, setNote] = useState(habit?.note ?? '')
  const [busy, setBusy] = useState(false)

  const toggleDay = (d) => setDays((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d].sort()))

  async function submit(e) {
    e.preventDefault()
    if (!name.trim() || days.length === 0) return
    setBusy(true)
    try {
      await onSave({ name: name.trim(), icon, color: col, days, note: note.trim() || null })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={habit ? 'تعديل العادة' : 'عادة جديدة'}>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="label">اسم العادة</label>
          <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلًا: قراءة 10 صفحات" required />
        </div>
        <div>
          <label className="label">ملاحظة (اختياري)</label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثلًا: بعد صلاة الفجر" />
        </div>
        <div>
          <label className="label">الأيقونة</label>
          <div className="grid grid-cols-8 gap-1.5">
            {HABIT_ICONS.map((i) => (
              <button type="button" key={i} onClick={() => setIcon(i)} className={`flex h-10 items-center justify-center rounded-xl text-xl transition ${icon === i ? 'bg-brand-50 ring-2 ring-brand-400 dark:bg-brand-500/10' : 'hover:bg-brand-50 dark:hover:bg-white/5'}`}>
                {i}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">اللون</label>
          <div className="flex gap-2.5">
            {HABIT_COLORS.map((c) => (
              <button type="button" key={c} onClick={() => setCol(c)} className={`h-8 w-8 rounded-full ${color(c).dot} transition ${col === c ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900' : 'opacity-70 hover:opacity-100'}`} aria-label={c} />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="label mb-0">الأيام</label>
            <div className="flex gap-2 text-xs">
              <button type="button" className="text-brand-600 hover:underline dark:text-brand-300" onClick={() => setDays([0, 1, 2, 3, 4, 5, 6])}>كل يوم</button>
              <button type="button" className="text-brand-600 hover:underline dark:text-brand-300" onClick={() => setDays([0, 1, 2, 3, 4])}>أيام الشغل</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {WEEK_ORDER.map((d) => (
              <button type="button" key={d} onClick={() => toggleDay(d)} className={`rounded-xl py-2 text-xs font-medium transition ${days.includes(d) ? 'bg-ink text-white dark:bg-brand-600' : 'bg-[#f3f0fb] text-ink-soft hover:bg-brand-100 dark:bg-white/5 dark:text-slate-300'}`}>
                {DAY_SHORT[d]}
              </button>
            ))}
          </div>
          {days.length === 0 && <p className="mt-1.5 text-xs text-rose-600">اختار يوم واحد على الأقل</p>}
        </div>
        <div className="flex items-center justify-between gap-3 pt-2">
          {habit ? <ConfirmDelete onConfirm={onDelete} /> : <span />}
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn-primary" disabled={busy || !name.trim() || days.length === 0}>حفظ</button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
