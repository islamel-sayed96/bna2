import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Plus, Pencil, Check } from 'lucide-react'
import { useCollection } from '../lib/useCollection'
import { CATEGORIES } from '../data/questions'
import { categoryById } from '../lib/quiz'
import { color } from '../lib/colors'
import { ConfirmDelete, EmptyState, Modal, PageHeader, PageLoader } from '../components/ui'

export default function MyQuestions() {
  const questions = useCollection('questions')
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('all')

  if (questions.loading) return <PageLoader />
  const list = questions.rows.filter((q) => filter === 'all' || q.category === filter)

  return (
    <>
      <Link to="/skills" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"><ArrowRight size={16} /> المهارات</Link>
      <PageHeader
        icon="✍️"
        title="أسئلتي"
        subtitle="ضيف أسئلة من اللي بتتعلمه (كورس، كتاب، شغل) وهتظهر لك في الاختبارات والتحدي اليومي."
        action={<button className="btn-primary" onClick={() => setEditing('new')}><Plus size={18} /> سؤال جديد</button>}
      />

      {questions.rows.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {[{ id: 'all', name: 'الكل' }, ...CATEGORIES].map((c) => (
            <button key={c.id} onClick={() => setFilter(c.id)} className={`chip px-3 py-1.5 text-sm ${filter === c.id ? 'bg-ink text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'}`}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState icon="✍️" title="مفيش أسئلة لسه" text="أحسن طريقة تثبّت بيها اللي بتتعلمه إنك تحوّله لأسئلة وتختبر نفسك فيها بعدين." action={<button className="btn-primary" onClick={() => setEditing('new')}><Plus size={18} /> أضف سؤال</button>} />
      ) : (
        <div className="space-y-3">
          {list.map((q) => {
            const cat = categoryById(q.category)
            return (
              <div key={q.id} className="widget flex items-start gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <span className={`chip ${color(cat.color).soft}`}>{cat.icon} {cat.name}</span>
                  <p className="mt-2 font-medium text-ink dark:text-slate-100" dir="auto">{q.text}</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400"><Check size={15} /> <span dir="auto">{q.options[q.answer]}</span></p>
                </div>
                <button onClick={() => setEditing(q)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800" aria-label="تعديل"><Pencil size={16} /></button>
              </div>
            )
          })}
        </div>
      )}

      <QuestionForm
        key={editing?.id ?? editing}
        open={editing !== null}
        question={editing === 'new' ? null : editing}
        defaultCategory={filter === 'all' ? 'productivity' : filter}
        onClose={() => setEditing(null)}
        onSave={async (data) => {
          if (editing === 'new') await questions.insert(data)
          else await questions.update(editing.id, data)
          setEditing(null)
        }}
        onDelete={async () => {
          await questions.remove(editing.id)
          setEditing(null)
        }}
      />
    </>
  )
}

function QuestionForm({ open, question, defaultCategory, onClose, onSave, onDelete }) {
  const [category, setCategory] = useState(question?.category ?? defaultCategory)
  const [text, setText] = useState(question?.text ?? '')
  const [options, setOptions] = useState(question?.options ?? ['', '', '', ''])
  const [answer, setAnswer] = useState(question?.answer ?? 0)
  const [explanation, setExplanation] = useState(question?.explanation ?? '')
  const [busy, setBusy] = useState(false)

  const filled = options.map((o) => o.trim()).filter(Boolean)
  const valid = text.trim() && filled.length >= 2 && options[answer]?.trim()

  async function submit(e) {
    e.preventDefault()
    if (!valid) return
    // Drop empty options while keeping the right answer index.
    const kept = options.map((o, i) => ({ o: o.trim(), i })).filter((x) => x.o)
    setBusy(true)
    try {
      await onSave({
        category,
        text: text.trim(),
        options: kept.map((x) => x.o),
        answer: kept.findIndex((x) => x.i === answer),
        explanation: explanation.trim() || null,
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={question ? 'تعديل السؤال' : 'سؤال جديد'} wide>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">المجال</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">السؤال</label>
          <textarea className="input min-h-20" dir="auto" autoFocus required value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div>
          <label className="label">الاختيارات <span className="font-normal text-slate-400">(اضغط الدايرة جنب الإجابة الصح)</span></label>
          <div className="space-y-2">
            {options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <button type="button" onClick={() => setAnswer(i)} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${answer === i ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-400 dark:border-slate-600'}`} aria-label="الإجابة الصحيحة">
                  {answer === i && <Check size={14} strokeWidth={3} />}
                </button>
                <input className="input" dir="auto" value={o} onChange={(e) => setOptions(options.map((x, k) => (k === i ? e.target.value : x)))} placeholder={`اختيار ${i + 1}${i >= 2 ? ' (اختياري)' : ''}`} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="label">الشرح (اختياري)</label>
          <textarea className="input min-h-16" dir="auto" value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="ليه دي الإجابة الصح؟ هيظهر بعد ما تجاوب." />
        </div>
        <div className="flex items-center justify-between gap-3 pt-2">
          {question ? <ConfirmDelete onConfirm={onDelete} /> : <span />}
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn-primary" disabled={busy || !valid}>حفظ</button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
