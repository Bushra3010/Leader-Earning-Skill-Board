import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Spinner } from './components/ui'
import { useCan, useSession } from './lib/session'
import type { Feature } from './lib/types'
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
import PendingApproval from './pages/PendingApproval'
import Leaderboard from './pages/Leaderboard'
import Posters from './pages/Posters'
import Cards from './pages/Cards'

function Protected({ children, admin, feature }: { children: ReactNode; admin?: boolean; feature?: Feature }) {
  const { loading, userId, profile } = useSession()
  const can = useCan()
  const loc = useLocation()
  if (loading) return <Spinner />
  if (!userId) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  if (profile && profile.role !== 'admin' && (profile.approval_status ?? 'approved') !== 'approved') return <PendingApproval />
  if (admin && profile?.role !== 'admin') return <Navigate to="/" replace />
  if (feature && profile && !can(feature)) return <Navigate to="/" replace />
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
      <Route path="/team" element={<Protected feature="team"><Team /></Protected>} />
      <Route path="/learn" element={<Protected feature="learn"><Learn /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/wallet" element={<Protected><Wallet /></Protected>} />
      <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
      <Route path="/kit" element={<Protected><PartnerKit /></Protected>} />
      <Route path="/leaderboard" element={<Protected feature="leaderboard"><Leaderboard /></Protected>} />
      <Route path="/posters" element={<Protected feature="posters"><Posters /></Protected>} />
      <Route path="/cards" element={<Protected feature="cards"><Cards /></Protected>} />
      <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
