import { createContext, useContext, useEffect, useState } from 'react'
import { authHelper } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      try {
        const user = await authHelper.getUser()
        setUser(user)
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
    const { data: { subscription } } = authHelper.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setError(null)
      setLoading(false)
    })

    // Cleanup subscription
    return () => subscription?.unsubscribe()
  }, [])

  const value = {
    signUp: async ({ email, password, name }) => {
      try {
        setLoading(true)
        setError(null)
        const user = await authHelper.signUp({
          email,
          password,
          name,
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString()
        })
        setUser(user)
        return user
      } catch (error) {
        console.error('Signup error:', error)
        setError(error.message)
        throw error
      } finally {
        setLoading(false)
      }
    },

    signIn: async ({ email, password }) => {
      try {
        setLoading(true)
        setError(null)
        const user = await authHelper.signInWithPassword({ email, password })
        setUser(user)
        return user
      } catch (error) {
        console.error('Sign in error:', error)
        setError(error.message)
        throw error
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
      } catch (error) {
        console.error('Sign out error:', error)
        setError(error.message)
        throw error
      } finally {
        setLoading(false)
      }
    },

    resetPassword: async (email) => {
      try {
        setLoading(true)
        setError(null)
        await authHelper.resetPassword(email)
      } catch (error) {
        console.error('Password reset error:', error)
        setError(error.message)
        throw error
      } finally {
        setLoading(false)
      }
    },

    updatePassword: async (newPassword) => {
      try {
        setLoading(true)
        setError(null)
        await authHelper.updatePassword(newPassword)
      } catch (error) {
        console.error('Password update error:', error)
        setError(error.message)
        throw error
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