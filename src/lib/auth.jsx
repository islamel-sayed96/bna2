import { createContext, useContext, useEffect, useState } from 'react'
import { backend } from './backend'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = still checking

  useEffect(() => {
    backend.getUser().then(setUser)
    return backend.onAuthChange(setUser)
  }, [])

  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
