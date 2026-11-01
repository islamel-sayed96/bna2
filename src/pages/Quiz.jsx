import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Check, X, Lightbulb, RotateCcw } from 'lucide-react'
import { useCollection } from '../lib/useCollection'
import { allQuestions, categoryById, dailyQuestions, MODE_LABELS, mistakeQuestions, shuffle } from '../lib/quiz'
import { EmptyState, PageLoader, ProgressRing } from '../components/ui'

export default function Quiz() {
  const custom = useCollection('questions')
  const attempts = useCollection('quiz_attempts')
  const [params] = useSearchParams()
  const mode = params.get('mode') ?? 'random'
  const cat = params.get('cat')
  const [round, setRound] = useState(0)

  const ready = !custom.loading && !attempts.loading

  // Pick the questions once per round (not on every re-render / new attempt saved).
  const questions = useMemo(() => {
    if (!ready) return null
    const all = allQuestions(custom.rows)
    let list
    if (mode === 'daily') list = dailyQuestions(all)
    else if (mode === 'category') list = shuffle(all.filter((q) => q.category === cat)).slice(0, 10)
    else if (mode === 'mistakes') list = shuffle(mistakeQuestions(all, attempts.rows)).slice(0, 10)
    else list = shuffle(all).slice(0, 10)
    // Shuffle the option order too, remembering each option's original index.
    return list.map((q) => ({ ...q, order: shuffle(q.options.map((_, i) => i)) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, mode, cat, round])

  if (!questions) return <PageLoader />

  const title = mode === 'category' ? categoryById(cat).name : MODE_LABELS[mode]

  if (questions.length === 0) {
    return (
      <EmptyState
        icon="🤔"
        title="مفيش أسئلة هنا"
        text={mode === 'mistakes' ? 'مفيش أخطاء محتاجة مراجعة — شغل ممتاز!' : 'ضيف أسئلة للتصنيف ده من صفحة "أسئلتي".'}
        action={<Link to="/skills" className="btn-primary">رجوع</Link>}
      />
    )
  }

  return (
    <Runner
      key={round}
      title={title}
      questions={questions}
      onFinish={(details) => {
        const correct = details.filter((d) => d.correct).length
        return attempts.insert({ mode, category: mode === 'category' ? cat : null, total: details.length, correct, details })
      }}
      onRetry={() => setRound((r) => r + 1)}
    />
  )
}

function Runner({ title, questions, onFinish, onRetry }) {
  const navigate = useNavigate()
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState([]) // original option index per question
  const [finished, setFinished] = useState(false)
  const saved = useRef(false)

  const q = questions[i]
  const chosen = answers[i]
  const revealed = chosen !== undefined

  useEffect(() => {
    const onKey = (e) => {
      if (finished) return
      const n = Number(e.key)
      if (!revealed && n >= 1 && n <= q.order.length) choose(q.order[n - 1])
      if (revealed && e.key === 'Enter') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function choose(idx) {
    if (revealed) return
    const a = [...answers]
    a[i] = idx
    setAnswers(a)
  }

  function next() {
    if (i < questions.length - 1) return setI(i + 1)
    if (!saved.current) {
      saved.current = true
      onFinish(questions.map((qq, k) => ({ qid: qq.id, chosen: answers[k], correct: answers[k] === qq.answer }))).catch(() => {})
    }
    setFinished(true)
  }

  if (finished) {
    const correct = questions.filter((qq, k) => answers[k] === qq.answer).length
    const pct = correct / questions.length
    const wrong = questions.map((qq, k) => ({ q: qq, chosen: answers[k] })).filter((x) => x.chosen !== x.q.answer)
    const msg = pct === 1 ? 'علامة كاملة! 🏆' : pct >= 0.8 ? 'ممتاز جدًا 👏' : pct >= 0.5 ? 'كويس — كمّل كده 💪' : 'بداية، والمراجعة هتفرق 🌱'
    return (
      <div className="mx-auto max-w-2xl">
        <div className="widget paper-grid p-8 text-center">
          <ProgressRing value={pct} size={128} stroke={10} color={pct >= 0.8 ? '#10b981' : pct >= 0.5 ? '#f59e0b' : '#f43f5e'}>
            <div>
              <div className="text-3xl font-bold text-ink dark:text-white">{correct}/{questions.length}</div>
            </div>
          </ProgressRing>
          <h2 className="mt-5 text-3xl font-extrabold text-ink dark:text-white">{msg}</h2>
          <p className="mt-1 text-sm text-slate-500">{title} · {Math.round(pct * 100)}%</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button className="btn-outline" onClick={onRetry}><RotateCcw size={16} /> جولة جديدة</button>
            <button className="btn-primary" onClick={() => navigate('/skills')}>رجوع للمهارات</button>
          </div>
        </div>

        {wrong.length > 0 && (
          <>
            <h3 className="mb-3 mt-8 font-semibold text-ink dark:text-white">راجع الإجابات الغلط</h3>
            <div className="space-y-3">
              {wrong.map(({ q: qq, chosen: ch }) => (
                <div key={qq.id} className="card p-5">
                  <p className="font-medium text-ink dark:text-slate-100" dir="auto">{qq.text}</p>
                  {ch !== undefined && <p className="mt-2 flex items-start gap-2 text-sm text-rose-600 dark:text-rose-400"><X size={16} className="mt-0.5 shrink-0" /> <span dir="auto">{qq.options[ch]}</span></p>}
                  <p className="mt-1 flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-400"><Check size={16} className="mt-0.5 shrink-0" /> <span dir="auto">{qq.options[qq.answer]}</span></p>
                  {qq.explanation && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">{qq.explanation}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  const cat = categoryById(q.category)
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/skills" className="btn-ghost p-2" aria-label="خروج"><ArrowRight size={20} /></Link>
        <div className="flex-1">
          <div className="mb-2 flex justify-between text-xs text-slate-500">
            <span className="font-medium text-ink dark:text-slate-200">{title}</span>
            <span>{i + 1} / {questions.length}</span>
          </div>
          <div className="flex gap-1">
            {questions.map((qq, k) => (
              <div
                key={qq.id}
                className={`h-1.5 flex-1 rounded-full transition ${
                  answers[k] === undefined ? (k === i ? 'bg-brand-300 dark:bg-brand-700' : 'bg-[#e6e1f6] dark:bg-white/10') : answers[k] === qq.answer ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="widget paper-grid p-6 sm:p-8" key={i} style={{ animation: 'rise .25s ease-out' }}>
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-ink-soft dark:bg-white/10 dark:text-slate-300">
          {cat.icon} {cat.name}
        </div>
        <h2 className="text-xl font-bold leading-relaxed text-ink dark:text-white sm:text-2xl" dir="auto">{q.text}</h2>

        <div className="mt-6 space-y-2.5">
          {q.order.map((optIdx, pos) => {
            const isCorrect = optIdx === q.answer
            const isChosen = optIdx === chosen
            let cls = 'border-[#e3ddf5] bg-white hover:border-brand-300 hover:bg-brand-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-brand-500'
            if (revealed) {
              if (isCorrect) cls = 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200'
              else if (isChosen) cls = 'border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-500/10 dark:text-rose-200'
              else cls = 'border-[#e3ddf5] bg-white opacity-50 dark:border-white/10 dark:bg-transparent'
            }
            return (
              <button
                key={optIdx}
                disabled={revealed}
                onClick={() => choose(optIdx)}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-start text-sm font-medium transition sm:text-base ${cls}`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${revealed && isCorrect ? 'bg-emerald-500 text-white' : revealed && isChosen ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                  {revealed && isCorrect ? <Check size={15} strokeWidth={3} /> : revealed && isChosen ? <X size={15} strokeWidth={3} /> : pos + 1}
                </span>
                <span className="flex-1" dir="auto">{q.options[optIdx]}</span>
              </button>
            )
          })}
        </div>

        {revealed && (
          <div style={{ animation: 'rise .2s ease-out' }}>
            {q.explanation && (
              <div className="sticky-note mt-6 flex rotate-[-0.6deg] gap-3 p-4 text-sm leading-relaxed">
                <Lightbulb size={18} className="mt-0.5 shrink-0" />
                <p>{q.explanation}</p>
              </div>
            )}
            <button className="btn-primary mt-5 w-full py-3" onClick={next} autoFocus>
              {i < questions.length - 1 ? 'السؤال التالي' : 'شوف النتيجة'} <ArrowLeft size={18} />
            </button>
          </div>
        )}
      </div>
      <p className="mt-4 hidden text-center text-xs text-slate-400 sm:block">تقدر تجاوب بأرقام الكيبورد 1–4، و Enter للتالي</p>
    </div>
  )
}
