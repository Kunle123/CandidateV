import { createContext, useState, useEffect, useContext, useCallback } from 'react'
import { jwtDecode } from 'jwt-decode'
import { authService } from '../api'

const AuthContext = createContext(null)

// Demo user for development - used in demo mode
const DEMO_USER = {
  id: 'demo-user-id',
  email: 'demo@example.com',
  name: 'Demo User'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Initialize authentication state (moved to a callback for use in AuthWrapper)
  const initializeAuth = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const savedUser = localStorage.getItem('user')
      
      if (token) {
        try {
          // Decode token to check if valid
          const decoded = jwtDecode(token)
          const currentTime = Date.now() / 1000
          
          if (decoded.exp < currentTime) {
            console.log('Token expired, attempting to refresh')
            // Token expired, try to refresh
            const refreshed = await refreshToken()
            if (!refreshed) {
              console.log('Could not refresh token')
              setIsAuthenticated(false)
            } else {
              console.log('Token refreshed successfully')
              setIsAuthenticated(true)
            }
          } else {
            // Token valid, set user
            console.log('Valid token found')
            
            // If we have saved user info, use it
            if (savedUser) {
              try {
                const parsedUser = JSON.parse(savedUser)
                setUser(parsedUser)
                setIsAuthenticated(true)
              } catch (err) {
                console.error('Error parsing user data:', err)
                // On error, try to construct user from token
                setUser({
                  id: decoded.sub,
                  email: decoded.email || 'unknown@example.com',
                  name: decoded.name || 'Unknown User'
                })
                setIsAuthenticated(true)
              }
            } else {
              // Construct user from token as fallback
              setUser({
                id: decoded.sub,
                email: decoded.email || 'unknown@example.com',
                name: decoded.name || 'Unknown User'
              })
              setIsAuthenticated(true)
            }
          }
        } catch (error) {
          console.error('Error with token:', error)
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          setIsAuthenticated(false)
          
          // Check if we're in development - if so, use demo user
          if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
            console.log('Development environment detected, using demo user')
            setUser(DEMO_USER)
            setIsAuthenticated(true)
          }
        }
      } else {
        console.log('No token found')
        // Check if we're in development - if so, use demo user
        if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
          console.log('Development environment detected, using demo user')
          setUser(DEMO_USER)
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
        }
      }
    } catch (err) {
      console.error('Authentication initialization error:', err)
      setError('Failed to initialize authentication')
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // Run auth initialization on component mount
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  const login = async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const result = await authService.login(email, password)
      
      if (result.success) {
        setUser(result.user)
        setIsAuthenticated(true)
        return true
      } else {
        setError(result.error)
        setIsAuthenticated(false)
        return false
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Failed to login')
      setIsAuthenticated(false)
      return false
    } finally {
      setLoading(false)
    }
  }

  const register = async (name, email, password) => {
    setLoading(true)
    setError(null)
    try {
      const result = await authService.register(name, email, password)
      
      if (result.success) {
        // Registration successful, but user still needs to login
        setIsAuthenticated(false)
        return true
      } else {
        setError(result.error)
        setIsAuthenticated(false)
        return false
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Failed to register')
      setIsAuthenticated(false)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      // Call logout API if not in demo mode
      if (user?.id !== 'demo-user-id') {
        await authService.logout()
      }
      
      // Clear storage
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      
      setUser(null)
      setIsAuthenticated(false)
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshToken = async () => {
    try {
      const refresh_token = localStorage.getItem('refresh_token')
      if (!refresh_token) {
        console.log('No refresh token available')
        return false
      }
      
      const result = await authService.refreshToken(refresh_token)
      
      if (result.success) {
        setUser(result.user)
        setIsAuthenticated(true)
        return true
      } else {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setUser(null)
        setIsAuthenticated(false)
        return false
      }
    } catch (err) {
      console.error('Token refresh error:', err)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
      setIsAuthenticated(false)
      return false
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      isAuthenticated,
      login, 
      register, 
      logout, 
      refreshToken,
      initializeAuth: initializeAuth
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext 