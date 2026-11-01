import { Link } from 'react-router-dom'
import { Check, ArrowLeft, Plus } from 'lucide-react'
import { useCollection } from '../lib/useCollection'
import { useAuth } from '../lib/auth'
import { addDaysKey, DAY_SHORT, formatLong, formatShort, formatTime, fromKey, greeting, todayKey } from '../lib/dates'
import { currentStreak, isScheduled, logKey } from '../lib/habits'
import { dailyDoneToday, practiceStreak } from '../lib/quiz'
import { color, highlight, RAINBOW } from '../lib/colors'
import { PageLoader, StatCard, Widget } from '../components/ui'
import { useHabitToggle } from './Habits'
import { EVENT_CATEGORIES, sortEvents } from './Schedule'

const QUOTES = [
  'النجاح هو مجموع مجهودات صغيرة بتتكرر يوم ورا يوم.',
  'مش لازم تكون عظيم عشان تبدأ، بس لازم تبدأ عشان تبقى عظيم.',
  'أحب الأعمال إلى الله أدومها وإن قل.',
  'انت مش بتطلع لمستوى أهدافك، انت بتنزل لمستوى أنظمتك.',
  '1% أحسن كل يوم = 37 مرة أحسن في سنة.',
  'الانضباط هو إنك تختار بين اللي عايزه دلوقتي واللي عايزه أكتر.',
  'خطوة صغيرة النهارده أحسن من خطة كبيرة بكرة.',
]

const daysBetween = (a, b) => Math.round((fromKey(b) - fromKey(a)) / 86400000)

// Nearest upcoming occasion / high-priority item, else the nearest future event.
function nextCountdown(events, today) {
  const future = events.filter((e) => e.date > today && !e.done).sort(sortEvents)
  return future.find((e) => e.category === 'occasion' || e.priority === 'high') ?? future[0]
}

function countdownEmoji(e) {
  if (/ميلاد|birthday/i.test(e.title)) return '🎂'
  if (/سفر|رحلة|طيارة/.test(e.title)) return '✈️'
  if (/امتحان|اختبار|exam/i.test(e.title)) return '📝'
  if (/عيد|رمضان/.test(e.title)) return '🌙'
  return { occasion: '🎉', meeting: '🤝', work: '💼', study: '📚', health: '💪', family: '👨‍👩‍👧', personal: '⭐' }[e.category] ?? '📌'
}

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
  const countdown = nextCountdown(events.rows, today)

  const last7 = Array.from({ length: 7 }, (_, i) => addDaysKey(today, i - 6)).map((d) => {
    const sch = active.filter((h) => isScheduled(h, d) && (h.created_at ?? '').slice(0, 10) <= d)
    const done = sch.filter((h) => logSet.has(logKey(h.id, d))).length
    return { d, ratio: sch.length ? done / sch.length : 0, done, total: sch.length }
  })

  return (
    <>
      {/* Notion-style header */}
      <div className="mb-8">
        <div className="mb-2 text-5xl leading-none">{new Date().getHours() < 17 ? '☀️' : '🌙'}</div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink dark:text-white sm:text-4xl">
          {greeting()}، <span style={highlight('#dacffa')}>{name}</span>
        </h1>
        <p className="mt-2 text-sm text-ink-soft dark:text-slate-400">{formatLong(new Date())} · {quote}</p>
      </div>

      <div className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard emoji="✅" tone="brand" label="عادات النهارده" value={`${doneHabits}/${todayHabits.length}`} hint={todayHabits.length && doneHabits === todayHabits.length ? 'كلها خلصت 🎉' : `${todayHabits.length - doneHabits} فاضلين`} />
        <StatCard emoji="📋" tone="violet" label="مهام فاضلة" value={pendingEvents} hint={`من ${todayEvents.length} النهارده`} />
        <StatCard emoji="🔥" tone="amber" label="أطول سلسلة" value={bestStreak} hint="يوم متتالي" />
        <StatCard emoji="🧠" tone="rose" label="أيام التدريب" value={quizStreak} hint={daily ? 'خلصت تحدي النهارده ✓' : 'التحدي مستنيك'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Habits checklist — grid paper widget */}
        <Widget
          className="lg:col-span-7"
          title="عادات النهارده"
          icon="🔁"
          head="#eee8fc"
          grid
          bodyClass="px-4 py-2"
          action={<Link to="/habits" className="rounded-lg p-1 text-ink-soft hover:bg-white/70" title="كل العادات"><Plus size={17} /></Link>}
        >
          {todayHabits.length === 0 ? (
            <div className="py-10 text-center text-sm text-ink-soft">
              {active.length ? 'مفيش عادات مجدولة النهارده — استمتع بيومك 🌿' : 'لسه ماضفتش عادات.'}
              {!active.length && <div className="mt-3"><Link to="/habits" className="btn-outline"><Plus size={16} /> أضف عادة</Link></div>}
            </div>
          ) : (
            <ul>
              {todayHabits.map((h) => {
                const done = logSet.has(logKey(h.id, today))
                const c = color(h.color)
                const streak = currentStreak(h, logSet, today)
                return (
                  <li key={h.id} className="row-line">
                    <button onClick={() => toggle(h, today)} className="flex w-full items-center gap-3 py-3 text-start">
                      <span
                        className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border-2 transition ${done ? 'border-ink bg-ink text-white dark:border-brand-400 dark:bg-brand-400' : 'border-ink/40 bg-white dark:border-white/30 dark:bg-transparent'}`}
                        style={done ? { animation: 'pop .25s ease-out' } : undefined}
                      >
                        {done && <Check size={14} strokeWidth={3.5} />}
                      </span>
                      <span className="text-lg">{h.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className={`text-[15px] font-semibold ${done ? 'text-ink/40 line-through dark:text-white/40' : 'text-ink dark:text-white'}`} style={done ? undefined : highlight(c.hl)}>
                          {h.name}
                        </span>
                      </span>
                      <span className="text-xs font-medium text-ink-soft">🔥 {streak}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Widget>

        {/* Today's agenda — sticky note */}
        <div className="lg:col-span-5">
          <div className="sticky-note rotate-[1.2deg] px-5 pb-4 pt-6 transition hover:rotate-0">
            <span className="tape" />
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-bold">📌 جدول النهارده</h2>
              <Link to="/schedule" className="rounded-lg p-1 hover:bg-black/5" title="الجدول"><Plus size={17} /></Link>
            </div>
            {todayEvents.length === 0 ? (
              <p className="py-8 text-center text-sm opacity-80">مفيش مواعيد النهارده ✨<br /><Link to="/schedule" className="mt-2 inline-block font-semibold underline underline-offset-4">أضف موعد</Link></p>
            ) : (
              <ul>
                {todayEvents.slice(0, 7).map((e) => (
                  <li key={e.id} className="flex items-center gap-3 border-b border-dashed border-[#d9c66a]/70 py-2.5 last:border-0 dark:border-white/15">
                    <button
                      onClick={() => events.update(e.id, { done: !e.done })}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-current transition ${e.done ? 'bg-[#5b4a12] text-note dark:bg-note dark:text-[#3d3618]' : 'opacity-60'}`}
                      aria-label="تم"
                    >
                      {e.done && <Check size={12} strokeWidth={3.5} />}
                    </button>
                    <span className={`min-w-0 flex-1 truncate text-sm font-medium ${e.done ? 'line-through opacity-50' : ''}`}>{e.title}</span>
                    {e.start_time && <span className="text-xs tabular-nums opacity-70">{formatTime(e.start_time)}</span>}
                  </li>
                ))}
              </ul>
            )}
            {todayEvents.length > 7 && <Link to="/schedule" className="mt-1 block text-center text-xs font-semibold underline">+{todayEvents.length - 7} كمان</Link>}
          </div>
        </div>

        {/* Countdown widget */}
        <div className="widget flex items-center gap-4 p-5 lg:col-span-5">
          {countdown ? (
            <>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl" style={{ background: color(EVENT_CATEGORIES[countdown.category]?.color).row }}>{countdownEmoji(countdown)}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-xl font-bold text-ink dark:text-white">{countdown.title}</div>
                <div className="mt-0.5 text-sm text-ink-soft">{formatShort(fromKey(countdown.date))}</div>
              </div>
              <div className="text-center">
                <div dir="ltr" className="font-display text-4xl font-extrabold leading-none text-ink dark:text-white">-{daysBetween(today, countdown.date)}</div>
                <div className="mt-1 text-xs font-semibold text-ink-soft">يوم</div>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#ffeadc] text-4xl">🎉</div>
              <div className="flex-1">
                <div className="font-display text-lg font-bold text-ink dark:text-white">عدّاد المناسبات</div>
                <div className="mt-0.5 text-sm text-ink-soft">أضف مناسبة أو موعد مهم وهيظهر هنا العد التنازلي.</div>
              </div>
              <Link to="/schedule" className="btn-outline px-3"><Plus size={16} /></Link>
            </>
          )}
        </div>

        {/* Last 7 days — pastel bars */}
        <Widget className="lg:col-span-4" title="آخر 7 أيام" icon="📊" head="#e0f1fc" bodyClass="px-4 pb-4 pt-3">
          <div className="flex items-end gap-1.5">
            {last7.map(({ d, ratio, done, total }, i) => (
              <div key={d} className="flex flex-1 flex-col items-center gap-1.5" title={`${done}/${total}`}>
                <div className="relative flex h-20 w-full items-end overflow-hidden rounded-lg bg-[#f3f0fb] dark:bg-white/5">
                  <div className="w-full rounded-lg" style={{ height: `${Math.max(ratio * 100, ratio ? 10 : 0)}%`, background: color(RAINBOW[i % RAINBOW.length]).hl, transition: 'height .5s' }} />
                </div>
                <span className={`text-[10px] ${d === today ? 'font-bold text-ink dark:text-white' : 'text-ink-soft'}`}>{DAY_SHORT[fromKey(d).getDay()]}</span>
              </div>
            ))}
          </div>
        </Widget>

        {/* Daily challenge — dashed frame */}
        <Link to="/skills/quiz?mode=daily" className="dash-frame group relative block overflow-hidden rounded-[22px] bg-gradient-to-br from-[#8f7ae6] to-[#6a4fcc] p-6 text-white shadow-card lg:col-span-3">
          <span className="sticker -top-1 end-3 text-4xl" style={{ animation: 'wiggle 4s ease-in-out infinite' }}>☀️</span>
          <div className="relative">
            <div className="text-xs font-semibold text-white/80">🧠 التحدي اليومي</div>
            <div className="mt-2 font-display text-xl font-bold leading-snug">{daily ? `${daily.correct}/${daily.total} — تعيده؟` : '10 أسئلة · 5 دقائق'}</div>
            <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold transition group-hover:bg-white/30">
              {daily ? 'جولة تانية' : 'ابدأ'} <ArrowLeft size={14} />
            </span>
          </div>
        </Link>
      </div>
    </>
  )
}
