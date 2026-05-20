import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RegisterPage from './pages/RegisterPage'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/register/:ekadashiId" element={<RegisterPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}