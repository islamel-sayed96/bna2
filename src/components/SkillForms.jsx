import { useRef, useState } from 'react'
import { Check, Plus, Trash2, Upload, Download } from 'lucide-react'
import { ConfirmDelete, Modal, Spinner } from './ui'
import { color, HABIT_COLORS } from '../lib/colors'
import { QUESTION_TYPES, rootsOf, childrenOf } from '../lib/quiz'
import { PUBLIC_PACKS, importPack, buildPack } from '../lib/packs'
import { youtubeId, toSeconds } from '../lib/speech'

const CAT_ICONS = ['📘', '🇬🇧', '🕌', '📖', '💻', '🌐', '🎨', '🧮', '🧪', '💼', '🗣️', '🎤', '✍️', '🧠', '💰', '⚽', '🏋️', '🩺', '🎵', '📜', '🧩', '🌍', '⭐', '🔥']

/* ───────────────────────── Subject / sub-topic ───────────────────────── */

export function CategoryForm({ open, category, parentId = null, userCats, onClose, onSave, onDelete }) {
  const [name, setName] = useState(category?.name ?? '')
  const [icon, setIcon] = useState(category?.icon ?? '📘')
  const [col, setCol] = useState(category?.color ?? 'violet')
  const [parent, setParent] = useState(category ? category.parent_id ?? '' : parentId ?? '')
  const [busy, setBusy] = useState(false)
  const roots = rootsOf(userCats).filter((c) => c.id !== category?.id)
  const hasChildren = category && childrenOf(userCats, category.id).length > 0

  async function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      await onSave({ name: name.trim(), icon, color: col, parent_id: parent || null })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={category ? 'تعديل' : parent ? 'موضوع فرعي جديد' : 'مجال جديد'}>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="label">الاسم</label>
          <input className="input" autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder={parent ? 'مثلًا: Grammar، أحاديث، CSS' : 'مثلًا: الإنجليزي، ديني، تقني'} />
        </div>
        {!hasChildren && (
          <div>
            <label className="label">يتبع مجال</label>
            <select className="input" value={parent} onChange={(e) => setParent(e.target.value)}>
              <option value="">— مجال رئيسي —</option>
              {roots.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label">الأيقونة</label>
          <div className="grid grid-cols-8 gap-1.5">
            {CAT_ICONS.map((i) => (
              <button type="button" key={i} onClick={() => setIcon(i)} className={`flex h-10 items-center justify-center rounded-xl text-xl transition ${icon === i ? 'bg-brand-50 ring-2 ring-brand-400' : 'hover:bg-brand-50 dark:hover:bg-white/5'}`}>{i}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">اللون</label>
          <div className="flex gap-2.5">
            {HABIT_COLORS.map((c) => (
              <button type="button" key={c} onClick={() => setCol(c)} className={`h-8 w-8 rounded-full ${color(c).dot} ${col === c ? 'ring-2 ring-slate-400 ring-offset-2' : 'opacity-70 hover:opacity-100'}`} aria-label={c} />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 pt-2">
          {category ? <ConfirmDelete onConfirm={onDelete} label="حذف (مع أسئلته)" /> : <span />}
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn-primary" disabled={busy || !name.trim()}>حفظ</button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

/* ───────────────────────── Question editor ───────────────────────── */

export function CategorySelect({ cats, value, onChange, className = 'input' }) {
  const roots = rootsOf(cats)
  return (
    <select className={className} value={value} onChange={(e) => onChange(e.target.value)}>
      {roots.map((r) => (
        <optgroup key={r.id} label={`${r.icon} ${r.name}`}>
          <option value={r.id}>{r.icon} {r.name} (عام)</option>
          {childrenOf(cats, r.id).map((c) => <option key={c.id} value={c.id}>— {c.icon} {c.name}</option>)}
        </optgroup>
      ))}
    </select>
  )
}

export function QuestionForm({ open, question, cats, defaultCategory, onClose, onSave, onDelete }) {
  const q = question ?? {}
  const [category, setCategory] = useState(q.category ?? defaultCategory ?? cats[0]?.id)
  const [type, setType] = useState(q.type ?? 'text')
  const [text, setText] = useState(q.text ?? '')
  const [options, setOptions] = useState(q.type === 'mcq' && q.options?.length ? q.options : ['', '', '', ''])
  const [answer, setAnswer] = useState(q.answer ?? 0)
  const [answerText, setAnswerText] = useState(q.answer_text ?? '')
  const [accepted, setAccepted] = useState((q.accepted ?? []).join('\n'))
  const [keywords, setKeywords] = useState((q.keywords ?? []).join('، '))
  const [yt, setYt] = useState(q.media?.youtube ?? '')
  const [start, setStart] = useState(q.media?.start ?? '')
  const [end, setEnd] = useState(q.media?.end ?? '')
  const [lang, setLang] = useState(q.lang ?? 'en')
  const [explanation, setExplanation] = useState(q.explanation ?? '')
  const [busy, setBusy] = useState(false)

  const isChoice = type === 'mcq' || type === 'truefalse'
  const filled = options.map((o) => o.trim()).filter(Boolean)
  const valid =
    (text.trim() || type === 'listening') &&
    (type === 'mcq' ? filled.length >= 2 && options[answer]?.trim() : type === 'truefalse' ? answer === 0 || answer === 1 : answerText.trim()) &&
    (type !== 'listening' || youtubeId(yt))

  async function submit(e) {
    e.preventDefault()
    if (!valid) return
    const row = { category, type, text: text.trim() || 'اسمع واكتب اللي اتقال بالظبط', lang, explanation: explanation.trim() || null, options: [], answer: null, answer_text: null, accepted: [], keywords: [], media: null }
    if (type === 'mcq') {
      const kept = options.map((o, i) => ({ o: o.trim(), i })).filter((x) => x.o)
      row.options = kept.map((x) => x.o)
      row.answer = kept.findIndex((x) => x.i === answer)
    } else if (type === 'truefalse') {
      row.options = ['صح', 'غلط']
      row.answer = answer
    } else {
      row.answer_text = answerText.trim()
      row.accepted = accepted.split('\n').map((s) => s.trim()).filter(Boolean)
      if (type === 'writing') row.keywords = keywords.split(/[،,;]/).map((s) => s.trim()).filter(Boolean)
      if (type === 'listening') row.media = { youtube: youtubeId(yt), start: toSeconds(start), end: toSeconds(end) }
    }
    setBusy(true)
    try {
      await onSave(row)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={question ? 'تعديل السؤال' : 'سؤال جديد'} wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">المجال / الموضوع</label>
            <CategorySelect cats={cats} value={category} onChange={setCategory} />
          </div>
          <div>
            <label className="label">لغة الإجابة</label>
            <select className="input" value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="en">إنجليزي (يدعم النطق والمايك)</option>
              <option value="ar">عربي</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">نوع السؤال</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {Object.entries(QUESTION_TYPES).map(([k, v]) => (
              <button type="button" key={k} onClick={() => { setType(k); if (k === 'truefalse') setAnswer(0) }} className={`rounded-xl px-2 py-2.5 text-xs font-semibold transition ${type === k ? 'bg-ink text-white' : 'bg-[#f3f0fb] text-ink-soft hover:bg-brand-100 dark:bg-white/5'}`}>
                <div className="text-lg">{v.icon}</div>{v.name}
              </button>
            ))}
          </div>
        </div>

        {type === 'listening' && (
          <div className="rounded-2xl bg-sky-50 p-4 dark:bg-sky-500/10">
            <label className="label">رابط فيديو يوتيوب</label>
            <input className="input text-left" dir="ltr" value={yt} onChange={(e) => setYt(e.target.value)} placeholder="https://youtu.be/..." />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div><label className="label">من (دقيقة:ثانية)</label><input className="input text-left" dir="ltr" value={start} onChange={(e) => setStart(e.target.value)} placeholder="1:05" /></div>
              <div><label className="label">إلى</label><input className="input text-left" dir="ltr" value={end} onChange={(e) => setEnd(e.target.value)} placeholder="1:15" /></div>
            </div>
            <p className="mt-2 text-xs text-ink-soft">نصيحة: خلّي المقطع قصير (5–15 ثانية) عشان تركّز. ممكن يكون الفيديو "غير مدرج" على يوتيوب.</p>
          </div>
        )}

        <div>
          <label className="label">{type === 'listening' ? 'تعليمات (اختياري)' : type === 'writing' ? 'السؤال أو الموضوع المطلوب الكتابة فيه' : 'السؤال'}</label>
          <textarea className="input min-h-20" dir="auto" value={text} onChange={(e) => setText(e.target.value)} placeholder={type === 'text' ? 'مثلًا: اكتب بالإنجليزي: «أنا بحاول أفهم»' : type === 'listening' ? 'اسمع واكتب اللي اتقال بالظبط' : ''} />
        </div>

        {type === 'mcq' && (
          <div>
            <label className="label">الاختيارات <span className="font-normal text-ink-soft">(اضغط الدايرة جنب الإجابة الصح)</span></label>
            <div className="space-y-2">
              {options.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button type="button" onClick={() => setAnswer(i)} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${answer === i ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'}`} aria-label="الإجابة الصحيحة">{answer === i && <Check size={14} strokeWidth={3} />}</button>
                  <input className="input" dir="auto" value={o} onChange={(e) => setOptions(options.map((x, k) => (k === i ? e.target.value : x)))} placeholder={`اختيار ${i + 1}${i >= 2 ? ' (اختياري)' : ''}`} />
                  {options.length > 2 && <button type="button" onClick={() => { setOptions(options.filter((_, k) => k !== i)); if (answer >= i && answer > 0) setAnswer(answer - 1) }} className="p-1.5 text-ink-soft hover:text-rose-600"><Trash2 size={16} /></button>}
                </div>
              ))}
              {options.length < 6 && <button type="button" onClick={() => setOptions([...options, ''])} className="btn-ghost px-2 py-1 text-xs"><Plus size={14} /> اختيار</button>}
            </div>
          </div>
        )}

        {type === 'truefalse' && (
          <div className="flex gap-2">
            {['صح', 'غلط'].map((l, i) => (
              <button type="button" key={l} onClick={() => setAnswer(i)} className={`btn flex-1 ${answer === i ? 'bg-emerald-500 text-white' : 'bg-[#f3f0fb] text-ink-soft'}`}>الإجابة: {l}</button>
            ))}
          </div>
        )}

        {!isChoice && (
          <>
            <div>
              <label className="label">{type === 'writing' ? 'إجابة نموذجية' : type === 'listening' ? 'النص اللي بيتقال في المقطع' : 'الإجابة الصحيحة'}</label>
              <textarea className={`input ${type === 'writing' ? 'min-h-32' : 'min-h-16'}`} dir="auto" value={answerText} onChange={(e) => setAnswerText(e.target.value)} />
            </div>
            {type !== 'writing' && (
              <div>
                <label className="label">إجابات تانية مقبولة <span className="font-normal text-ink-soft">(كل واحدة في سطر — اختياري)</span></label>
                <textarea className="input min-h-14" dir="auto" value={accepted} onChange={(e) => setAccepted(e.target.value)} />
                <p className="mt-1 text-xs text-ink-soft">التصحيح بيتجاهل الحروف الكبيرة والعلامات، وبيعتبر I’m = I am و gonna = going to.</p>
              </div>
            )}
            {type === 'writing' && (
              <div>
                <label className="label">كلمات لازم تستخدمها <span className="font-normal text-ink-soft">(افصل بفاصلة — اختياري)</span></label>
                <input className="input" dir="auto" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Mosque, Sidewalk, Across from" />
              </div>
            )}
          </>
        )}

        <div>
          <label className="label">الشرح (اختياري)</label>
          <textarea className="input min-h-14" dir="auto" value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="هيظهر بعد ما تجاوب." />
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

/* ───────────────────────── Packs: import / export ───────────────────────── */

export function PacksModal({ open, onClose, userCats, questions, onImported }) {
  const [busy, setBusy] = useState(null)
  const [msg, setMsg] = useState(null)
  const file = useRef(null)

  async function run(id, getPack) {
    setBusy(id)
    setMsg(null)
    try {
      const pack = await getPack()
      const res = await importPack(pack, userCats)
      setMsg({ ok: true, text: `تم ✓ أضفنا ${res.questions} سؤال${res.categories ? ` و ${res.categories} مجال/موضوع` : ''}.` })
      onImported()
    } catch (e) {
      setMsg({ ok: false, text: e.message })
    } finally {
      setBusy(null)
    }
  }

  const exportMine = () => {
    const pack = buildPack('أسئلتي', userCats, questions)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(pack, null, 1)], { type: 'application/json' }))
    a.download = `namaa-questions-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  return (
    <Modal open={open} onClose={onClose} title="📦 حزم الأسئلة" wide>
      <div className="space-y-3">
        {PUBLIC_PACKS.map((p) => (
          <div key={p.id} className="flex items-center gap-4 rounded-2xl bg-[#f3f0fb] p-4 dark:bg-white/5">
            <div className="text-3xl">{p.icon}</div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-ink dark:text-white">{p.name}</div>
              <div className="mt-0.5 text-xs text-ink-soft">{p.desc}</div>
            </div>
            <button className="btn-primary px-3" disabled={!!busy} onClick={() => run(p.id, p.load)}>{busy === p.id ? <Spinner /> : <Plus size={16} />} إضافة</button>
          </div>
        ))}

        <div className="rounded-2xl border-2 border-dashed border-[#e3ddf5] p-4 dark:border-white/10">
          <div className="font-bold text-ink dark:text-white">استيراد ملف حزمة (JSON)</div>
          <p className="mt-0.5 text-xs text-ink-soft">لو عندك ملف أسئلة خاص بيك (زي حزمة المقابلات والكورس) — بيتحفظ في حسابك انت بس.</p>
          <input
            ref={file}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) run('file', async () => JSON.parse(await f.text()))
              e.target.value = ''
            }}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-outline" disabled={!!busy} onClick={() => file.current?.click()}>{busy === 'file' ? <Spinner /> : <Upload size={16} />} اختار ملف</button>
            <button className="btn-ghost" onClick={exportMine}><Download size={16} /> تصدير أسئلتي</button>
          </div>
        </div>
        {msg && <p className={`text-sm font-medium ${msg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{msg.text}</p>}
      </div>
    </Modal>
  )
}
