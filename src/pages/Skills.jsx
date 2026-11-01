import { Link } from 'react-router-dom'
import { Shuffle, ListPlus, ArrowLeft, Sparkles } from 'lucide-react'
import { useCollection } from '../lib/useCollection'
import { CATEGORIES } from '../data/questions'
import { allQuestions, categoryById, categoryStats, dailyDoneToday, MODE_LABELS, mistakeQuestions, practiceStreak } from '../lib/quiz'
import { color } from '../lib/colors'
import { formatDateTime } from '../lib/dates'
import { PageHeader, PageLoader, ProgressRing, StatCard } from '../components/ui'

export default function Skills() {
  const custom = useCollection('questions')
  const attempts = useCollection('quiz_attempts')

  if (custom.loading || attempts.loading) return <PageLoader />

  const all = allQuestions(custom.rows)
  const stats = categoryStats(attempts.rows, all)
  const daily = dailyDoneToday(attempts.rows)
  const streak = practiceStreak(attempts.rows)
  const mistakes = mistakeQuestions(all, attempts.rows)
  const totalAnswered = Object.values(stats).reduce((s, x) => s + x.answered, 0)
  const totalCorrect = Object.values(stats).reduce((s, x) => s + x.correct, 0)
  const recent = [...attempts.rows].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6)

  return (
    <>
      <PageHeader
        icon="🧠"
        title="تطوير المهارات"
        subtitle="اختبر نفسك كل يوم — 10 أسئلة متنوعة بتاخد 5 دقائق."
        action={<Link to="/skills/questions" className="btn-outline"><ListPlus size={18} /> أسئلتي ({custom.rows.length})</Link>}
      />

      {/* Daily challenge hero */}
      <div className="dash-frame relative mb-8 overflow-hidden rounded-[26px] bg-gradient-to-br from-[#9a86ec] via-[#7a64db] to-[#5a40b2] p-7 text-white shadow-card sm:p-9">
        <span className="sticker end-6 top-3 text-5xl" style={{ animation: 'wiggle 4s ease-in-out infinite' }}>☀️</span>
        <span className="sticker bottom-3 start-[45%] text-3xl opacity-80">✨</span>
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium"><Sparkles size={13} /> التحدي اليومي</div>
            <h2 className="text-3xl font-extrabold">{daily ? 'خلصت تحدي النهارده 🎉' : 'جاهز لتحدي النهارده؟'}</h2>
            <p className="mt-1.5 max-w-md text-sm text-white/85">
              {daily ? `نتيجتك ${daily.correct} من ${daily.total}. ممكن تعيده أو تجرب تصنيف معين.` : 'سؤال من كل مجال + أسئلة إضافية. نفس الأسئلة طول اليوم، وبتتغير بكرة.'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {daily && (
              <ProgressRing value={daily.correct / daily.total} size={72} stroke={7} color="#ffe873">
                <span className="text-lg font-bold">{Math.round((daily.correct / daily.total) * 100)}%</span>
              </ProgressRing>
            )}
            <Link to="/skills/quiz?mode=daily" className="btn relative z-10 bg-white px-6 py-3 text-ink shadow-lg hover:bg-brand-50">
              {daily ? 'إعادة التحدي' : 'ابدأ الآن'} <ArrowLeft size={18} />
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard emoji="🔥" tone="amber" label="أيام تدريب متتالية" value={streak} />
        <StatCard emoji="✅" label="إجابات صحيحة" value={totalCorrect} hint={`من ${totalAnswered} سؤال`} />
        <StatCard emoji="🎯" tone="violet" label="نسبة الدقة" value={totalAnswered ? `${Math.round((totalCorrect / totalAnswered) * 100)}%` : '—'} />
        <Link to={mistakes.length ? '/skills/quiz?mode=mistakes' : '#'} className={`sticky-note group block rotate-[1.5deg] p-5 transition hover:rotate-0 ${mistakes.length ? '' : 'pointer-events-none'}`}>
          <div className="flex items-center gap-3">
            <span className="text-lg">📌</span>
            <span className="text-sm font-bold">راجع أخطاءك</span>
          </div>
          <div className="mt-3 font-display text-4xl font-extrabold leading-none">{mistakes.length}</div>
          <div className="mt-1.5 text-xs opacity-75">{mistakes.length ? 'اضغط للمراجعة ←' : 'مفيش أخطاء محتاجة مراجعة'}</div>
        </Link>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-ink dark:text-white">📚 المجالات</h2>
        <Link to="/skills/quiz?mode=random" className="btn-ghost text-sm"><Shuffle size={16} /> اختبار عشوائي</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const count = all.filter((q) => q.category === cat.id).length
          const s = stats[cat.id]
          const acc = s?.answered ? s.correct / s.answered : null
          const c = color(cat.color)
          return (
            <Link key={cat.id} to={`/skills/quiz?mode=category&cat=${cat.id}`} className="widget group overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between px-5 pb-4 pt-5" style={{ background: c.row }}>
                <div className="flex h-12 w-12 rotate-[-5deg] items-center justify-center rounded-2xl bg-white text-2xl shadow-sm transition group-hover:rotate-3">{cat.icon}</div>
                <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold text-ink-soft">{count} سؤال</span>
              </div>
              <div className="px-5 pb-5 pt-4">
              <h3 className="text-lg font-bold text-ink dark:text-white">{cat.name}</h3>
              <p className="mt-0.5 text-xs text-ink-soft dark:text-slate-400">{cat.desc}</p>
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-slate-500">{acc === null ? 'لسه ماجربتش' : 'دقتك'}</span>
                  {acc !== null && <span className="font-semibold text-ink dark:text-slate-200">{Math.round(acc * 100)}%</span>}
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#f3f0fb] dark:bg-white/5">
                  <div className="h-full rounded-full" style={{ width: `${(acc ?? 0) * 100}%`, background: c.hl }} />
                </div>
              </div>
              </div>
            </Link>
          )
        })}
      </div>

      {recent.length > 0 && (
        <>
          <h2 className="mb-4 mt-10 text-2xl font-bold text-ink dark:text-white">🕒 آخر المحاولات</h2>
          <div className="widget paper-grid divide-y divide-dashed divide-[#e3ddf5] dark:divide-white/10">
            {recent.map((a) => {
              const pct = a.total ? a.correct / a.total : 0
              return (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                  <ProgressRing value={pct} size={40} stroke={4} color={pct >= 0.8 ? '#10b981' : pct >= 0.5 ? '#f59e0b' : '#f43f5e'}>
                    <span className="text-[10px] font-bold">{Math.round(pct * 100)}</span>
                  </ProgressRing>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-ink dark:text-slate-100">
                      {MODE_LABELS[a.mode] ?? a.mode}
                      {a.category && ` · ${categoryById(a.category).name}`}
                    </div>
                    <div className="text-xs text-slate-500">{formatDateTime(a.created_at)}</div>
                  </div>
                  <div className="text-sm font-semibold text-ink dark:text-slate-200">{a.correct}/{a.total}</div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
