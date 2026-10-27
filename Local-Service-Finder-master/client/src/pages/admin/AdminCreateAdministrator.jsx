import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, ArrowLeft, Check, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminService } from '../../services/adminService'
import Input from '../../components/Input'
import Button from '../../components/Button'

const PERMISSION_OPTIONS = [
  {
    key: 'manage_customers',
    label: 'Customer Management',
    desc: 'View customer accounts, suspend/reactivate customers, delete accounts.',
  },
  {
    key: 'manage_workers',
    label: 'Worker & Provider Management',
    desc: 'Review professionals, grant verified status, view worker profiles.',
  },
  {
    key: 'manage_services',
    label: 'Services Marketplace',
    desc: 'Audit, deactivate, or delete service offerings across categories.',
  },
  {
    key: 'manage_bookings',
    label: 'Bookings & Orders',
    desc: 'Inspect booking request details, statuses, and contact information.',
  },
  {
    key: 'manage_whatsapp',
    label: 'WhatsApp Contacts & Routing',
    desc: 'Configure official click-to-chat numbers, set primary contact, activate/deactivate helpline numbers.',
  },
  {
    key: 'view_audit_logs',
    label: 'Security Audit Logs',
    desc: 'Inspect security events, login attempts, administrative changes, and IP addresses.',
  },
  {
    key: 'manage_database',
    label: 'Database System Metrics',
    desc: 'View high-level collection counts and MongoDB server connection health.',
  },
]

export default function AdminCreateAdministrator() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    permissions: ['manage_customers', 'manage_workers', 'manage_services', 'manage_bookings'],
  })
  const [loading, setLoading] = useState(false)

  const togglePermission = (permKey) => {
    setForm((prev) => {
      const exists = prev.permissions.includes(permKey)
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== permKey)
          : [...prev.permissions, permKey],
      }
    })
  }

  const selectAll = () => {
    setForm((prev) => ({
      ...prev,
      permissions: PERMISSION_OPTIONS.map((p) => p.key),
    }))
  }

  const clearAll = () => {
    setForm((prev) => ({ ...prev, permissions: [] }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      return toast.error('Please fill in all required fields')
    }
    if (form.password.length < 8) {
      return toast.error('Password must be at least 8 characters long')
    }

    setLoading(true)
    try {
      await adminService.createAdministrator(form)
      toast.success(`Administrator account created for ${form.name}`)
      navigate('/admin/administrators')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create administrator account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/administrators"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Administrators
        </Link>
        <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
          Super Admin Authorization
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Create New Administrator</h1>
        <p className="text-sm text-gray-500 mt-1">
          Add an authorized administrator account and explicitly assign granular permissions.
        </p>
      </div>

      <div className="card p-6 sm:p-8 border border-gray-100 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Details */}
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">
              1. Account Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                placeholder="e.g. Rachel Adams"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                label="Admin Email *"
                type="email"
                placeholder="rachel@instavaliable.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Input
                label="Temporary Password * (min. 8 characters)"
                type="password"
                placeholder="••••••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <Input
                label="Phone Number (Optional)"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Granular Permissions Selection */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  2. Explicit Administrative Permissions
                </h2>
                <p className="text-xs text-gray-500">
                  New administrators only receive permissions that you explicitly enable.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs font-semibold text-emerald-600 hover:underline"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-semibold text-gray-500 hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {PERMISSION_OPTIONS.map((opt) => {
                const isSelected = form.permissions.includes(opt.key)
                return (
                  <div
                    key={opt.key}
                    onClick={() => togglePermission(opt.key)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                      isSelected
                        ? 'border-emerald-500/80 bg-emerald-50/50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected ? 'bg-emerald-600 text-white' : 'border border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check size={14} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{opt.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-gray-600 flex items-start gap-2">
            <AlertCircle size={16} className="text-slate-500 shrink-0 mt-0.5" />
            <span>
              <strong>Security Protocol:</strong> The created account will be issued an <code>admin</code> role. Ordinary administrators can never create other administrators or escalate privileges to <code>super_admin</code>.
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              loading={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-2.5 text-sm font-semibold"
            >
              Create Administrator Account
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/admin/administrators')}
              className="flex-1 py-2.5 text-sm"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
