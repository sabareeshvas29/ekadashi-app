import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './hooks/useAuth'
import RegisterPage from './pages/RegisterPage'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminSetup from './pages/AdminSetup'
import AdminAssign from './pages/AdminAssign'
import AdminSchedule from './pages/AdminSchedule'


const queryClient = new QueryClient()

function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth()
  if (loading) return <div className="loading">Loading...</div>
  if (!admin) return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/register/:ekadashiId" element={<RegisterPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/ekadashi/new" element={<ProtectedRoute><AdminSetup /></ProtectedRoute>} />
            <Route path="/admin/ekadashi/:id/assign" element={<ProtectedRoute><AdminAssign /></ProtectedRoute>} />
            <Route path="/admin/ekadashi/:id/schedule" element={<ProtectedRoute><AdminSchedule /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/admin/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}