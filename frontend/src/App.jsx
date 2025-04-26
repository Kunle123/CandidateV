import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Box, ChakraProvider } from '@chakra-ui/react'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
      <AuthProvider>
        <Router>
          <AuthWrapper>
            <Box minH="100vh">
              <Routes>
                {/* Public routes */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Home />} />
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
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </Box>
          </AuthWrapper>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  )
}

export default App 