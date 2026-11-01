import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Plus, Search } from 'lucide-react'
import { useSkills } from '../lib/useSkills'
import { normalize } from '../lib/grading'
import { QUESTION_TYPES, withChildren } from '../lib/quiz'
import { EmptyState, PageHeader, PageLoader } from '../components/ui'
import { QuestionForm } from '../components/SkillForms'
import { QuestionList } from './CategoryPage'

export default function MyQuestions() {
  const sk = useSkills()
  const [editing, setEditing] = useState(null)
  const [cat, setCat] = useState('all')
  const [type, setType] = useState('all')
  const [q, setQ] = useState('')

  if (sk.loading) return <PageLoader />
  const userCats = sk.cats.filter((c) => !c.builtin)
  const mine = sk.all.filter((x) => !x.builtin)
  const ids = cat === 'all' ? null : withChildren(sk.cats, cat)
  const nq = normalize(q)
  const list = mine.filter(
    (x) =>
      (!ids || ids.includes(x.category)) &&
      (type === 'all' || x.type === type) &&
      (!nq || normalize(`${x.text} ${x.answer_text ?? ''} ${(x.options ?? []).join(' ')}`).includes(nq)),
  )

  return (
    <>
      <Link to="/skills" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink"><ArrowRight size={16} /> المهارات</Link>
      <PageHeader
        icon="✍️"
        title="كل أسئلتي"
        subtitle={`${mine.length} سؤال في ${userCats.length} مجال/موضوع`}
        action={userCats.length > 0 && <button className="btn-primary" onClick={() => setEditing('new')}><Plus size={18} /> سؤال جديد</button>}
      />

      {userCats.length === 0 ? (
        <EmptyState icon="📂" title="اعمل مجال الأول" text="الأسئلة بتتحط جوه مجال أو موضوع. ارجع لصفحة المهارات واعمل مجال جديد أو ضيف حزمة جاهزة." action={<Link to="/skills" className="btn-primary">صفحة المهارات</Link>} />
      ) : (
        <>
          <div className="mb-5 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search size={17} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input className="input ps-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder="دوّر في الأسئلة والإجابات…" />
            </div>
            <div className="flex gap-2">
              <select className="input w-auto" value={cat} onChange={(e) => setCat(e.target.value)}>
                <option value="all">كل المجالات</option>
                {userCats.map((c) => <option key={c.id} value={c.id}>{c.parent_id ? '— ' : ''}{c.icon} {c.name}</option>)}
              </select>
              <select className="input w-auto" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="all">كل الأنواع</option>
                {Object.entries(QUESTION_TYPES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.name}</option>)}
              </select>
            </div>
          </div>
          {list.length === 0 ? <EmptyState icon="🔍" title="مفيش نتايج" /> : <QuestionList questions={list} cats={sk.cats} onEdit={setEditing} />}
        </>
      )}

      {userCats.length > 0 && (
        <QuestionForm
          key={editing?.id ?? editing}
          open={editing !== null}
          question={editing === 'new' ? null : editing}
          cats={userCats}
          defaultCategory={cat !== 'all' ? cat : userCats[0].id}
          onClose={() => setEditing(null)}
          onSave={async (row) => {
            if (editing === 'new') await sk.questions.insert(row)
            else await sk.questions.update(editing.id, row)
            setEditing(null)
          }}
          onDelete={async () => {
            await sk.questions.remove(editing.id)
            setEditing(null)
          }}
        />
      )}
    </>
  )
}
