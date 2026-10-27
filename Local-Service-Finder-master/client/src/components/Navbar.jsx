import { Link, useNavigate } from 'react-router-dom'
import { LogOut, LogIn, Menu, X, LayoutDashboard, ChevronDown, Globe } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import Logo from './Logo'
import { WhatsAppIcon } from './WhatsAppButton'
import { DEFAULT_WHATSAPP_NUMBER, buildWhatsAppLink } from '../utils/whatsapp'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
    setMenuOpen(false)
    navigate('/login')
  }

  const dashboardLink = () => {
    if (!user) return '/login'
    if (user.role === 'admin') return '/admin/dashboard'
    if (user.role === 'worker') return '/worker/dashboard'
    return '/dashboard'
  }

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo showTagline={false} />

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-5">
              <Link to="/services" className="text-gray-600 hover:text-emerald-600 transition-colors text-sm font-medium">
                Browse Services
              </Link>

              {/* Direct WhatsApp help link */}
              <a
                href={buildWhatsAppLink(DEFAULT_WHATSAPP_NUMBER, 'Hello Instavaliable team! I need assistance with booking a local service.')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                title="Direct WhatsApp Help"
              >
                <WhatsAppIcon size={14} className="text-[#25D366]" />
                <span>WhatsApp Help</span>
              </a>
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <ChevronDown size={14} className="text-gray-500" />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                      <Link to={dashboardLink()} onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <LayoutDashboard size={15} /> Dashboard
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <button onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                        <LogOut size={15} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600 transition-colors font-medium">
                  <LogIn size={18} /> Login
                </Link>
              )}
            </div>

            {/* Mobile hamburger */}
            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => setMenuOpen(true)}>
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* Right-side drawer */}
      {/* Backdrop */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 bg-black/40 z-50 md:hidden transition-opacity duration-300 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer panel */}
      <div className={`fixed top-0 right-0 h-full w-72 bg-white z-50 md:hidden flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div onClick={() => setMenuOpen(false)}>
            <Logo size="sm" />
          </div>
          <button onClick={() => setMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* User info (if logged in) */}
        {isAuthenticated && (
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <Link to="/services" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Globe size={17} /> Browse Services
          </Link>
          {isAuthenticated && (
            <Link to={dashboardLink()} onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <LayoutDashboard size={17} /> Dashboard
            </Link>
          )}
          {!isAuthenticated && (
            <Link to="/login" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <LogIn size={17} /> Login
            </Link>
          )}
        </nav>

        {/* Logout at bottom */}
        {isAuthenticated && (
          <div className="p-3 border-t border-gray-100">
            <button onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
              <LogOut size={17} /> Logout
            </button>
          </div>
        )}
      </div>
    </>
  )
}
