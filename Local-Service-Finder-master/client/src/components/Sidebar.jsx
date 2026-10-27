import { NavLink, Link, useNavigate } from 'react-router-dom'
import { LogOut, X, Globe, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import Logo from './Logo'

export default function Sidebar({ links = [], isOpen, onClose }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate(user?.role === 'super_admin' || user?.role === 'admin' ? '/admin/login' : '/login')
  }

  // Filter links based on role and explicit permissions
  const visibleLinks = links.filter((link) => {
    if (link.requireSuperAdmin) {
      return user?.role === 'super_admin'
    }
    if (link.permission) {
      if (user?.role === 'super_admin') return true
      if (Array.isArray(link.permission)) {
        return link.permission.some((p) => user?.permissions?.includes(p))
      }
      return user?.permissions?.includes(link.permission)
    }
    return true
  })

  const isSuperAdmin = user?.role === 'super_admin'
  const isAdmin = user?.role === 'admin'

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40 flex flex-col transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <Logo size="sm" />
          <button className="lg:hidden p-1 hover:bg-gray-100 rounded" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
              isSuperAdmin ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : isAdmin ? 'bg-blue-600' : 'bg-primary-600'
            }`}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {isSuperAdmin ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                    <ShieldCheck size={10} /> Super Admin
                  </span>
                ) : isAdmin ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                    Administrator
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-1">
          <Link
            to="/services"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Globe size={18} />
            View Marketplace
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
