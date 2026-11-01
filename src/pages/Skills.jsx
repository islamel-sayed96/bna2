import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shuffle, ListPlus, ArrowLeft, Sparkles, Plus, Package } from 'lucide-react'
import { useSkills } from '../lib/useSkills'
import { categoryPath, childrenOf, dailyDoneToday, MODE_LABELS, mistakeQuestions, practiceStreak, rootsOf, statsFor, withChildren, categoryStats } from '../lib/quiz'
import { color } from '../lib/colors'
import { formatDateTime } from '../lib/dates'
import { PageHeader, PageLoader, ProgressRing, StatCard } from '../components/ui'
import { CategoryForm, PacksModal } from '../components/SkillForms'

export function CategoryCard({ cat, cats, all, stats }) {
  const ids = withChildren(cats, cat.id)
  const count = all.filter((q) => ids.includes(q.category)).length
  const subs = childrenOf(cats, cat.id)
  const s = statsFor(stats, cats, cat.id)
  const acc = s.answered ? s.correct / s.answered : null
  const c = color(cat.color)
  return (
    <Link to={`/skills/c/${cat.id}`} className="widget group block overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between px-5 pb-4 pt-5" style={{ background: c.row }}>
        <div className="flex h-12 w-12 rotate-[-5deg] items-center justify-center rounded-2xl bg-white text-2xl shadow-sm transition group-hover:rotate-3">{cat.icon}</div>
        <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold text-ink-soft">{count} سؤال</span>
      </div>
      <div className="px-5 pb-5 pt-4">
        <h3 className="text-lg font-bold text-ink dark:text-white">{cat.name}</h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-ink-soft dark:text-slate-400">
          {subs.length ? subs.map((x) => x.name).join(' · ') : cat.desc || 'بدون مواضيع فرعية'}
        </p>
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-ink-soft">{acc === null ? 'لسه ماجربتش' : `دقتك · ${s.answered} إجابة`}</span>
            {acc !== null && <span className="font-bold text-ink dark:text-white">{Math.round(acc * 100)}%</span>}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#f3f0fb] dark:bg-white/5">
            <div className="h-full rounded-full" style={{ width: `${(acc ?? 0) * 100}%`, background: c.hl }} />
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function Skills() {
  const sk = useSkills()
  const [catForm, setCatForm] = useState(false)
  const [packs, setPacks] = useState(false)

  if (sk.loading) return <PageLoader />

  const { cats, all, attempts } = sk
  const stats = categoryStats(attempts.rows, all)
  const daily = dailyDoneToday(attempts.rows)
  const streak = practiceStreak(attempts.rows)
  const mistakes = mistakeQuestions(all, attempts.rows)
  const totalAnswered = attempts.rows.reduce((s, a) => s + a.total, 0)
  const totalCorrect = attempts.rows.reduce((s, a) => s + a.correct, 0)
  const recent = [...attempts.rows].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6)
  const mine = rootsOf(sk.userCats)
  const builtins = rootsOf(cats).filter((c) => c.builtin)

  return (
    <>
      <PageHeader
        icon="🧠"
        title="تطوير المهارات"
        subtitle="مجالاتك ومواضيعك وأسئلتك — درّب نفسك كل يوم وراجع أخطاءك."
        action={
          <div className="flex flex-wrap gap-2">
            <button className="btn-outline" onClick={() => setPacks(true)}><Package size={17} /> حزم جاهزة</button>
            <Link to="/skills/questions" className="btn-outline"><ListPlus size={17} /> كل أسئلتي ({sk.questions.rows.length})</Link>
            <button className="btn-primary" onClick={() => setCatForm(true)}><Plus size={17} /> مجال جديد</button>
          </div>
        }
      />

      {/* Daily challenge hero */}
      <div className="dash-frame relative mb-8 overflow-hidden rounded-[26px] bg-gradient-to-br from-[#9a86ec] via-[#7a64db] to-[#5a40b2] p-7 text-white shadow-card sm:p-9">
        <span className="sticker end-6 top-3 text-5xl" style={{ animation: 'wiggle 4s ease-in-out infinite' }}>☀️</span>
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium"><Sparkles size={13} /> التحدي اليومي</div>
            <h2 className="text-3xl font-extrabold">{daily ? 'خلصت تحدي النهارده 🎉' : 'جاهز لتحدي النهارده؟'}</h2>
            <p className="mt-1.5 max-w-md text-sm text-white/85">
              {daily ? `نتيجتك ${daily.correct} من ${daily.total}. ممكن تعيده أو تختبر نفسك في مجال معين.` : 'سؤال من كل مجال + أسئلة إضافية. نفس الأسئلة طول اليوم، وبتتغير بكرة.'}
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-4">
            {daily && (
              <ProgressRing value={daily.correct / daily.total} size={72} stroke={7} color="#ffe873">
                <span className="text-lg font-bold">{Math.round((daily.correct / daily.total) * 100)}%</span>
              </ProgressRing>
            )}
            <Link to="/skills/quiz?mode=daily" className="btn bg-white px-6 py-3 text-ink shadow-lg hover:bg-brand-50">
              {daily ? 'إعادة التحدي' : 'ابدأ الآن'} <ArrowLeft size={18} />
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard emoji="🔥" tone="amber" label="أيام تدريب متتالية" value={streak} />
        <StatCard emoji="✅" label="إجابات صحيحة" value={totalCorrect} hint={`من ${totalAnswered} سؤال`} />
        <StatCard emoji="🎯" tone="violet" label="نسبة الدقة" value={totalAnswered ? `${Math.round((totalCorrect / totalAnswered) * 100)}%` : '—'} />
        <Link to={mistakes.length ? '/skills/quiz?mode=mistakes' : '#'} className={`sticky-note group block rotate-[1.5deg] p-5 transition hover:rotate-0 ${mistakes.length ? '' : 'pointer-events-none'}`}>
          <div className="flex items-center gap-2"><span className="text-lg">📌</span><span className="text-sm font-bold">راجع أخطاءك</span></div>
          <div className="mt-3 font-display text-4xl font-extrabold leading-none">{mistakes.length}</div>
          <div className="mt-1.5 text-xs opacity-75">{mistakes.length ? 'اضغط للمراجعة ←' : 'مفيش أخطاء محتاجة مراجعة'}</div>
        </Link>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-ink dark:text-white">📂 مجالاتي</h2>
        <Link to="/skills/quiz?mode=random" className="btn-ghost text-sm"><Shuffle size={16} /> اختبار عشوائي</Link>
      </div>
      {mine.length === 0 ? (
        <div className="widget paper-grid mb-10 flex flex-col items-center gap-4 px-6 py-10 text-center sm:flex-row sm:text-start">
          <div className="flex h-16 w-16 shrink-0 rotate-[-4deg] items-center justify-center rounded-2xl bg-note text-3xl shadow-note">📂</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-ink dark:text-white">اعمل مجالاتك بنفسك</h3>
            <p className="mt-1 text-sm text-ink-soft">مثلًا: الإنجليزي ← (إنترفيو، جمل، جرامر) · ديني ← (أحاديث، آيات) · تقني ← (HTML، CSS). أو ابدأ بحزمة الإنجليزي الجاهزة.</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-outline" onClick={() => setPacks(true)}><Package size={16} /> حزمة جاهزة</button>
            <button className="btn-primary" onClick={() => setCatForm(true)}><Plus size={16} /> مجال جديد</button>
          </div>
        </div>
      ) : (
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map((cat) => <CategoryCard key={cat.id} cat={cat} cats={cats} all={all} stats={stats} />)}
        </div>
      )}

      <h2 className="mb-4 text-2xl font-bold text-ink dark:text-white">✨ مجالات عامة جاهزة</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {builtins.map((cat) => <CategoryCard key={cat.id} cat={cat} cats={cats} all={all} stats={stats} />)}
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
                      {a.category && ` · ${categoryPath(cats, a.category)}`}
                    </div>
                    <div className="text-xs text-ink-soft">{formatDateTime(a.created_at)}</div>
                  </div>
                  <div className="text-sm font-semibold text-ink dark:text-slate-200">{a.correct}/{a.total}</div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <CategoryForm
        key={catForm ? 'open' : 'closed'}
        open={catForm}
        userCats={sk.userCats}
        onClose={() => setCatForm(false)}
        onSave={async (data) => {
          await sk.catsCol.insert(data)
          setCatForm(false)
        }}
      />
      <PacksModal open={packs} onClose={() => setPacks(false)} userCats={sk.userCats} questions={sk.questions.rows} onImported={sk.reloadAll} />
    </>
  )
}
