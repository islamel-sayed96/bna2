import { Link } from 'react-router-dom'
import { Check, Flame, ListTodo, Repeat2, Brain, ArrowLeft, Plus, Sparkles } from 'lucide-react'
import { useCollection } from '../lib/useCollection'
import { useAuth } from '../lib/auth'
import { addDaysKey, DAY_SHORT, formatLong, fromKey, greeting, todayKey } from '../lib/dates'
import { currentStreak, isScheduled, logKey } from '../lib/habits'
import { dailyDoneToday, practiceStreak } from '../lib/quiz'
import { color } from '../lib/colors'
import { PageLoader, ProgressRing, StatCard } from '../components/ui'
import { useHabitToggle } from './Habits'
import { EventRow, sortEvents } from './Schedule'

const QUOTES = [
  'النجاح هو مجموع مجهودات صغيرة بتتكرر يوم ورا يوم.',
  'مش لازم تكون عظيم عشان تبدأ، بس لازم تبدأ عشان تبقى عظيم.',
  'أحب الأعمال إلى الله أدومها وإن قل.',
  'انت مش بتطلع لمستوى أهدافك، انت بتنزل لمستوى أنظمتك.',
  '1% أحسن كل يوم = 37 مرة أحسن في سنة.',
  'الانضباط هو إنك تختار بين اللي عايزه دلوقتي واللي عايزه أكتر.',
  'خطوة صغيرة النهارده أحسن من خطة كبيرة بكرة.',
]

export default function Dashboard() {
  const { user } = useAuth()
  const habits = useCollection('habits')
  const logs = useCollection('habit_logs')
  const events = useCollection('events')
  const attempts = useCollection('quiz_attempts')
  const { logSet, toggle } = useHabitToggle(logs)

  if ([habits, logs, events, attempts].some((c) => c.loading)) return <PageLoader />

  const today = todayKey()
  const active = habits.rows.filter((h) => !h.archived)
  const todayHabits = active.filter((h) => isScheduled(h, today))
  const doneHabits = todayHabits.filter((h) => logSet.has(logKey(h.id, today))).length
  const todayEvents = events.rows.filter((e) => e.date === today).sort(sortEvents)
  const pendingEvents = todayEvents.filter((e) => !e.done).length
  const bestStreak = active.reduce((m, h) => Math.max(m, currentStreak(h, logSet, today)), 0)
  const quizStreak = practiceStreak(attempts.rows)
  const daily = dailyDoneToday(attempts.rows)
  const quote = QUOTES[fromKey(today).getDate() % QUOTES.length]
  const name = user?.email?.split('@')[0]

  const last7 = Array.from({ length: 7 }, (_, i) => addDaysKey(today, i - 6)).map((d) => {
    const sch = active.filter((h) => isScheduled(h, d) && (h.created_at ?? '').slice(0, 10) <= d)
    const done = sch.filter((h) => logSet.has(logKey(h.id, d))).length
    return { d, ratio: sch.length ? done / sch.length : 0, done, total: sch.length }
  })

  return (
    <>
      <div className="mb-8">
        <p className="text-sm text-slate-500 dark:text-slate-400">{formatLong(new Date())}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {greeting()}، <span className="text-brand-700 dark:text-brand-400">{name}</span>
        </h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Sparkles size={15} className="text-amber-500" /> {quote}</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card flex items-center gap-4 p-5">
          <ProgressRing value={todayHabits.length ? doneHabits / todayHabits.length : 0} size={60}>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{doneHabits}/{todayHabits.length}</span>
          </ProgressRing>
          <div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">عادات النهارده</div>
            <div className="mt-1 text-xs text-slate-400">{todayHabits.length && doneHabits === todayHabits.length ? 'كلها خلصت 🎉' : `${todayHabits.length - doneHabits} فاضلين`}</div>
          </div>
        </div>
        <StatCard icon={ListTodo} tone="violet" label="مهام فاضلة النهارده" value={pendingEvents} hint={`من ${todayEvents.length}`} />
        <StatCard icon={Flame} tone="amber" label="أطول سلسلة حالية" value={bestStreak} hint="يوم متتالي" />
        <StatCard icon={Brain} tone="rose" label="أيام التدريب" value={quizStreak} hint={daily ? 'خلصت تحدي النهارده ✓' : 'التحدي لسه مستنيك'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Today's habits */}
        <section className="card p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white"><Repeat2 size={18} className="text-brand-600" /> عادات النهارده</h2>
            <Link to="/habits" className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-400">كل العادات</Link>
          </div>
          {todayHabits.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              {active.length ? 'مفيش عادات مجدولة النهارده — استمتع بيومك 🌿' : 'لسه ماضفتش عادات.'}
              {!active.length && <div className="mt-3"><Link to="/habits" className="btn-outline"><Plus size={16} /> أضف عادة</Link></div>}
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {todayHabits.map((h) => {
                const done = logSet.has(logKey(h.id, today))
                const c = color(h.color)
                const streak = currentStreak(h, logSet, today)
                return (
                  <button
                    key={h.id}
                    onClick={() => toggle(h, today)}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-start transition ${done ? 'border-transparent bg-slate-50 dark:bg-slate-800/50' : 'border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700'}`}
                  >
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${c.soft}`}>{h.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm font-medium ${done ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'}`}>{h.name}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-400"><Flame size={12} className={streak ? 'text-orange-500' : ''} /> {streak} يوم</span>
                    </span>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${done ? `${c.fill}` : 'border-2 border-slate-200 dark:border-slate-700'}`} style={done ? { animation: 'pop .25s ease-out' } : undefined}>
                      {done && <Check size={16} strokeWidth={3} />}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {active.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
              <div className="mb-3 text-xs font-medium text-slate-500">آخر 7 أيام</div>
              <div className="flex items-end gap-2">
                {last7.map(({ d, ratio, done, total }) => (
                  <div key={d} className="flex flex-1 flex-col items-center gap-1.5" title={`${done}/${total}`}>
                    <div className="relative flex h-20 w-full items-end overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                      <div className={`w-full rounded-lg ${d === today ? 'bg-brand-500' : 'bg-brand-300 dark:bg-brand-700'}`} style={{ height: `${Math.max(ratio * 100, ratio ? 8 : 0)}%`, transition: 'height .5s' }} />
                    </div>
                    <span className={`text-[10px] ${d === today ? 'font-semibold text-brand-700 dark:text-brand-400' : 'text-slate-400'}`}>{DAY_SHORT[fromKey(d).getDay()]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="space-y-6 lg:col-span-2">
          {/* Agenda */}
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white"><ListTodo size={18} className="text-violet-600" /> جدول النهارده</h2>
              <Link to="/schedule" className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-400">الجدول</Link>
            </div>
            {todayEvents.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">
                مفيش مواعيد النهارده.
                <div className="mt-3"><Link to="/schedule" className="btn-outline"><Plus size={16} /> أضف موعد</Link></div>
              </div>
            ) : (
              <div className="space-y-2">
                {todayEvents.slice(0, 6).map((e) => (
                  <EventRow key={e.id} event={e} compact onToggle={() => events.update(e.id, { done: !e.done })} />
                ))}
                {todayEvents.length > 6 && <Link to="/schedule" className="block pt-1 text-center text-xs text-brand-700 hover:underline">+{todayEvents.length - 6} كمان</Link>}
              </div>
            )}
          </section>

          {/* Quiz CTA */}
          <Link to="/skills/quiz?mode=daily" className="group relative block overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white shadow-card">
            <div className="absolute -end-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-brand-200">🧠 التحدي اليومي</div>
                <div className="mt-1 font-semibold">{daily ? `نتيجتك ${daily.correct}/${daily.total} — تعيده؟` : '10 أسئلة · 5 دقائق'}</div>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition group-hover:-translate-x-1"><ArrowLeft size={18} /></span>
            </div>
          </Link>
        </div>
      </div>
    </>
  )
}
