import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import {
  LayoutDashboard,
  CalendarCheck,
  User,
  Briefcase,
  ListChecks,
  Users,
  ShieldCheck,
  MessageSquare,
  FileText,
  Database,
  UserCheck,
  Star,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react'
import { useAuthStore } from './store/authStore'
import { socket } from './services/socket'
import { notify } from './utils/notify'

// Layouts
import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute from './routes/ProtectedRoute'

// Public pages
import Home from './pages/Home'
import Services from './pages/Services'
import ServiceDetail from './pages/ServiceDetail'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import VerifyOtp from './pages/auth/VerifyOtp'
import AccessDenied from './pages/AccessDenied'

// Client pages
import ClientDashboard from './pages/client/ClientDashboard'
import MyBookings from './pages/client/MyBookings'
import ClientProfile from './pages/client/ClientProfile'

// Worker pages
import WorkerDashboard from './pages/worker/WorkerDashboard'
import MyServices from './pages/worker/MyServices'
import WorkerRequests from './pages/worker/WorkerRequests'
import WorkerReviews from './pages/worker/WorkerReviews'
import WorkerProfile from './pages/worker/WorkerProfile'

// Admin pages
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminWorkers from './pages/admin/AdminWorkers'
import AdminUserModeration from './pages/admin/AdminUserModeration'
import AdminFeedback from './pages/admin/AdminFeedback'
import AdminReports from './pages/admin/AdminReports'
import AdminUsers from './pages/admin/AdminUsers'
import AdminServices from './pages/admin/AdminServices'
import AdminBookings from './pages/admin/AdminBookings'
import AdminAdministrators from './pages/admin/AdminAdministrators'
import AdminCreateAdministrator from './pages/admin/AdminCreateAdministrator'
import AdminProfile from './pages/admin/AdminProfile'
import AdminWhatsApp from './pages/admin/AdminWhatsApp'
import AdminAuditLogs from './pages/admin/AdminAuditLogs'
import AdminDatabase from './pages/admin/AdminDatabase'

const clientLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/bookings', label: 'My Bookings', icon: CalendarCheck },
  { to: '/profile', label: 'Profile', icon: User },
]

const workerLinks = [
  { to: '/worker/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/worker/services', label: 'My Services', icon: Briefcase },
  { to: '/worker/requests', label: 'Requests', icon: ListChecks },
  { to: '/worker/reviews', label: 'Customer Reviews', icon: Star },
  { to: '/worker/profile', label: 'Profile', icon: User },
]

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/administrators', label: 'Administrators', icon: ShieldCheck, requireSuperAdmin: true },
  { to: '/admin/customers', label: 'Customers', icon: Users, permission: 'manage_customers' },
  { to: '/admin/workers', label: 'Service Providers', icon: UserCheck, permission: 'manage_workers' },
  { to: '/admin/moderation', label: 'Block & Suspend (by ID)', icon: ShieldAlert, permission: ['manage_customers', 'manage_workers'] },
  { to: '/admin/feedback', label: 'Feedback Moderation', icon: MessageSquare, permission: ['manage_customers', 'manage_workers', 'manage_services'] },
  { to: '/admin/reports', label: 'Customer Reports', icon: AlertTriangle, permission: ['manage_customers', 'manage_workers'] },
  { to: '/admin/services', label: 'Services', icon: Briefcase, permission: 'manage_services' },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck, permission: 'manage_bookings' },
  { to: '/admin/whatsapp', label: 'WhatsApp Contacts', icon: MessageSquare, permission: 'manage_whatsapp' },
  { to: '/admin/audit-logs', label: 'Audit Trail', icon: FileText, permission: 'view_audit_logs' },
  { to: '/admin/database', label: 'Database Health', icon: Database, permission: 'manage_database' },
  { to: '/admin/profile', label: 'My Profile', icon: User },
]

export default function App() {
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    const uid = user?._id || user?.id
    if (isAuthenticated && uid) {
      const onConnect = () => socket.emit('join', uid)

      const onNewBooking = ({ message }) => {
        notify(message, '📋')
      }
      const onBookingStatus = ({ message, status }) => {
        const icon = status === 'accepted' ? '✅' : status === 'rejected' ? '❌' : '🏁'
        notify(message, icon)
      }

      socket.on('connect', onConnect)
      socket.on('new_booking', onNewBooking)
      socket.on('booking_status', onBookingStatus)

      socket.connect()
      if (socket.connected) socket.emit('join', uid)

      return () => {
        socket.off('connect', onConnect)
        socket.off('new_booking', onNewBooking)
        socket.off('booking_status', onBookingStatus)
      }
    } else {
      socket.disconnect()
    }
  }, [isAuthenticated, user?._id, user?.id])

  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/unauthorized" element={<AccessDenied />} />
      </Route>

      {/* Admin Login (Public entry to admin portal; rejects clients/workers) */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Explicitly Block Public Admin Registration */}
      <Route path="/admin/register" element={<Navigate to="/admin/login" replace />} />

      {/* Client Routes */}
      <Route element={<ProtectedRoute roles={['client']} />}>
        <Route element={<DashboardLayout links={clientLinks} title="Client Dashboard" />}>
          <Route path="/dashboard" element={<ClientDashboard />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/profile" element={<ClientProfile />} />
        </Route>
      </Route>

      {/* Worker Routes */}
      <Route element={<ProtectedRoute roles={['worker']} />}>
        <Route element={<DashboardLayout links={workerLinks} title="Worker Dashboard" />}>
          <Route path="/worker/dashboard" element={<WorkerDashboard />} />
          <Route path="/worker/services" element={<MyServices />} />
          <Route path="/worker/requests" element={<WorkerRequests />} />
          <Route path="/worker/reviews" element={<WorkerReviews />} />
          <Route path="/worker/profile" element={<WorkerProfile />} />
        </Route>
      </Route>

      {/* Admin & Super Admin Protected Routes */}
      <Route element={<ProtectedRoute roles={['admin', 'super_admin']} />}>
        <Route element={<DashboardLayout links={adminLinks} title="Instavaliable Admin Portal" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* Super Admin ONLY: Administrator Management & Creation */}
          <Route
            path="/admin/administrators"
            element={
              <ProtectedRoute requireSuperAdmin>
                <AdminAdministrators />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/administrators/create"
            element={
              <ProtectedRoute requireSuperAdmin>
                <AdminCreateAdministrator />
              </ProtectedRoute>
            }
          />

          {/* Self Admin Profile Management */}
          <Route path="/admin/profile" element={<AdminProfile />} />

          {/* Customer Management */}
          <Route
            path="/admin/customers"
            element={
              <ProtectedRoute permission="manage_customers">
                <AdminCustomers />
              </ProtectedRoute>
            }
          />

          {/* Service Provider Management */}
          <Route
            path="/admin/workers"
            element={
              <ProtectedRoute permission="manage_workers">
                <AdminWorkers />
              </ProtectedRoute>
            }
          />

          {/* Block & Suspend User by ID & Moderation History */}
          <Route
            path="/admin/moderation"
            element={
              <ProtectedRoute permission={['manage_customers', 'manage_workers']}>
                <AdminUserModeration />
              </ProtectedRoute>
            }
          />

          {/* Feedback Moderation */}
          <Route
            path="/admin/feedback"
            element={
              <ProtectedRoute permission={['manage_customers', 'manage_workers', 'manage_services']}>
                <AdminFeedback />
              </ProtectedRoute>
            }
          />

          {/* Customer Reports */}
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute permission={['manage_customers', 'manage_workers']}>
                <AdminReports />
              </ProtectedRoute>
            }
          />

          {/* Legacy Users & Workers Route */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute permission={['manage_customers', 'manage_workers']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/services"
            element={
              <ProtectedRoute permission="manage_services">
                <AdminServices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute permission="manage_bookings">
                <AdminBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/whatsapp"
            element={
              <ProtectedRoute permission="manage_whatsapp">
                <AdminWhatsApp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute permission="view_audit_logs">
                <AdminAuditLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/database"
            element={
              <ProtectedRoute permission="manage_database">
                <AdminDatabase />
              </ProtectedRoute>
            }
          />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
