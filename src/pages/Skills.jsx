import { Link } from 'react-router-dom'
import { Flame, Target, CheckCircle2, RotateCcw, Shuffle, ListPlus, ArrowLeft, Sparkles } from 'lucide-react'
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
        title="تطوير المهارات"
        subtitle="اختبر نفسك كل يوم — 10 أسئلة متنوعة بتاخد 5 دقائق."
        action={<Link to="/skills/questions" className="btn-outline"><ListPlus size={18} /> أسئلتي ({custom.rows.length})</Link>}
      />

      {/* Daily challenge hero */}
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -end-10 -top-10 h-56 w-56 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium"><Sparkles size={13} /> التحدي اليومي</div>
            <h2 className="text-2xl font-bold">{daily ? 'خلصت تحدي النهارده 🎉' : 'جاهز لتحدي النهارده؟'}</h2>
            <p className="mt-1.5 max-w-md text-sm text-brand-100/90">
              {daily ? `نتيجتك ${daily.correct} من ${daily.total}. ممكن تعيده أو تجرب تصنيف معين.` : 'سؤال من كل مجال + أسئلة إضافية. نفس الأسئلة طول اليوم، وبتتغير بكرة.'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {daily && (
              <ProgressRing value={daily.correct / daily.total} size={72} stroke={7} color="#5eead4">
                <span className="text-lg font-bold">{Math.round((daily.correct / daily.total) * 100)}%</span>
              </ProgressRing>
            )}
            <Link to="/skills/quiz?mode=daily" className="btn bg-white px-6 py-3 text-brand-800 hover:bg-brand-50">
              {daily ? 'إعادة التحدي' : 'ابدأ الآن'} <ArrowLeft size={18} />
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Flame} tone="amber" label="أيام تدريب متتالية" value={streak} />
        <StatCard icon={CheckCircle2} label="إجابات صحيحة" value={totalCorrect} hint={`من ${totalAnswered} سؤال`} />
        <StatCard icon={Target} tone="violet" label="نسبة الدقة" value={totalAnswered ? `${Math.round((totalCorrect / totalAnswered) * 100)}%` : '—'} />
        <Link to={mistakes.length ? '/skills/quiz?mode=mistakes' : '#'} className={`card group p-5 transition ${mistakes.length ? 'hover:border-rose-200 dark:hover:border-rose-900' : 'pointer-events-none'}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"><RotateCcw size={20} /></div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">راجع أخطاءك</span>
          </div>
          <div className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">{mistakes.length}</div>
          <div className="mt-1 text-xs text-slate-500">{mistakes.length ? 'اضغط للمراجعة ←' : 'مفيش أخطاء محتاجة مراجعة'}</div>
        </Link>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">المجالات</h2>
        <Link to="/skills/quiz?mode=random" className="btn-ghost text-sm"><Shuffle size={16} /> اختبار عشوائي</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const count = all.filter((q) => q.category === cat.id).length
          const s = stats[cat.id]
          const acc = s?.answered ? s.correct / s.answered : null
          const c = color(cat.color)
          return (
            <Link key={cat.id} to={`/skills/quiz?mode=category&cat=${cat.id}`} className="card group p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${c.soft}`}>{cat.icon}</div>
                <span className="text-xs text-slate-400">{count} سؤال</span>
              </div>
              <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{cat.name}</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{cat.desc}</p>
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-slate-500">{acc === null ? 'لسه ماجربتش' : 'دقتك'}</span>
                  {acc !== null && <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.round(acc * 100)}%</span>}
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${(acc ?? 0) * 100}%` }} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {recent.length > 0 && (
        <>
          <h2 className="mb-4 mt-10 text-lg font-bold text-slate-900 dark:text-white">آخر المحاولات</h2>
          <div className="card divide-y divide-slate-100 dark:divide-slate-800">
            {recent.map((a) => {
              const pct = a.total ? a.correct / a.total : 0
              return (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                  <ProgressRing value={pct} size={40} stroke={4} color={pct >= 0.8 ? '#10b981' : pct >= 0.5 ? '#f59e0b' : '#f43f5e'}>
                    <span className="text-[10px] font-bold">{Math.round(pct * 100)}</span>
                  </ProgressRing>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {MODE_LABELS[a.mode] ?? a.mode}
                      {a.category && ` · ${categoryById(a.category).name}`}
                    </div>
                    <div className="text-xs text-slate-500">{formatDateTime(a.created_at)}</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{a.correct}/{a.total}</div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
