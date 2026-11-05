import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Check, X, Lightbulb, RotateCcw, Mic, Square, Volume2, Eye, RefreshCw } from 'lucide-react'
import { useSkills } from '../lib/useSkills'
import { categoryById, categoryPath, dailyQuestions, MODE_LABELS, mistakeQuestions, shuffle, withChildren } from '../lib/quiz'
import { gradeText, keywordCheck, wordCount, wordDiff } from '../lib/grading'
import { canSpeak, speak, useRecorder, useSpeechInput } from '../lib/speech'
import { EmptyState, PageLoader, ProgressRing } from '../components/ui'

export default function Quiz() {
  const sk = useSkills()
  const [params] = useSearchParams()
  const mode = params.get('mode') ?? 'random'
  const cat = params.get('cat')
  const n = Number(params.get('n') ?? 10)
  const [round, setRound] = useState(0)

  // Pick the questions once per round (not on every re-render / saved attempt).
  const questions = useMemo(() => {
    if (sk.loading) return null
    const { all, cats } = sk
    const inCat = cat ? withChildren(cats, cat) : null
    let list
    if (mode === 'daily') list = dailyQuestions(all, cats)
    else if (mode === 'category') list = shuffle(all.filter((q) => inCat.includes(q.category)))
    else if (mode === 'mistakes') list = shuffle(mistakeQuestions(inCat ? all.filter((q) => inCat.includes(q.category)) : all, sk.attempts.rows))
    else list = shuffle(all)
    if (mode !== 'daily' && n > 0) list = list.slice(0, mode === 'mistakes' ? 20 : n)
    // Shuffle multiple-choice options, remembering each option's original index.
    return list.map((q) => ({ ...q, order: q.type === 'mcq' ? shuffle(q.options.map((_, i) => i)) : q.options.map((_, i) => i) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sk.loading, mode, cat, n, round])

  if (!questions) return <PageLoader />

  const title = cat ? `${MODE_LABELS[mode]} · ${categoryPath(sk.cats, cat)}` : MODE_LABELS[mode]

  if (questions.length === 0) {
    return (
      <EmptyState
        icon="🤔"
        title="مفيش أسئلة هنا"
        text={mode === 'mistakes' ? 'مفيش أخطاء محتاجة مراجعة — شغل ممتاز!' : 'ضيف أسئلة للمجال ده الأول.'}
        action={<Link to={cat ? `/skills/c/${cat}` : '/skills'} className="btn-primary">رجوع</Link>}
      />
    )
  }

  return (
    <Runner
      key={round}
      title={title}
      cats={sk.cats}
      backTo={cat ? `/skills/c/${cat}` : '/skills'}
      questions={questions}
      onFinish={(details) => {
        const correct = details.filter((d) => d.correct).length
        return sk.attempts.insert({ mode, category: cat || null, total: details.length, correct, details })
      }}
      onRetry={() => setRound((r) => r + 1)}
    />
  )
}

function Runner({ title, cats, backTo, questions, onFinish, onRetry }) {
  const navigate = useNavigate()
  const [i, setI] = useState(0)
  const [results, setResults] = useState([]) // per question: { correct, chosen?, given?, level?, self? }
  const [finished, setFinished] = useState(false)
  const saved = useRef(false)

  const q = questions[i]
  const result = results[i]
  const setResult = (r) => setResults((rs) => Object.assign([...rs], { [i]: r }))

  function next() {
    if (i < questions.length - 1) return setI(i + 1)
    if (!saved.current) {
      saved.current = true
      const details = questions.map((qq, k) => ({
        qid: qq.id,
        correct: Boolean(results[k]?.correct),
        ...(results[k]?.chosen !== undefined && { chosen: results[k].chosen }),
        ...(results[k]?.given && { given: results[k].given.slice(0, 600) }),
      }))
      onFinish(details).catch(() => {})
    }
    setFinished(true)
  }

  if (finished) return <Results title={title} questions={questions} results={results} onRetry={onRetry} onBack={() => navigate(backTo)} />

  const c = categoryById(q.category, cats)
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Link to={backTo} className="btn-ghost p-2" aria-label="خروج"><ArrowRight size={20} /></Link>
        <div className="flex-1">
          <div className="mb-2 flex justify-between gap-3 text-xs text-ink-soft">
            <span className="truncate font-semibold text-ink dark:text-slate-200">{title}</span>
            <span className="shrink-0">{i + 1} / {questions.length}</span>
          </div>
          <div className="flex gap-1">
            {questions.map((qq, k) => (
              <div key={qq.id + k} className={`h-1.5 flex-1 rounded-full transition ${results[k] === undefined ? (k === i ? 'bg-brand-300 dark:bg-brand-700' : 'bg-[#e6e1f6] dark:bg-white/10') : results[k].correct ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="widget paper-grid p-6 sm:p-8" key={i} style={{ animation: 'rise .25s ease-out' }}>
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-ink-soft dark:bg-white/10 dark:text-slate-300">
          {c.icon} {categoryPath(cats, q.category)}
        </div>
        {q.type === 'listening' && <VideoClip media={q.media} />}
        <h2 className="whitespace-pre-line text-xl font-bold leading-relaxed text-ink dark:text-white sm:text-2xl" dir="auto">{q.text}</h2>

        {q.type === 'mcq' || q.type === 'truefalse' ? (
          <Choices q={q} result={result} onAnswer={(idx) => setResult({ chosen: idx, correct: idx === q.answer })} />
        ) : q.type === 'writing' ? (
          <Writing q={q} result={result} onAnswer={setResult} />
        ) : (
          <TypedAnswer q={q} result={result} onAnswer={setResult} />
        )}

        {result && (
          <div style={{ animation: 'rise .2s ease-out' }}>
            {q.explanation && (
              <div className="sticky-note mt-6 flex rotate-[-0.6deg] gap-3 p-4 text-sm leading-relaxed">
                <Lightbulb size={18} className="mt-0.5 shrink-0" />
                <p className="whitespace-pre-line" dir="auto">{q.explanation}</p>
              </div>
            )}
            <button className="btn-primary mt-5 w-full py-3" onClick={next} autoFocus={q.type === 'mcq' || q.type === 'truefalse'}>
              {i < questions.length - 1 ? 'السؤال التالي' : 'شوف النتيجة'} <ArrowLeft size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ───────────── Multiple choice / true-false ───────────── */

function Choices({ q, result, onAnswer }) {
  const revealed = result !== undefined
  useEffect(() => {
    const onKey = (e) => {
      const k = Number(e.key)
      if (!revealed && k >= 1 && k <= q.order.length) onAnswer(q.order[k - 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  return (
    <div className={`mt-6 ${q.type === 'truefalse' ? 'grid grid-cols-2 gap-3' : 'space-y-2.5'}`}>
      {q.order.map((optIdx, pos) => {
        const isCorrect = optIdx === q.answer
        const isChosen = optIdx === result?.chosen
        let cls = 'border-[#e3ddf5] bg-white hover:border-brand-300 hover:bg-brand-50 dark:border-white/10 dark:bg-white/5'
        if (revealed) {
          if (isCorrect) cls = 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200'
          else if (isChosen) cls = 'border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-500/10 dark:text-rose-200'
          else cls = 'border-[#e3ddf5] bg-white opacity-50 dark:border-white/10 dark:bg-transparent'
        }
        return (
          <button key={optIdx} disabled={revealed} onClick={() => onAnswer(optIdx)} className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-start text-sm font-medium transition sm:text-base ${cls}`}>
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${revealed && isCorrect ? 'bg-emerald-500 text-white' : revealed && isChosen ? 'bg-rose-500 text-white' : 'bg-[#f3f0fb] text-ink-soft dark:bg-white/10'}`}>
              {revealed && isCorrect ? <Check size={15} strokeWidth={3} /> : revealed && isChosen ? <X size={15} strokeWidth={3} /> : pos + 1}
            </span>
            <span className="flex-1" dir="auto">{q.options[optIdx]}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ───────────── Answer box with the mic beside it (not on top of the text) ───────────── */

function AnswerField({ value, onChange, lang, multiline = false, rows = 'min-h-24', disabled = false, placeholder, onSubmit, autoFocus = true }) {
  const speech = useSpeechInput(lang, onChange)
  const Field = multiline ? 'textarea' : 'input'
  return (
    <div>
      <div className="flex items-stretch gap-2">
        <Field
          className={`input flex-1 text-base ${multiline ? `${rows} leading-relaxed` : 'py-3'} ${disabled ? 'opacity-70' : ''}`}
          dir="auto"
          autoFocus={autoFocus}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (onSubmit && e.key === 'Enter' && (!multiline || e.ctrlKey || e.metaKey) && value.trim()) {
              e.preventDefault()
              onSubmit()
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {speech.supported && !disabled && (
          <button
            type="button"
            onClick={speech.listening ? speech.stop : speech.start}
            className={`flex w-12 shrink-0 items-center justify-center rounded-xl transition ${speech.listening ? 'animate-pulse bg-rose-500 text-white' : 'bg-[#f3f0fb] text-ink hover:bg-brand-100 dark:bg-white/10 dark:text-white'}`}
            title={speech.listening ? 'إيقاف' : 'جاوب بصوتك'}
          >
            {speech.listening ? <Square size={18} /> : <Mic size={18} />}
          </button>
        )}
      </div>
      {speech.error && <p className="mt-1 text-xs text-rose-600">{speech.error}</p>}
    </div>
  )
}

/* ───────────── Short typed answer (and listening) ───────────── */

function TypedAnswer({ q, result, onAnswer }) {
  const [value, setValue] = useState('')
  const revealed = result !== undefined
  const check = (given = value) => {
    const g = gradeText(q, given)
    onAnswer({ correct: g.correct, given, level: g.level, grade: g })
  }
  const long = (q.answer_text ?? '').length > 60
  return (
    <div className="mt-6">
      <AnswerField
        value={value}
        onChange={setValue}
        lang={q.lang}
        multiline={long}
        disabled={revealed}
        onSubmit={() => check()}
        placeholder={q.type === 'listening' ? 'اكتب اللي سمعته…' : q.lang === 'en' ? 'Type your answer…' : 'اكتب إجابتك…'}
      />
      {!revealed && (
        <div className="mt-3 flex gap-2">
          <button className="btn-primary flex-1 py-3" disabled={!value.trim()} onClick={() => check()}><Check size={18} /> تحقّق</button>
          <button className="btn-outline" onClick={() => check('')} title="هتشوف الإجابة وتتدرب عليها"><Eye size={16} /> مش عارف — وريني</button>
        </div>
      )}
      {revealed && <TypedFeedback q={q} result={result} />}
    </div>
  )
}

function TypedFeedback({ q, result }) {
  const g = result.grade
  const tone = g.level === 'exact' ? 'emerald' : g.level === 'close' ? 'amber' : g.level === 'empty' ? 'sky' : 'rose'
  const head = {
    exact: 'صح! 🎉',
    close: 'قريب جدًا! فيه غلطة صغيرة 👀',
    wrong: 'مش مظبوط — ركّز في الفرق 👇',
    empty: 'ولا يهمك — دي الإجابة، اتدرب عليها تحت 👇',
  }[g.level]
  const box = {
    emerald: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-100',
    amber: 'bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-100',
    rose: 'bg-rose-50 text-rose-900 dark:bg-rose-500/10 dark:text-rose-100',
    sky: 'bg-sky-50 text-sky-900 dark:bg-sky-500/10 dark:text-sky-100',
  }[tone]
  return (
    <>
      <div className={`mt-4 rounded-2xl p-4 ${box}`}>
        <div className="font-bold">{head}</div>
        {g.level !== 'exact' && g.level !== 'empty' && (
          <>
            <div className="mt-3 text-xs font-semibold opacity-70">مقارنة إجابتك بالصح:</div>
            <DiffView parts={g.diff.parts} />
          </>
        )}
        <AnswerLine text={g.target ?? q.answer_text} lang={q.lang} />
        {q.accepted?.length > 0 && <div className="mt-1 text-xs opacity-70" dir="auto">مقبول كمان: {q.accepted.join(' · ')}</div>}
        {q.lang === 'en' && <Recorder />}
      </div>
      {g.level !== 'exact' && <PracticeBox q={q} />}
    </>
  )
}

// Practise the right answer until you can type it — the goal is learning, not just a score.
function PracticeBox({ q }) {
  const [value, setValue] = useState('')
  const [hide, setHide] = useState(false)
  const [res, setRes] = useState(null)
  const [wins, setWins] = useState(0)
  const check = () => {
    const g = gradeText(q, value)
    setRes(g)
    if (g.correct) setWins((w) => w + 1)
  }
  const again = () => {
    setValue('')
    setRes(null)
    setHide(true)
  }
  return (
    <div className="mt-4 rounded-2xl border-2 border-dashed border-brand-200 bg-white/70 p-4 dark:border-white/15 dark:bg-white/5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-bold text-ink dark:text-white">✍️ اتدرب عليها {wins > 0 && <span className="chip ms-1 bg-emerald-100 text-emerald-700">✓ {wins}</span>}</div>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-ink-soft">
          <input type="checkbox" className="accent-brand-600" checked={hide} onChange={(e) => setHide(e.target.checked)} /> اكتبها من الذاكرة (اخفي الإجابة)
        </label>
      </div>
      {!hide && <p className="mb-2 text-sm text-ink-soft" dir="auto">اكتب: <b className="text-ink dark:text-white">{q.answer_text}</b></p>}
      <AnswerField value={value} onChange={(v) => { setValue(v); setRes(null) }} lang={q.lang} multiline={(q.answer_text ?? '').length > 60} onSubmit={check} autoFocus={false} placeholder="اكتب الإجابة الصح هنا…" />
      <div className="mt-2 flex gap-2">
        <button className="btn-outline flex-1" disabled={!value.trim()} onClick={check}><Check size={16} /> تحقّق</button>
        {res?.correct && <button className="btn-ghost" onClick={again}><RotateCcw size={15} /> مرة كمان من الذاكرة</button>}
      </div>
      {res && (res.correct ? (
        <p className="mt-2 text-sm font-semibold text-emerald-600">ممتاز! كتبتها صح ✓ {wins >= 2 ? '— كده ثبتت 💪' : ''}</p>
      ) : (
        <DiffView parts={res.diff.parts} />
      ))}
      <p className="mt-2 text-[11px] text-ink-soft">السؤال ده هيظهرلك تاني في "راجع أخطاءك" لحد ما تجاوبه صح من أول مرة.</p>
    </div>
  )
}

/* ───────────── Long writing (self-graded against a model answer) ───────────── */

function Writing({ q, result, onAnswer }) {
  const [value, setValue] = useState('')
  const [shown, setShown] = useState(false)
  const [hideModel, setHideModel] = useState(false)
  const kw = keywordCheck(q.keywords, value)
  const diff = useMemo(() => (shown ? wordDiff(q.answer_text ?? '', value) : null), [shown, q.answer_text, value])
  const grade = (self) => onAnswer({ correct: self !== 'wrong', self, given: value })

  return (
    <div className="mt-6">
      <AnswerField value={value} onChange={setValue} lang={q.lang} multiline rows="min-h-44" placeholder={q.lang === 'en' ? 'Write your answer here…' : 'اكتب إجابتك هنا…'} />
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
        <span>{wordCount(value)} كلمة</span>
        {kw.map(({ k, ok }) => (
          <span key={k} className={`chip ${ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-[#f3f0fb] text-ink-soft dark:bg-white/10'}`} dir="ltr">{ok ? '✓' : '○'} {k}</span>
        ))}
        {shown && value && <button className="ms-auto text-xs font-semibold text-brand-600 hover:underline" onClick={() => setValue('')}>امسح وابدأ تاني</button>}
      </div>

      {!shown ? (
        <div className="mt-3 flex gap-2">
          {value.trim() ? (
            <button className="btn-primary flex-1 py-3" onClick={() => setShown(true)}><Eye size={18} /> خلصت — قارن بالإجابة النموذجية</button>
          ) : (
            <button className="btn-outline flex-1 py-3" onClick={() => setShown(true)}><Eye size={18} /> نسيت — وريني الإجابة النموذجية وأتدرب عليها</button>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-[#f3f0fb] p-4 dark:bg-white/5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-bold text-ink dark:text-white">📖 الإجابة النموذجية</div>
            <div className="flex items-center gap-3">
              {value.trim() && <span className="text-xs font-semibold text-ink-soft">تشابه: {Math.round((diff?.ratio ?? 0) * 100)}%</span>}
              <button className="text-xs font-semibold text-brand-600 hover:underline" onClick={() => setHideModel((h) => !h)}>{hideModel ? 'اظهر النموذج' : 'اخفي النموذج واكتب من الذاكرة'}</button>
            </div>
          </div>
          {hideModel ? (
            <p className="mt-3 rounded-xl bg-white/70 p-3 text-sm text-ink-soft dark:bg-black/20">🙈 النموذج مخفي — اكتب من الذاكرة فوق، وبعدين اظهره وقارن.</p>
          ) : (
            <>
              <AnswerLine text={q.answer_text} lang={q.lang} plain />
              {value.trim() && (
                <>
                  <div className="mt-4 text-xs font-semibold text-ink-soft">الكلمات اللي في النموذج ومش في إجابتك <span className="rounded bg-emerald-200/70 px-1 text-emerald-900">كده</span>، واللي زيادة عندك <span className="rounded bg-rose-200/70 px-1 text-rose-900 line-through">كده</span>:</div>
                  <DiffView parts={diff.parts} />
                </>
              )}
            </>
          )}
          <p className="mt-3 text-[11px] text-ink-soft">تقدر تفضل تعدّل في إجابتك فوق وتتدرب — المقارنة بتتحدث وانت بتكتب.</p>
          {q.lang === 'en' && <Recorder />}
          {!result ? (
            <div className="mt-4">
              <div className="mb-2 text-sm font-semibold text-ink dark:text-white">لما تخلص، قيّم نفسك بأمانة:</div>
              <div className="grid grid-cols-3 gap-2">
                <button className="btn bg-emerald-500 text-white hover:bg-emerald-600" onClick={() => grade('right')}>✅ صح</button>
                <button className="btn bg-amber-400 text-amber-950 hover:bg-amber-500" onClick={() => grade('close')}>🟡 قريب</button>
                <button className="btn bg-rose-500 text-white hover:bg-rose-600" onClick={() => grade('wrong')}>❌ أراجعه</button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs font-semibold text-ink-soft">قيّمت نفسك: {result.self === 'right' ? '✅ صح' : result.self === 'close' ? '🟡 قريب' : '❌ أراجعه'} — تقدر تكمّل تدريب قبل ما تروح للسؤال التالي.</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ───────────── Shared bits ───────────── */

function DiffView({ parts }) {
  return (
    <p className="mt-1.5 rounded-xl bg-white/70 p-3 text-[15px] leading-loose text-ink dark:bg-black/20 dark:text-slate-100" dir="ltr">
      {parts.map((p, k) => (
        <span key={k} className={p.t === 'missing' ? 'rounded bg-emerald-200/80 px-1 font-semibold text-emerald-900' : p.t === 'extra' ? 'rounded bg-rose-200/70 px-1 text-rose-900 line-through' : ''}>
          {p.w}{' '}
        </span>
      ))}
    </p>
  )
}

function AnswerLine({ text, lang, plain = false }) {
  return (
    <div className={`mt-3 flex items-start gap-2 ${plain ? '' : 'font-semibold'}`}>
      <p className="flex-1 whitespace-pre-line text-[15px] leading-relaxed" dir="auto">{text}</p>
      {canSpeak && lang === 'en' && (
        <button type="button" onClick={() => speak(text, lang)} className="shrink-0 rounded-lg bg-white/80 p-1.5 text-ink hover:bg-white dark:bg-white/10 dark:text-white" title="اسمع النطق">
          <Volume2 size={17} />
        </button>
      )}
    </div>
  )
}

// Record yourself saying the answer, then play it back to compare pronunciation.
function Recorder() {
  const { url, recording, start, stop, supported } = useRecorder()
  if (!supported) return null
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
      <button type="button" onClick={recording ? stop : start} className={`btn px-3 py-1.5 text-xs ${recording ? 'animate-pulse bg-rose-500 text-white' : 'bg-white/80 text-ink hover:bg-white dark:bg-white/10 dark:text-white'}`}>
        {recording ? <><Square size={13} /> إيقاف التسجيل</> : <><Mic size={13} /> سجّل نطقك</>}
      </button>
      {url && <audio src={url} controls className="h-8 max-w-[220px]" />}
    </div>
  )
}

function VideoClip({ media }) {
  const [k, setK] = useState(0)
  if (!media?.youtube) return null
  const qs = new URLSearchParams({ rel: '0', modestbranding: '1', cc_load_policy: '0', autoplay: k ? '1' : '0' })
  if (media.start != null) qs.set('start', media.start)
  if (media.end != null) qs.set('end', media.end)
  return (
    <div className="mb-5">
      <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-card">
        <iframe
          key={k}
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${media.youtube}?${qs}`}
          title="مقطع الاستماع"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
      <button type="button" className="btn-ghost mt-2 px-3 py-1.5 text-xs" onClick={() => setK((x) => x + 1)}><RefreshCw size={14} /> أعد المقطع</button>
    </div>
  )
}

/* ───────────── Results ───────────── */

function Results({ title, questions, results, onRetry, onBack }) {
  const correct = results.filter((r) => r?.correct).length
  const pct = correct / questions.length
  const wrong = questions.map((q, k) => ({ q, r: results[k] })).filter((x) => !x.r?.correct)
  const msg = pct === 1 ? 'علامة كاملة! 🏆' : pct >= 0.8 ? 'ممتاز جدًا 👏' : pct >= 0.5 ? 'كويس — كمّل كده 💪' : 'بداية، والمراجعة هتفرق 🌱'
  return (
    <div className="mx-auto max-w-2xl">
      <div className="widget paper-grid p-8 text-center">
        <ProgressRing value={pct} size={128} stroke={10} color={pct >= 0.8 ? '#10b981' : pct >= 0.5 ? '#f59e0b' : '#f43f5e'}>
          <div className="text-3xl font-bold text-ink dark:text-white">{correct}/{questions.length}</div>
        </ProgressRing>
        <h2 className="mt-5 text-3xl font-extrabold text-ink dark:text-white">{msg}</h2>
        <p className="mt-1 text-sm text-ink-soft">{title} · {Math.round(pct * 100)}%</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button className="btn-outline" onClick={onRetry}><RotateCcw size={16} /> جولة جديدة</button>
          <button className="btn-primary" onClick={onBack}>رجوع</button>
        </div>
      </div>

      {wrong.length > 0 && (
        <>
          <h3 className="mb-3 mt-8 text-xl font-bold text-ink dark:text-white">📌 راجع اللي غلطت فيه ({wrong.length})</h3>
          <p className="mb-3 text-sm text-ink-soft">الأسئلة دي هتفضل في "راجع أخطاءك" لحد ما تجاوبها صح.</p>
          <div className="space-y-3">
            {wrong.map(({ q, r }, k) => {
              const choice = q.type === 'mcq' || q.type === 'truefalse'
              return (
                <div key={q.id + k} className="widget p-5">
                  <p className="whitespace-pre-line font-semibold text-ink dark:text-slate-100" dir="auto">{q.text}</p>
                  {choice ? (
                    r?.chosen !== undefined && <p className="mt-2 flex items-start gap-2 text-sm text-rose-600"><X size={16} className="mt-0.5 shrink-0" /> <span dir="auto">{q.options[r.chosen]}</span></p>
                  ) : (
                    r?.given && <p className="mt-2 flex items-start gap-2 text-sm text-rose-600"><X size={16} className="mt-0.5 shrink-0" /> <span dir="auto" className="line-clamp-3">{r.given}</span></p>
                  )}
                  <p className="mt-1 flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <Check size={16} className="mt-0.5 shrink-0" /> <span dir="auto" className="whitespace-pre-line">{choice ? q.options[q.answer] : q.answer_text}</span>
                  </p>
                  {q.explanation && <p className="mt-3 rounded-xl bg-[#f3f0fb] p-3 text-sm leading-relaxed text-ink-soft dark:bg-white/5" dir="auto">{q.explanation}</p>}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
