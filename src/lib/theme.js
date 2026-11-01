import { useEffect, useState } from 'react'
import { storage } from './storage'

export function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = storage.getItem('namaa:theme')
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    storage.setItem('namaa:theme', dark ? 'dark' : 'light')
  }, [dark])
  return [dark, () => setDark((d) => !d)]
}
