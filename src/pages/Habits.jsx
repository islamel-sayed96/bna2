import { useMemo, useState } from 'react'
import { Plus, Flame, Pencil, Check, X, Trophy, ChevronLeft, ChevronRight, Package } from 'lucide-react'
import { useCollection } from '../lib/useCollection'
import { addDays, addDaysKey, DAY_SHORT, fromKey, toKey, todayKey, WEEK_ORDER, formatShort, startOfWeek } from '../lib/dates'
import {
  buildLogSet, completionRate, currentStreak, bestStreak, dayScore, groupBySection, HABIT_ICONS, isActiveOn, isDone, isLogged, isScheduled, KINDS, kindOf, scoreColor,
} from '../lib/habits'
import { HABIT_PACKS } from '../data/habitPacks'
import { color, HABIT_COLORS } from '../lib/colors'
import { ConfirmDelete, EmptyState, Modal, PageHeader, PageLoader, Spinner } from '../components/ui'

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
  const [packs, setPacks] = useState(false)
  const [tab, setTab] = useState('week')

  const active = habits.rows.filter((h) => !h.archived)
  const sections = [...new Set(active.map((h) => h.section).filter(Boolean))]

  if (habits.loading || logs.loading) return <PageLoader />

  return (
    <>
      <PageHeader
        icon="🔁"
        title="العادات"
        subtitle="✅ أساسية بتحسب في نسبتك · ⭐ إضافي بيعلّيها · ✕ عادة بتتجنبها."
        action={
          <div className="flex flex-wrap gap-2">
            <button className="btn-outline" onClick={() => setPacks(true)}><Package size={17} /> حزم عادات</button>
            <button className="btn-primary" onClick={() => setEditing('new')}><Plus size={18} /> عادة جديدة</button>
          </div>
        }
      />

      {active.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
          <EmptyState icon="🌱" title="لسه مفيش عادات" text="ابدأ بحزمة جاهزة أو أضف عادة بنفسك." action={<button className="btn-primary" onClick={() => setEditing('new')}><Plus size={18} /> أضف عادة</button>} />
          <div className="widget p-5">
            <h3 className="mb-3 text-lg font-bold text-ink dark:text-white">📦 ابدأ بحزمة</h3>
            <PackList habits={habits} />
          </div>
        </div>
      ) : (
        <>
          <div className="mb-5 inline-flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-[#e8e3f8] dark:bg-white/5 dark:ring-white/10">
            {[['week', '📅 الأسبوع'], ['stats', '📊 الإحصائيات']].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === k ? 'bg-ink text-white dark:bg-brand-600' : 'text-ink-soft hover:text-ink'}`}>{l}</button>
            ))}
          </div>
          {tab === 'week' ? (
            <WeekTable habits={active} logSet={logSet} toggle={toggle} onEdit={setEditing} />
          ) : (
            <StatsCards habits={active} logSet={logSet} toggle={toggle} onEdit={setEditing} />
          )}
        </>
      )}

      <HabitForm
        key={editing?.id ?? editing}
        open={editing !== null}
        habit={editing === 'new' ? null : editing}
        sections={sections}
        defaultColor={HABIT_COLORS[habits.rows.length % HABIT_COLORS.length]}
        onClose={() => setEditing(null)}
        onSave={async (data) => {
          if (editing === 'new') await habits.insert({ ...data, sort: habits.rows.length })
          else await habits.update(editing.id, data)
          setEditing(null)
        }}
        onDelete={async () => {
          await habits.remove(editing.id)
          logs.reload()
          setEditing(null)
        }}
      />
      <Modal open={packs} onClose={() => setPacks(false)} title="📦 حزم عادات جاهزة">
        <PackList habits={habits} />
        <p className="mt-4 text-xs text-ink-soft">تقدر تعدّل أي عادة بعد إضافتها (الاسم، الأيام، النوع) أو تحذفها.</p>
      </Modal>
    </>
  )
}

function PackList({ habits }) {
  const [busy, setBusy] = useState(null)
  const names = new Set(habits.rows.map((h) => h.name))
  async function add(pack) {
    setBusy(pack.id)
    try {
      let sort = habits.rows.length
      for (const h of pack.habits) if (!names.has(h.name)) await habits.insert({ ...h, section: pack.section, sort: sort++ })
    } finally {
      setBusy(null)
    }
  }
  return (
    <div className="space-y-2.5">
      {HABIT_PACKS.map((p) => {
        const missing = p.habits.filter((h) => !names.has(h.name)).length
        return (
          <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-[#f3f0fb] p-3 dark:bg-white/5">
            <span className="text-2xl">{p.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-ink dark:text-white">{p.name}</div>
              <div className="truncate text-xs text-ink-soft">{p.habits.map((h) => h.name).join(' · ')}</div>
            </div>
            {missing ? (
              <button className="btn-primary px-3 py-2" disabled={!!busy} onClick={() => add(p)}>{busy === p.id ? <Spinner /> : <Plus size={16} />} إضافة</button>
            ) : (
              <span className="chip bg-emerald-100 text-emerald-700">✓ مضافة</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ───────────── Weekly tracker table ───────────── */

function WeekTable({ habits, logSet, toggle, onEdit }) {
  const today = todayKey()
  const [ref, setRef] = useState(today)
  const start = startOfWeek(fromKey(ref))
  const week = Array.from({ length: 7 }, (_, i) => toKey(addDays(start, i)))
  const groups = groupBySection(habits)
  const isThisWeek = week.includes(today)

  return (
    <div className="widget overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-dashed border-[#e3ddf5] px-4 py-3 dark:border-white/10">
        <div className="flex items-center gap-1">
          <button className="btn-ghost p-2" onClick={() => setRef(addDaysKey(ref, -7))} aria-label="الأسبوع السابق"><ChevronRight size={18} /></button>
          <button className="btn-ghost p-2" onClick={() => setRef(addDaysKey(ref, 7))} aria-label="الأسبوع التالي" disabled={isThisWeek}><ChevronLeft size={18} /></button>
          <span className="ms-1 font-display text-lg font-bold text-ink dark:text-white">{isThisWeek ? 'الأسبوع ده' : `${formatShort(fromKey(week[0]))} – ${formatShort(fromKey(week[6]))}`}</span>
        </div>
        {!isThisWeek && <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => setRef(today)}>الأسبوع ده</button>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="text-[11px] text-ink-soft">
              <th className="w-[38%] px-4 py-2 text-start font-semibold">العادة</th>
              {week.map((d) => (
                <th key={d} className={`px-1 py-2 text-center font-semibold ${d === today ? 'text-ink dark:text-white' : ''}`}>
                  <div>{DAY_SHORT[fromKey(d).getDay()]}</div>
                  <div className={`mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs ${d === today ? 'bg-ink text-white dark:bg-brand-500' : ''}`}>{fromKey(d).getDate()}</div>
                </th>
              ))}
              <th className="px-2 py-2 text-center font-semibold">🔥</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <GroupRows key={g.name} group={g} week={week} today={today} logSet={logSet} toggle={toggle} onEdit={onEdit} />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-dashed border-[#e3ddf5] bg-[#faf8ff] dark:border-white/10 dark:bg-white/5">
              <td className="px-4 py-3 text-xs font-bold text-ink dark:text-white">تقييم اليوم</td>
              {week.map((d) => {
                const s = dayScore(habits, logSet, d)
                const show = d <= today && s.rate != null
                return (
                  <td key={d} className={`px-1 py-3 text-center font-display text-sm font-extrabold ${show ? scoreColor(s.rate) : 'text-ink-soft/40'}`}>
                    {show ? `${Math.round(s.rate * 100)}%` : '—'}
                    {show && s.rate > 1 && <div className="text-[10px]">⭐</div>}
                  </td>
                )
              })}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function GroupRows({ group, week, today, logSet, toggle, onEdit }) {
  return (
    <>
      <tr>
        <td colSpan={9} className="bg-[#f6f3fd] px-4 py-1.5 text-xs font-bold text-ink-soft dark:bg-white/5">{group.name}</td>
      </tr>
      {group.habits.map((h) => {
        const k = kindOf(h)
        const c = color(h.color)
        return (
          <tr key={h.id} className="row-line group/row">
            <td className="px-4 py-2">
              <button onClick={() => onEdit(h)} className="flex max-w-full items-center gap-2 text-start" title="تعديل">
                <span className="text-lg">{h.icon}</span>
                <span className="truncate font-semibold text-ink dark:text-white">{h.name}</span>
                {k !== 'build' && <span className={`chip shrink-0 ${k === 'bonus' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-600'}`}>{KINDS[k].icon}</span>}
              </button>
            </td>
            {week.map((d) => {
              const future = d > today
              const scheduled = isActiveOn(h, d) || (isScheduled(h, d) && isLogged(h, logSet, d))
              if (!scheduled) return <td key={d} className="text-center text-ink-soft/30">·</td>
              const logged = isLogged(h, logSet, d)
              let cls = 'border-2 border-dashed border-ink/20 bg-white hover:border-ink/40 dark:border-white/20 dark:bg-transparent'
              let content = null
              if (k === 'avoid' && logged) {
                cls = 'bg-rose-500 text-white'
                content = <X size={16} strokeWidth={3} />
              } else if (k === 'avoid' && !future) {
                cls = 'bg-emerald-50 text-emerald-500 hover:bg-rose-50 dark:bg-emerald-500/10'
                content = <Check size={14} strokeWidth={3} />
              } else if (logged) {
                cls = k === 'bonus' ? 'bg-amber-400 text-white' : c.fill
                content = k === 'bonus' ? '⭐' : <Check size={16} strokeWidth={3} />
              }
              return (
                <td key={d} className="px-1 py-2 text-center">
                  <button
                    disabled={future}
                    onClick={() => toggle(h, d)}
                    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-sm transition disabled:opacity-30 ${cls} ${d === today && !logged && k !== 'avoid' ? `ring-2 ring-offset-1 ${c.ring}` : ''}`}
                    style={logged ? { animation: 'pop .25s ease-out' } : undefined}
                    title={k === 'avoid' ? (logged ? 'وقعت فيها — اضغط للإلغاء' : 'نضيف — اضغط لو وقعت فيها') : formatShort(fromKey(d))}
                  >
                    {content}
                  </button>
                </td>
              )
            })}
            <td className="px-2 text-center font-display text-sm font-bold text-orange-500">{currentStreak(h, logSet, today)}</td>
          </tr>
        )
      })}
    </>
  )
}

/* ───────────── Stats cards + heatmap ───────────── */

function StatsCards({ habits, logSet, toggle, onEdit }) {
  const today = todayKey()
  const days = Array.from({ length: 7 }, (_, i) => addDaysKey(today, i - 6))
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {habits.map((h) => {
          const c = color(h.color)
          const k = kindOf(h)
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
                    <button onClick={() => onEdit(h)} className="rounded-md p-1 text-ink-soft hover:bg-white/70" aria-label="تعديل"><Pencil size={14} /></button>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {KINDS[k].icon} {KINDS[k].short} · {h.days?.length === 7 ? 'كل يوم' : WEEK_ORDER.filter((d) => h.days?.includes(d)).map((d) => DAY_SHORT[d]).join('، ')}
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-display text-base font-bold text-orange-500 shadow-sm" title="السلسلة الحالية"><Flame size={15} /> {streak}</div>
              </div>
              <div className="paper-grid px-5 pb-5">
                <div className="grid grid-cols-7 gap-1.5 pt-4">
                  {days.map((d) => {
                    const scheduled = isScheduled(h, d)
                    const logged = isLogged(h, logSet, d)
                    const ok = isDone(h, logSet, d)
                    return (
                      <button key={d} onClick={() => toggle(h, d)} className="flex flex-col items-center gap-1.5" title={formatShort(fromKey(d))}>
                        <span className={`text-[10px] ${d === today ? 'font-bold text-ink dark:text-white' : 'text-ink-soft'}`}>{d === today ? 'النهارده' : DAY_SHORT[fromKey(d).getDay()]}</span>
                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                          !scheduled ? 'bg-[#f3f0fb] dark:bg-white/5' : k === 'avoid' ? (logged ? 'bg-rose-500 text-white' : 'bg-emerald-50 text-emerald-500') : ok ? (k === 'bonus' ? 'bg-amber-400 text-white' : c.fill) : 'border-2 border-dashed border-ink/20 bg-white dark:bg-transparent'
                        }`}>
                          {scheduled && (k === 'avoid' ? (logged ? <X size={16} strokeWidth={3} /> : <Check size={14} />) : ok && (k === 'bonus' ? '⭐' : <Check size={17} strokeWidth={3} />))}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className="mt-5 flex items-center gap-4 border-t border-dashed border-[#e3ddf5] pt-4 text-xs text-ink-soft dark:border-white/10">
                  <div className="flex-1">
                    <div className="mb-1.5 flex justify-between"><span>{k === 'avoid' ? 'أيام نضيفة آخر 30 يوم' : 'الالتزام آخر 30 يوم'}</span><span className="font-bold text-ink dark:text-white">{Math.round(rate * 100)}%</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#f3f0fb] dark:bg-white/5"><div className={`h-full rounded-full ${c.bar}`} style={{ width: `${rate * 100}%` }} /></div>
                  </div>
                  <div className="flex items-center gap-1" title="أطول سلسلة"><Trophy size={14} className="text-amber-500" /> {best}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <HabitHeatmap habits={habits} logSet={logSet} />
    </>
  )
}

function HabitHeatmap({ habits, logSet }) {
  const today = todayKey()
  const weeks = 15
  const end = fromKey(today)
  const lastCol = addDaysKey(today, (5 - end.getDay() + 7) % 7)
  const first = addDaysKey(lastCol, -(weeks * 7 - 1))
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDaysKey(first, i))
  const levels = ['bg-[#f0edf9] dark:bg-white/5', 'bg-brand-200 dark:bg-brand-900', 'bg-brand-300 dark:bg-brand-700', 'bg-brand-400 dark:bg-brand-500', 'bg-brand-600 dark:bg-brand-300']

  return (
    <div className="widget mt-6 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-ink dark:text-white">🗺️ خريطة الالتزام</h3>
        <span className="text-xs text-ink-soft">آخر {weeks} أسبوع</span>
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="grid w-max grid-flow-col grid-rows-7 gap-1">
          {cells.map((d) => {
            if (d > today) return <div key={d} className="h-3.5 w-3.5" />
            const s = dayScore(habits, logSet, d)
            const lvl = !s.rate ? 0 : Math.min(4, Math.ceil(s.rate * 4))
            return <div key={d} title={`${formatShort(fromKey(d))}: ${s.rate == null ? '—' : Math.round(s.rate * 100) + '%'}`} className={`h-3.5 w-3.5 rounded-[4px] ${levels[lvl]}`} />
          })}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-ink-soft">أقل {levels.map((l) => <span key={l} className={`h-3 w-3 rounded-[3px] ${l}`} />)} أكثر</div>
    </div>
  )
}

/* ───────────── Form ───────────── */

function HabitForm({ open, habit, sections, defaultColor = 'violet', onClose, onSave, onDelete }) {
  const [name, setName] = useState(habit?.name ?? '')
  const [icon, setIcon] = useState(habit?.icon ?? '💧')
  const [col, setCol] = useState(habit?.color ?? defaultColor)
  const [days, setDays] = useState(habit?.days ?? [0, 1, 2, 3, 4, 5, 6])
  const [note, setNote] = useState(habit?.note ?? '')
  const [kind, setKind] = useState(habit ? kindOf(habit) : 'build')
  const [section, setSection] = useState(habit?.section ?? '')
  const [busy, setBusy] = useState(false)

  const toggleDay = (d) => setDays((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d].sort()))

  async function submit(e) {
    e.preventDefault()
    if (!name.trim() || days.length === 0) return
    setBusy(true)
    try {
      await onSave({ name: name.trim(), icon, color: col, days, note: note.trim() || null, kind, section: section.trim() || null })
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
          <label className="label">النوع</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(KINDS).map(([k, v]) => (
              <button type="button" key={k} onClick={() => setKind(k)} className={`rounded-2xl p-2.5 text-center transition ${kind === k ? 'bg-ink text-white dark:bg-brand-600' : 'bg-[#f3f0fb] text-ink hover:bg-brand-100 dark:bg-white/5 dark:text-slate-200'}`}>
                <div className="text-lg">{v.icon}</div>
                <div className="text-xs font-bold">{v.name}</div>
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-ink-soft">{KINDS[kind].desc}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">القسم (اختياري)</label>
            <input className="input" list="habit-sections" value={section} onChange={(e) => setSection(e.target.value)} placeholder="مثلًا: 🕌 الصلاة" />
            <datalist id="habit-sections">{sections.map((s) => <option key={s} value={s} />)}</datalist>
          </div>
          <div>
            <label className="label">ملاحظة (اختياري)</label>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثلًا: بعد الفجر" />
          </div>
        </div>
        <div>
          <label className="label">الأيقونة</label>
          <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-10">
            {HABIT_ICONS.map((i) => (
              <button type="button" key={i} onClick={() => setIcon(i)} className={`flex h-10 items-center justify-center rounded-xl text-xl transition ${icon === i ? 'bg-brand-50 ring-2 ring-brand-400 dark:bg-brand-500/10' : 'hover:bg-brand-50 dark:hover:bg-white/5'}`}>{i}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">اللون</label>
          <div className="flex gap-2.5">
            {HABIT_COLORS.map((c) => (
              <button type="button" key={c} onClick={() => setCol(c)} className={`h-8 w-8 rounded-full ${color(c).dot} transition ${col === c ? 'ring-2 ring-slate-400 ring-offset-2 dark:ring-offset-slate-900' : 'opacity-70 hover:opacity-100'}`} aria-label={c} />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="label mb-0">الأيام</label>
            <div className="flex gap-2 text-xs">
              <button type="button" className="text-brand-600 hover:underline" onClick={() => setDays([0, 1, 2, 3, 4, 5, 6])}>كل يوم</button>
              <button type="button" className="text-brand-600 hover:underline" onClick={() => setDays([0, 1, 2, 3, 4])}>أيام الشغل</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {WEEK_ORDER.map((d) => (
              <button type="button" key={d} onClick={() => toggleDay(d)} className={`rounded-xl py-2 text-xs font-medium transition ${days.includes(d) ? 'bg-ink text-white dark:bg-brand-600' : 'bg-[#f3f0fb] text-ink-soft hover:bg-brand-100 dark:bg-white/5 dark:text-slate-300'}`}>{DAY_SHORT[d]}</button>
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
