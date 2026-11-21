import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Spinner } from './components/ui'
import { useSession } from './lib/session'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import Orders from './pages/Orders'
import Team from './pages/Team'
import Learn from './pages/Learn'
import Profile from './pages/Profile'
import Wallet from './pages/Wallet'
import Notifications from './pages/Notifications'
import PartnerKit from './pages/PartnerKit'
import PublicProduct from './pages/PublicProduct'
import Privacy from './pages/Privacy'
import Admin from './pages/Admin'
import Products from './pages/Products'
import More from './pages/More'

function Protected({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const { loading, userId, profile } = useSession()
  const loc = useLocation()
  if (loading) return <Spinner />
  if (!userId) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  if (admin && profile?.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/p/:slug" element={<PublicProduct />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/" element={<Protected><Home /></Protected>} />
      <Route path="/products" element={<Protected><Products /></Protected>} />
      <Route path="/more" element={<Protected><More /></Protected>} />
      <Route path="/product/:slug" element={<Protected><ProductDetail /></Protected>} />
      <Route path="/orders" element={<Protected><Orders /></Protected>} />
      <Route path="/team" element={<Protected><Team /></Protected>} />
      <Route path="/learn" element={<Protected><Learn /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/wallet" element={<Protected><Wallet /></Protected>} />
      <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
      <Route path="/kit" element={<Protected><PartnerKit /></Protected>} />
      <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
