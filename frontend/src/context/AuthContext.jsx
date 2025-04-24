import { createContext, useContext, useEffect, useState } from 'react'
import { authHelper } from '../lib/supabase'
import { authService } from '../lib/authService'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      try {
        const { session } = await authHelper.getSession()
        if (session) {
          const { user: sessionUser } = session
          setUser(sessionUser)
        } else {
          setUser(null)
        }
        setError(null)
      } catch (error) {
        console.error('Session error:', error)
        setError(error.message)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    getSession()

    // Listen for auth state changes
    const { data: { subscription } } = authHelper.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null)
        setError(null)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setError(null)
      }
      setLoading(false)
    })

    // Cleanup subscription
    return () => subscription?.unsubscribe()
  }, [])

  const value = {
    signUp: async ({ name, email, password }) => {
      try {
        setLoading(true)
        setError(null)
        const result = await authService.signUp({ name, email, password })
        if (result.user) setUser(result.user)
        return { success: true, data: result.user }
      } catch (error) {
        setError(error.message)
        return { success: false, error: error.message }
      } finally {
        setLoading(false)
      }
    },

    signIn: async ({ email, password }) => {
      try {
        setLoading(true)
        setError(null)
        const { data, error } = await authHelper.signInWithPassword({ email, password })
        
        if (error) throw error
        
        if (data?.user) {
          setUser(data.user)
          return { success: true, data: data.user }
        } else {
          throw new Error('No user data returned from sign in')
        }
      } catch (error) {
        console.error('Sign in error:', error)
        setError(error.message)
        return { success: false, error: error.message }
      } finally {
        setLoading(false)
      }
    },

    signOut: async () => {
      try {
        setLoading(true)
        setError(null)
        await authHelper.signOut()
        setUser(null)
        return { success: true }
      } catch (error) {
        console.error('Sign out error:', error)
        setError(error.message)
        return { success: false, error: error.message }
      } finally {
        setLoading(false)
      }
    },

    resetPassword: async (email) => {
      try {
        setLoading(true)
        setError(null)
        await authHelper.resetPassword(email)
        return { success: true }
      } catch (error) {
        console.error('Password reset error:', error)
        setError(error.message)
        return { success: false, error: error.message }
      } finally {
        setLoading(false)
      }
    },

    updatePassword: async (newPassword) => {
      try {
        setLoading(true)
        setError(null)
        await authHelper.updatePassword(newPassword)
        return { success: true }
      } catch (error) {
        console.error('Password update error:', error)
        setError(error.message)
        return { success: false, error: error.message }
      } finally {
        setLoading(false)
      }
    },

    user,
    loading,
    error
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 