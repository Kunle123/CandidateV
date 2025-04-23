import { createContext, useContext, useEffect, useState } from 'react'
import authService from '../api/authService'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check active session/user on mount
    const getSession = async () => {
      try {
        setLoading(true)
        const { user: currentUser } = await authService.getCurrentUser()
        setUser(currentUser || null)
        setError(null)
      } catch (error) {
        setUser(null)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }
    getSession()
  }, [])

  const value = {
    signIn: async ({ email, password }) => {
      try {
        setLoading(true)
        setError(null)
        const { user: loggedInUser } = await authService.login({ email, password })
        setUser(loggedInUser)
        return { success: true, data: loggedInUser }
      } catch (error) {
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
        await authService.logout()
        setUser(null)
        return { success: true }
      } catch (error) {
        setError(error.message)
        return { success: false, error: error.message }
      } finally {
        setLoading(false)
      }
    },

    // Social login: just return the URL for the provider
    getSocialLoginUrl: (provider) => authService.getSocialLoginUrl(provider),

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