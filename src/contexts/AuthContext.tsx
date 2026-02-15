import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { verifyPassword } from '@/lib/auth'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (identifier: string, password: string) => Promise<{ needsPasswordReset: boolean }>
  signOut: () => Promise<void>
  updatePassword: (userId: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('hotel_user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('hotel_user')
      }
    }
    setLoading(false)
  }, [])

  // Session timeout (30 minutes)
  useEffect(() => {
    if (!user) return

    let timeout: NodeJS.Timeout

    const resetTimeout = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        signOut()
      }, 30 * 60 * 1000) // 30 minutes
    }

    const handleActivity = () => resetTimeout()

    resetTimeout()
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keypress', handleActivity)
    window.addEventListener('click', handleActivity)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keypress', handleActivity)
      window.removeEventListener('click', handleActivity)
    }
  }, [user])

  const signIn = async (identifier: string, password: string) => {
    setLoading(true)
    try {
      // Query users table by email or username
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${identifier},username.eq.${identifier}`)

      if (error) throw error
      if (!users || users.length === 0) {
        throw new Error('Invalid credentials')
      }

      const user = users[0]

      // Verify password
      const isValid = await verifyPassword(password, user.password_hash)
      if (!isValid) {
        throw new Error('Invalid credentials')
      }

      // Save user to state and localStorage
      setUser(user)
      localStorage.setItem('hotel_user', JSON.stringify(user))

      return { needsPasswordReset: user.is_temp_password }
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('hotel_user')
  }

  const updatePassword = async (userId: string, newPassword: string) => {
    const { hashPassword } = await import('@/lib/auth')
    const hashedPassword = await hashPassword(newPassword)

    const { error } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        is_temp_password: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) throw error

    // Update local user state
    if (user && user.id === userId) {
      const updatedUser = { ...user, is_temp_password: false }
      setUser(updatedUser)
      localStorage.setItem('hotel_user', JSON.stringify(updatedUser))
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}
