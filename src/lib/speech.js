import { useCallback, useEffect, useRef, useState } from 'react'

const Recognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null
export const canListen = Boolean(Recognition)
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window

const LANGS = { en: 'en-US', ar: 'ar-EG' }

// Read text aloud with the browser's built-in voices (free, offline-ish).
export function speak(text, lang = 'en', rate = 0.95) {
  if (!canSpeak || !text) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = LANGS[lang] ?? lang
  u.rate = rate
  window.speechSynthesis.speak(u)
}

// Speech-to-text: answer a question by voice to practise pronunciation.
export function useSpeechInput(lang = 'en', onResult) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const rec = useRef(null)
  const cb = useRef(onResult)
  cb.current = onResult

  useEffect(() => () => rec.current?.abort?.(), [])

  const start = useCallback(() => {
    if (!Recognition) return setError('المتصفح ده مايدعمش التعرف على الصوت — جرّب Chrome أو Edge.')
    setError('')
    const r = new Recognition()
    r.lang = LANGS[lang] ?? lang
    r.interimResults = true
    r.continuous = true
    let finalText = ''
    r.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText += t + ' '
        else interim += t
      }
      cb.current?.((finalText + interim).trim())
    }
    r.onerror = (e) => setError(e.error === 'not-allowed' ? 'لازم تسمح للموقع باستخدام المايك.' : 'حصلت مشكلة في المايك، جرّب تاني.')
    r.onend = () => setListening(false)
    rec.current = r
    r.start()
    setListening(true)
  }, [lang])

  const stop = useCallback(() => rec.current?.stop(), [])
  return { listening, start, stop, error, supported: canListen }
}

// Record your own voice and play it back (stays in the browser, nothing uploaded).
export function useRecorder() {
  const [url, setUrl] = useState(null)
  const [recording, setRecording] = useState(false)
  const mr = useRef(null)
  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const chunks = []
      const m = new MediaRecorder(stream)
      m.ondataavailable = (e) => chunks.push(e.data)
      m.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        setUrl((old) => {
          if (old) URL.revokeObjectURL(old)
          return URL.createObjectURL(new Blob(chunks, { type: m.mimeType }))
        })
        setRecording(false)
      }
      mr.current = m
      m.start()
      setRecording(true)
    } catch {
      setRecording(false)
    }
  }
  const stop = () => mr.current?.state === 'recording' && mr.current.stop()
  return { url, recording, start, stop, supported: typeof MediaRecorder !== 'undefined' }
}

// Extract the video id from any YouTube link.
export function youtubeId(url = '') {
  const m = String(url).match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/)
  return m ? m[1] : /^[\w-]{11}$/.test(url) ? url : null
}

// "1:23" or "83" -> 83 seconds
export function toSeconds(v) {
  if (v === '' || v == null) return null
  if (typeof v === 'number') return v
  const p = String(v).split(':').map(Number)
  if (p.some(Number.isNaN)) return null
  return p.reduce((s, x) => s * 60 + x, 0)
}
