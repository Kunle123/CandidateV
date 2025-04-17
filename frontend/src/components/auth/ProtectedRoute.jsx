import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Spinner, Flex } from '@chakra-ui/react'

// For testing purposes, set this to true to bypass authentication checks
const TEST_MODE = true;

const ProtectedRoute = () => {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  // If we're in development mode, check if we're on localhost
  const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost'

  // Display a loading spinner while checking authentication
  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
      </Flex>
    )
  }

  // Allow access if authenticated or in development environment
  if (isAuthenticated || (isDevelopment && user)) {
    return <Outlet />
  }

  // Redirect to login if not authenticated
  return <Navigate to="/login" state={{ from: location }} replace />
}

export default ProtectedRoute 