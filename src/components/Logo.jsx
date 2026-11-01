export default function Logo({ small = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-sm ${small ? 'h-8 w-8' : 'h-10 w-10'}`}>
        <svg viewBox="0 0 24 24" className={small ? 'h-5 w-5' : 'h-6 w-6'} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20v-9M12 13c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6zm0-1c0-3-2.2-5.2-5.2-5.2 0 3 2.2 5.2 5.2 5.2z" />
        </svg>
      </div>
      <div>
        <div className={`font-bold leading-none text-slate-900 dark:text-white ${small ? 'text-lg' : 'text-xl'}`}>نماء</div>
        {!small && <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">مساحتك للنمو اليومي</div>}
      </div>
    </div>
  )
}
