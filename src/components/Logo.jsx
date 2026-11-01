export default function Logo({ small = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex rotate-[-6deg] items-center justify-center rounded-2xl bg-note shadow-note ${small ? 'h-9 w-9 text-lg' : 'h-11 w-11 text-2xl'}`}>🌱</div>
      <div>
        <div className={`font-display font-extrabold leading-none text-ink dark:text-white ${small ? 'text-xl' : 'text-2xl'}`}>نماء</div>
        {!small && <div className="mt-1 text-[11px] text-ink-soft dark:text-slate-400">مساحتك للنمو اليومي</div>}
      </div>
    </div>
  )
}
