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
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Logo />
          <h1 className="mt-10 text-2xl font-bold text-slate-900 dark:text-white">{signup ? 'إنشاء حسابك' : 'أهلًا بعودتك 👋'}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
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
            {info && <div className="rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-800 dark:bg-brand-500/10 dark:text-brand-300">{info}</div>}

            <button type="submit" disabled={busy} className="btn-primary w-full py-3">
              {busy && <Spinner />}
              {signup ? 'إنشاء الحساب' : 'تسجيل الدخول'}
            </button>
          </form>

          {allowSignup && (
            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              {signup ? 'عندك حساب؟ ' : 'أول مرة؟ '}
              <button onClick={() => { setMode(signup ? 'login' : 'signup'); setError('') }} className="font-semibold text-brand-700 hover:underline dark:text-brand-400">
                {signup ? 'سجّل دخول' : 'أنشئ حسابك'}
              </button>
            </p>
          )}

          {!isCloud && (
            <p className="mt-8 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              <b>وضع تجريبي:</b> الحساب والبيانات محفوظة في المتصفح ده بس. اربط Supabase (شوف README) عشان تبقى محمية على السيرفر وتفتحها من أي جهاز.
            </p>
          )}
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 lg:block">
        <div className="absolute -start-24 -top-24 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -bottom-32 -end-16 h-[28rem] w-[28rem] rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative flex h-full flex-col justify-center px-16 text-white">
          <h2 className="text-4xl font-bold leading-tight">كل يوم خطوة صغيرة،<br />وكل شهر نسخة أفضل منك.</h2>
          <p className="mt-5 max-w-md text-brand-100/90">عاداتك، مواعيدك، وتحديات يومية تطوّر مهاراتك — في مكان واحد هادي وخاص بيك.</p>
          <div className="mt-12 grid max-w-md grid-cols-3 gap-3">
            {[['🔥', 'سلسلة عادات'], ['🗓️', 'جدول أسبوعي'], ['🧠', 'تحدي يومي']].map(([i, t]) => (
              <div key={t} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="text-2xl">{i}</div>
                <div className="mt-2 text-sm font-medium">{t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
