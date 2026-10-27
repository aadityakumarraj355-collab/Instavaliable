import { Link, useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react'
import Button from '../components/Button'

export default function AccessDenied({
  title = 'Access Denied',
  reason = 'You do not have authorization to access this administrative resource.',
  permission,
}) {
  const navigate = useNavigate()

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="card p-8 sm:p-10 max-w-lg w-full text-center border-red-100 shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
          <ShieldAlert size={36} />
        </div>

        <h1 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h1>
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">{reason}</p>

        {permission && (
          <div className="mt-4 p-3 bg-red-50/70 border border-red-100 rounded-xl text-xs text-red-800 font-mono">
            Missing Permission: <span className="font-bold">{permission}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 pt-6 border-t border-gray-100">
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto text-xs"
          >
            <ArrowLeft size={14} className="mr-1.5" /> Go Back
          </Button>
          <Link
            to="/admin/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center text-xs font-semibold px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            <Home size={14} className="mr-1.5" /> Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
