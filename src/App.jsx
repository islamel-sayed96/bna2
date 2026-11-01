import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { useTheme } from './lib/theme'
import Layout from './components/Layout'
import { PageLoader } from './components/ui'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Habits from './pages/Habits'
import Schedule from './pages/Schedule'
import Skills from './pages/Skills'
import Quiz from './pages/Quiz'
import MyQuestions from './pages/MyQuestions'
import Settings from './pages/Settings'

function Gate() {
  const { user } = useAuth()
  useTheme() // apply saved theme on every screen, including login
  if (user === undefined) return <PageLoader />
  if (!user) return <Login />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="habits" element={<Habits />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="skills" element={<Skills />} />
        <Route path="skills/quiz" element={<Quiz />} />
        <Route path="skills/questions" element={<MyQuestions />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Gate />
      </HashRouter>
    </AuthProvider>
  )
}
