import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { backend, allowSignup, isCloud } from '../lib/backend'
import Logo from '../components/Logo'
import { Spinner } from '../components/ui'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const signup = mode === 'signup'

  async function submit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    if (signup) {
      if (password.length < 8) return setError('كلمة المرور لازم تكون 8 حروف على الأقل')
      if (password !== confirm) return setError('كلمتين المرور مش متطابقين')
    }
    setBusy(true)
    try {
      if (signup) {
        const res = await backend.signUp(email, password)
        if (res.needsConfirmation) {
          setInfo('بعتنالك رسالة تأكيد على الإيميل — افتحها وبعدين سجّل دخول.')
          setMode('login')
        }
      } else {
        await backend.signIn(email, password)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center bg-white/60 px-6 py-12 dark:bg-transparent">
        <div className="w-full max-w-sm">
          <Logo />
          <h1 className="mt-10 text-3xl font-extrabold text-ink dark:text-white">{signup ? 'إنشاء حسابك' : 'أهلًا بعودتك 👋'}</h1>
          <p className="mt-2 text-sm text-ink-soft dark:text-slate-400">
            {signup ? 'حساب واحد خاص بيك، محدش غيرك يقدر يشوف بياناتك.' : 'سجّل دخولك لمتابعة عاداتك وجدولك.'}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="email">الإيميل</label>
              <div className="relative">
                <Mail size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="email" type="email" required autoComplete="email" dir="ltr" className="input ps-10 text-left" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="password">كلمة المرور</label>
              <div className="relative">
                <Lock size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="password" type={show ? 'text' : 'password'} required autoComplete={signup ? 'new-password' : 'current-password'} dir="ltr" className="input pe-10 ps-10 text-left" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="إظهار كلمة المرور">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {signup && (
              <div>
                <label className="label" htmlFor="confirm">تأكيد كلمة المرور</label>
                <input id="confirm" type={show ? 'text' : 'password'} required autoComplete="new-password" dir="ltr" className="input text-left" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
              </div>
            )}

            {error && <div className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}
            {info && <div className="rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-ink dark:bg-brand-500/10 dark:text-brand-300">{info}</div>}

            <button type="submit" disabled={busy} className="btn-primary w-full py-3">
              {busy && <Spinner />}
              {signup ? 'إنشاء الحساب' : 'تسجيل الدخول'}
            </button>
          </form>

          {allowSignup && (
            <p className="mt-6 text-center text-sm text-ink-soft dark:text-slate-400">
              {signup ? 'عندك حساب؟ ' : 'أول مرة؟ '}
              <button onClick={() => { setMode(signup ? 'login' : 'signup'); setError('') }} className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
                {signup ? 'سجّل دخول' : 'أنشئ حسابك'}
              </button>
            </p>
          )}

          {!isCloud && (
            <p className="sticky-note mt-8 rotate-[-1deg] p-3 text-xs leading-relaxed">
              <b>وضع تجريبي:</b> الحساب والبيانات محفوظة في المتصفح ده بس. اربط Supabase (شوف README) عشان تبقى محمية على السيرفر وتفتحها من أي جهاز.
            </p>
          )}
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-[#e9e4f8] dark:bg-[#1a1830] lg:block">
        <div className="absolute inset-0 paper-grid opacity-70" />
        <div className="relative flex h-full flex-col items-center justify-center px-12">
          <h2 className="text-center font-display text-5xl font-extrabold leading-tight text-ink dark:text-white">
            كل يوم <span style={{ backgroundImage: 'linear-gradient(transparent 60%, #ffe08a 60%)' }}>خطوة صغيرة</span>
          </h2>
          <p className="mt-3 text-center text-ink-soft">عاداتك، مواعيدك، وتحديات يومية — في مكان واحد خاص بيك.</p>

          <div className="relative mt-12 grid w-full max-w-lg grid-cols-2 gap-5">
            <span className="sticker -top-8 end-[46%] z-10 text-5xl" style={{ animation: 'wiggle 4s ease-in-out infinite' }}>🌸</span>
            {/* mini checklist widget */}
            <div className="widget -rotate-2 overflow-hidden">
              <div className="widget-head bg-[#dacffa]">النهارده <span>＋</span></div>
              <ul className="paper-grid px-3 py-1 text-[13px]">
                {[['شرب مية 💧', '#9fe3d3', true], ['قراءة 📖', '#f9b4c4', true], ['تمرين 💪', '#ffe08a', false], ['ورد يومي 🕌', '#a9d8f5', false]].map(([t, hl, d]) => (
                  <li key={t} className="row-line flex items-center gap-2 py-2">
                    <span className={`flex h-4 w-4 items-center justify-center rounded border-2 border-ink/60 text-[9px] ${d ? 'bg-ink text-white' : 'bg-white'}`}>{d && '✓'}</span>
                    <span className={`font-semibold text-ink ${d ? 'line-through opacity-40' : ''}`} style={d ? undefined : { backgroundImage: `linear-gradient(transparent 58%, ${hl} 58%)` }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* sticky note */}
            <div className="sticky-note rotate-2 px-4 pb-3 pt-5 text-[13px]">
              <span className="tape" />
              {[['اجتماع الفريق', '10:00'], ['تسليم التقرير', '2:00'], ['جيم', '7:00'], ['عيد ميلاد ماما', '9:00']].map(([t, h]) => (
                <div key={t} className="flex justify-between border-b border-dashed border-[#d9c66a] py-1.5 last:border-0">
                  <span className="font-medium">{t}</span><span className="opacity-60">{h}</span>
                </div>
              ))}
            </div>
            {/* countdown */}
            <div className="widget col-span-2 flex rotate-1 items-center gap-4 p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffeadc] text-3xl">🎂</div>
              <div className="flex-1"><div className="font-display text-lg font-bold text-ink">عيد ميلادي</div><div className="text-xs text-ink-soft">15 أبريل</div></div>
              <div className="text-center"><div dir="ltr" className="font-display text-4xl font-extrabold leading-none text-ink">-12</div><div className="text-xs font-semibold text-ink-soft">يوم</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
