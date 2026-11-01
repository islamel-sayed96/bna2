import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Pencil, Plus, Play, RotateCcw } from 'lucide-react'
import { useSkills } from '../lib/useSkills'
import { categoryById, categoryStats, childrenOf, mistakeQuestions, QUESTION_TYPES, statsFor, withChildren } from '../lib/quiz'
import { color } from '../lib/colors'
import { EmptyState, PageLoader } from '../components/ui'
import { CategoryForm, QuestionForm } from '../components/SkillForms'

const COUNTS = [10, 20, 30, 0] // 0 = all

export default function CategoryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const sk = useSkills()
  const [count, setCount] = useState(10)
  const [catForm, setCatForm] = useState(null) // null | 'edit' | 'sub'
  const [qForm, setQForm] = useState(null) // null | 'new' | question
  const [filter, setFilter] = useState('all')

  if (sk.loading) return <PageLoader />
  const { cats, all, attempts } = sk
  const cat = categoryById(id, cats)
  if (cat.name === 'بدون تصنيف' && !cats.some((c) => c.id === id)) return <EmptyState icon="🤔" title="المجال ده مش موجود" action={<Link to="/skills" className="btn-primary">رجوع</Link>} />

  const parent = cat.parent_id ? categoryById(cat.parent_id, cats) : null
  const subs = childrenOf(cats, cat.id)
  const ids = withChildren(cats, cat.id)
  const questions = all.filter((q) => ids.includes(q.category))
  const stats = categoryStats(attempts.rows, all)
  const mistakes = mistakeQuestions(questions, attempts.rows)
  const c = color(cat.color)
  const own = !cat.builtin
  const shown = questions.filter((q) => filter === 'all' || q.category === filter)
  const start = (cid) => navigate(`/skills/quiz?mode=category&cat=${cid}&n=${count}`)

  return (
    <>
      <Link to={parent ? `/skills/c/${parent.id}` : '/skills'} className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ArrowRight size={16} /> {parent ? `${parent.icon} ${parent.name}` : 'المهارات'}
      </Link>

      <div className="widget mb-6 overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 p-6" style={{ background: c.row }}>
          <div className="flex h-16 w-16 rotate-[-5deg] items-center justify-center rounded-2xl bg-white text-4xl shadow-sm">{cat.icon}</div>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-extrabold text-ink">{cat.name}</h1>
            <p className="mt-1 text-sm text-ink-soft">{questions.length} سؤال{subs.length ? ` · ${subs.length} موضوع فرعي` : ''}{cat.desc ? ` · ${cat.desc}` : ''}</p>
          </div>
          {own && <button className="btn-outline" onClick={() => setCatForm('edit')}><Pencil size={15} /> تعديل</button>}
        </div>
        <div className="flex flex-wrap items-center gap-3 p-5">
          <span className="text-sm font-semibold text-ink-soft">عدد الأسئلة:</span>
          <div className="flex rounded-xl bg-[#f3f0fb] p-1 dark:bg-white/5">
            {COUNTS.map((n) => (
              <button key={n} onClick={() => setCount(n)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${count === n ? 'bg-white text-ink shadow-sm dark:bg-white/15 dark:text-white' : 'text-ink-soft'}`}>{n || 'الكل'}</button>
            ))}
          </div>
          <div className="ms-auto flex flex-wrap gap-2">
            {mistakes.length > 0 && <Link to={`/skills/quiz?mode=mistakes&cat=${cat.id}`} className="btn-outline"><RotateCcw size={16} /> راجع أخطاءك ({mistakes.length})</Link>}
            <button className="btn-primary" disabled={!questions.length} onClick={() => start(cat.id)}><Play size={16} /> اختبرني {subs.length ? 'في المجال كله' : ''}</button>
          </div>
        </div>
      </div>

      {(subs.length > 0 || (own && !cat.parent_id)) && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink dark:text-white">📑 المواضيع</h2>
            {own && !cat.parent_id && <button className="btn-ghost text-sm" onClick={() => setCatForm('sub')}><Plus size={16} /> موضوع فرعي</button>}
          </div>
          {subs.length === 0 ? (
            <p className="widget paper-grid mb-8 p-6 text-center text-sm text-ink-soft">قسّم المجال لمواضيع — مثلًا للإنجليزي: إنترفيو، جمل، جرامر.</p>
          ) : (
            <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subs.map((s) => {
                const n = all.filter((q) => q.category === s.id).length
                const st = statsFor(stats, cats, s.id)
                const acc = st.answered ? Math.round((st.correct / st.answered) * 100) : null
                return (
                  <div key={s.id} className="widget flex items-center gap-3 p-4">
                    <Link to={`/skills/c/${s.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: color(s.color).row }}>{s.icon}</span>
                      <span className="min-w-0">
                        <span className="block truncate font-bold text-ink dark:text-white">{s.name}</span>
                        <span className="text-xs text-ink-soft">{n} سؤال{acc !== null ? ` · دقة ${acc}%` : ''}</span>
                      </span>
                    </Link>
                    <button className="rounded-full bg-ink p-2 text-white hover:bg-brand-800 disabled:opacity-40" disabled={!n} onClick={() => start(s.id)} aria-label="ابدأ"><Play size={14} /></button>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-ink dark:text-white">📝 الأسئلة</h2>
        <div className="flex flex-wrap items-center gap-2">
          {subs.length > 0 && (
            <select className="input w-auto py-1.5" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">كل المواضيع</option>
              <option value={cat.id}>{cat.name} (عام)</option>
              {subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          {own && <button className="btn-primary" onClick={() => setQForm('new')}><Plus size={16} /> سؤال</button>}
        </div>
      </div>
      {shown.length === 0 ? (
        <EmptyState icon="✍️" title="مفيش أسئلة لسه" text={own ? 'ضيف أسئلة: اختيارات، صح/غلط، إجابة مكتوبة، موضوع كتابة، أو استماع من فيديو.' : ''} action={own && <button className="btn-primary" onClick={() => setQForm('new')}><Plus size={16} /> أضف سؤال</button>} />
      ) : (
        <QuestionList questions={shown} cats={cats} onEdit={own ? setQForm : null} />
      )}

      <CategoryForm
        key={`cat-${catForm}`}
        open={catForm !== null}
        category={catForm === 'edit' ? cat : null}
        parentId={catForm === 'sub' ? cat.id : null}
        userCats={sk.userCats}
        onClose={() => setCatForm(null)}
        onSave={async (data) => {
          if (catForm === 'edit') await sk.catsCol.update(cat.id, data)
          else await sk.catsCol.insert(data)
          setCatForm(null)
        }}
        onDelete={async () => {
          await sk.deleteCategory(cat.id)
          navigate(parent ? `/skills/c/${parent.id}` : '/skills')
        }}
      />
      <QuestionForm
        key={`q-${qForm?.id ?? qForm}`}
        open={qForm !== null}
        question={qForm === 'new' ? null : qForm}
        cats={cats.filter((x) => !x.builtin)}
        defaultCategory={filter !== 'all' ? filter : cat.id}
        onClose={() => setQForm(null)}
        onSave={async (row) => {
          if (qForm === 'new') await sk.questions.insert(row)
          else await sk.questions.update(qForm.id, row)
          setQForm(null)
        }}
        onDelete={async () => {
          await sk.questions.remove(qForm.id)
          setQForm(null)
        }}
      />
    </>
  )
}

export function QuestionList({ questions, cats, onEdit, limit = 60 }) {
  const [more, setMore] = useState(false)
  const list = more ? questions : questions.slice(0, limit)
  return (
    <div className="widget divide-y divide-dashed divide-[#e3ddf5] dark:divide-white/10">
      {list.map((q) => {
        const sub = categoryById(q.category, cats)
        return (
          <div key={q.id} className="flex items-start gap-3 px-5 py-3.5">
            <span className="mt-0.5 text-lg" title={QUESTION_TYPES[q.type]?.name}>{QUESTION_TYPES[q.type]?.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="whitespace-pre-line text-[15px] font-medium text-ink dark:text-slate-100" dir="auto">{q.text}</p>
              <p className="mt-1 line-clamp-1 text-xs text-ink-soft" dir="auto">
                <span className="chip me-1.5 bg-[#f3f0fb] dark:bg-white/10">{sub.icon} {sub.name}</span>
                {q.type === 'mcq' || q.type === 'truefalse' ? q.options[q.answer] : q.answer_text}
              </p>
            </div>
            {onEdit && !q.builtin && <button onClick={() => onEdit(q)} className="rounded-lg p-1.5 text-ink-soft hover:bg-brand-50" aria-label="تعديل"><Pencil size={15} /></button>}
          </div>
        )
      })}
      {!more && questions.length > limit && (
        <button onClick={() => setMore(true)} className="w-full py-3 text-sm font-semibold text-brand-600 hover:bg-brand-50">عرض الكل ({questions.length})</button>
      )}
    </div>
  )
}
