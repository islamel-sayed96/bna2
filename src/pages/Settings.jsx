import { useState } from 'react'
import { Download, KeyRound, ShieldCheck, ShieldAlert } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { backend, isCloud } from '../lib/backend'
import { PageHeader, Spinner } from '../components/ui'

export default function Settings() {
  const { user } = useAuth()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  async function changePassword(e) {
    e.preventDefault()
    setMsg(null)
    if (pw.length < 8) return setMsg({ ok: false, text: 'كلمة المرور لازم تكون 8 حروف على الأقل' })
    if (pw !== pw2) return setMsg({ ok: false, text: 'كلمتين المرور مش متطابقين' })
    setBusy(true)
    try {
      await backend.updatePassword(pw)
      setPw('')
      setPw2('')
      setMsg({ ok: true, text: 'تم تغيير كلمة المرور ✓' })
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    } finally {
      setBusy(false)
    }
  }

  async function exportData() {
    const tables = ['habits', 'habit_logs', 'events', 'questions', 'quiz_attempts']
    const data = { exported_at: new Date().toISOString(), email: user.email }
    for (const t of tables) data[t] = await backend.list(t)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `namaa-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="max-w-2xl">
      <PageHeader icon="⚙️" title="الإعدادات" />

      <div className={`card mb-6 flex gap-4 p-5 ${isCloud ? '' : 'border-amber-200 dark:border-amber-900/50'}`}>
        {isCloud ? <ShieldCheck className="shrink-0 text-emerald-600" /> : <ShieldAlert className="shrink-0 text-amber-600" />}
        <div className="text-sm leading-relaxed">
          <div className="font-semibold text-ink dark:text-white">{isCloud ? 'بياناتك محمية على السيرفر' : 'وضع تجريبي'}</div>
          <p className="mt-1 text-ink-soft dark:text-slate-400">
            {isCloud
              ? 'كل بياناتك محفوظة في قاعدة بيانات Supabase ومقفولة بحسابك — محدش غيرك يقدر يقراها، وتقدر تفتحها من أي جهاز.'
              : 'البيانات محفوظة في المتصفح ده بس. لو مسحت بيانات المتصفح هتضيع، ومش هتظهر على جهاز تاني. اربط Supabase عشان حماية حقيقية.'}
          </p>
          <p className="mt-2 text-xs text-slate-400" dir="ltr">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={changePassword} className="card mb-6 space-y-4 p-5">
        <h2 className="flex items-center gap-2 font-semibold text-ink dark:text-white"><KeyRound size={18} /> تغيير كلمة المرور</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input type="password" className="input" dir="ltr" placeholder="كلمة المرور الجديدة" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
          <input type="password" className="input" dir="ltr" placeholder="تأكيدها" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
        </div>
        {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{msg.text}</p>}
        <button className="btn-primary" disabled={busy || !pw}>{busy && <Spinner />} حفظ</button>
      </form>

      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="font-semibold text-ink dark:text-white">نسخة احتياطية</h2>
          <p className="mt-1 text-sm text-ink-soft dark:text-slate-400">نزّل كل بياناتك في ملف JSON.</p>
        </div>
        <button className="btn-outline" onClick={exportData}><Download size={17} /> تنزيل</button>
      </div>
    </div>
  )
}
