import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Box, ChakraProvider } from '@chakra-ui/react'

// Layouts
import MainLayout from './components/layouts/MainLayout'
import AuthLayout from './components/layouts/AuthLayout'

// Pages
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/dashboard/Dashboard'
import Profile from './pages/profile/Profile'
import ProfilePage from './pages/profile/ProfilePage'
import PreferencesPage from './pages/profile/PreferencesPage'
import NotFound from './pages/NotFound'
import APITest from './components/APITest'
import Settings from './pages/settings/Settings'

// CV Components
import TemplateSelection from './pages/cv/TemplateSelection'
import CVEditor from './pages/cv/CVEditor'
import CVPreview from './pages/cv/CVPreview'
import SharedCVView from './pages/cv/SharedCVView'
import CVOptimize from './pages/cv/CVOptimize'

// Context and Auth
import { AuthProvider } from './context/AuthContext'
import AuthWrapper from './components/auth/AuthWrapper'
import ProtectedRoute from './components/auth/ProtectedRoute'
import theme from './theme'

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <AuthProvider>
          <AuthWrapper>
            <Box minH="100vh">
              <Routes>
                {/* Public routes */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/api-test" element={<APITest />} />
                  <Route path="/shared-cv/:id" element={<SharedCVView />} />
                </Route>
                
                {/* Auth routes */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Route>
                
                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<MainLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    {/* CV routes - new components */}
                    <Route path="/cv" element={<TemplateSelection />} />
                    <Route path="/cv/editor" element={<CVEditor />} />
                    <Route path="/cv/preview" element={<CVPreview />} />
                    <Route path="/cv/optimize/:id?" element={<CVOptimize />} />
                    
                    {/* Profile routes */}
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/profile/preferences" element={<PreferencesPage />} />
                    <Route path="/profile/new" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                </Route>
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Box>
          </AuthWrapper>
        </AuthProvider>
      </Router>
    </ChakraProvider>
  )
}

export default App 