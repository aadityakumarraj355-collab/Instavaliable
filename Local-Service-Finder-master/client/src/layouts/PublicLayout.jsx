import { Outlet, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Logo from '../components/Logo'
import { WhatsAppIcon } from '../components/WhatsAppButton'
import { DEFAULT_WHATSAPP_NUMBER, buildWhatsAppLink } from '../utils/whatsapp'

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-gray-100">
            <div>
              <Logo size="default" showTagline={true} />
              <p className="text-xs text-gray-500 mt-2 max-w-sm">
                Your on-demand marketplace connecting local customers with verified freelancers and skilled service professionals.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-600">
              <Link to="/services" className="hover:text-emerald-600">All Services</Link>
              <span>·</span>
              <Link to="/register" className="hover:text-emerald-600">Become a Provider</Link>
              <span>·</span>
              <Link to="/login" className="hover:text-emerald-600">Admin Portal</Link>
              <span>·</span>
              <a
                href={buildWhatsAppLink(DEFAULT_WHATSAPP_NUMBER, 'Hello Instavaliable Support!')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"
              >
                <WhatsAppIcon size={14} className="text-[#25D366]" />
                WhatsApp Support
              </a>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
            <p>© {new Date().getFullYear()} Instavaliable — Local Services · On Demand. All rights reserved.</p>
            <p className="flex items-center gap-2">
              <span>Freelancers</span> • <span>Professionals</span> • <span>Customers</span> • <span>Nearby</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

