import { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Search,
  CheckCircle,
  AlertTriangle,
  History,
  Clock,
  User,
  Briefcase,
  Layers,
  X,
  RefreshCw,
} from 'lucide-react'
import { adminService } from '../../services/adminService'
import { formatDate, formatCurrency, getAccountStatusColor } from '../../utils/helpers'

export default function AdminUserModeration() {
  const [searchId, setSearchId] = useState('')
  const [loadingUser, setLoadingUser] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Moderation form
  const [action, setAction] = useState('suspend')
  const [reason, setReason] = useState('')
  const [duration, setDuration] = useState('7 days')
  const [customDays, setCustomDays] = useState('14')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Global Moderation History
  const [historyList, setHistoryList] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyPagination, setHistoryPagination] = useState({ total: 0, pages: 1 })

  const fetchGlobalHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await adminService.getAllModerationHistory({ page: historyPage, limit: 10 })
      if (res.data?.success) {
        setHistoryList(res.data.data.history || [])
        setHistoryPagination(res.data.data.pagination || { total: 0, pages: 1 })
      }
    } catch (err) {
      console.error('Failed to load moderation history:', err.message)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    fetchGlobalHistory()
  }, [historyPage])

  const handleSearchUser = async (e) => {
    e?.preventDefault()
    if (!searchId || !searchId.trim()) return

    setLoadingUser(true)
    setErrorMsg('')
    setSuccessMsg('')
    setUserProfile(null)

    try {
      const cleanId = searchId.trim()
      const res = await adminService.getUserByIdDetail(cleanId)
      if (res.data?.success) {
        setUserProfile(res.data.data)
        // Set default action according to current status
        const current = res.data.data.user.accountStatus || 'active'
        setAction(current === 'active' ? 'suspend' : 'restore')
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'User account not found with the entered ID.')
    } finally {
      setLoadingUser(false)
    }
  }

  const handleModerationSubmit = async (e) => {
    e.preventDefault()
    if (!userProfile) return

    if (!reason && ['suspend', 'block', 'restrict'].includes(action)) {
      setErrorMsg('A clear justification reason is strictly required for this moderation action.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const payload = {
        action,
        reason,
        duration,
        customDurationDays: duration === 'custom' ? customDays : undefined,
      }

      const res = await adminService.moderateUser(userProfile.user._id, payload)
      if (res.data?.success) {
        setSuccessMsg(
          `Success: Account ${userProfile.user.name} (${userProfile.user.role}) has been set to ${res.data.data.user.accountStatus.toUpperCase()}.`
        )
        // Refresh profile details and history
        handleSearchUser()
        fetchGlobalHistory()
        setReason('')
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to execute moderation action.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldAlert className="text-red-600" /> Account Moderation & Suspension by ID
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Directly lookup any registered customer or service provider by their unique User ID to enforce temporary suspensions, permanent blocks, or restorations.
        </p>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* User ID Search Box */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
          1. Lookup Registered User by ID
        </h2>
        <form onSubmit={handleSearchUser} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Enter 24-character User ID (e.g. 6adf366e5f789d8210f8331f)..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="input-field pl-10 font-mono text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loadingUser}
            className="btn-primary flex items-center justify-center gap-2 shrink-0 px-6"
          >
            {loadingUser ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Searching...
              </>
            ) : (
              'Lookup User ID'
            )}
          </button>
        </form>
      </div>

      {/* User Profile & Moderation Action Box */}
      {userProfile && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl text-white ${
                  userProfile.user.role === 'worker' ? 'bg-blue-600' : 'bg-primary-600'
                }`}
              >
                {userProfile.user.role === 'worker' ? <Briefcase size={22} /> : <User size={22} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">{userProfile.user.name}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${getAccountStatusColor(
                      userProfile.user.accountStatus || 'active'
                    )}`}
                  >
                    {userProfile.user.accountStatus || 'active'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  ID: <span className="text-gray-800 font-bold">{userProfile.user._id}</span> • Role:{' '}
                  <span className="font-bold uppercase text-gray-700">{userProfile.user.role}</span>
                </p>
              </div>
            </div>

            <div className="text-xs text-gray-500 sm:text-right">
              <div>Email: <span className="font-semibold text-gray-800">{userProfile.user.email}</span></div>
              <div>Phone: <span className="font-semibold text-gray-800">{userProfile.user.phone || 'N/A'}</span></div>
            </div>
          </div>

          {/* Current Suspension Details if Inactive */}
          {userProfile.user.accountStatus !== 'active' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-800 space-y-1">
              <p className="font-bold text-sm flex items-center gap-1.5">
                <AlertTriangle size={16} /> Currently {userProfile.user.accountStatus.toUpperCase()}
              </p>
              <p>Reason: <span className="font-semibold">{userProfile.user.suspensionReason || 'None documented'}</span></p>
              <p>Duration: <span className="font-semibold">{userProfile.user.suspensionDuration || 'Permanent'}</span></p>
              {userProfile.user.suspensionEndDate && (
                <p>Expires On: <span className="font-semibold">{formatDate(userProfile.user.suspensionEndDate)}</span></p>
              )}
            </div>
          )}

          {/* Moderation Form */}
          <form onSubmit={handleModerationSubmit} className="space-y-4 bg-gray-50/80 p-5 rounded-xl border border-gray-200">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              2. Select Moderation Action
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="suspend">Suspend Account (Temporary / Timed)</option>
                  <option value="block">Block Account (Permanent Lockdown)</option>
                  <option value="restrict">Restrict Account (Limited Access)</option>
                  <option value="restore">Restore Account (Active)</option>
                </select>
              </div>

              {['suspend', 'restrict'].includes(action) && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Suspension Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="24 hours">24 hours</option>
                    <option value="3 days">3 days</option>
                    <option value="7 days">7 days</option>
                    <option value="30 days">30 days</option>
                    <option value="custom">Custom (Specify days)</option>
                    <option value="permanent">Permanent</option>
                  </select>

                  {duration === 'custom' && (
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      placeholder="Enter number of days"
                      className="input-field mt-2 text-sm"
                    />
                  )}
                </div>
              )}
            </div>

            {['suspend', 'block', 'restrict'].includes(action) && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason for Moderation <span className="text-red-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input-field text-sm mb-2"
                >
                  <option value="">Select a common violation reason or type below...</option>
                  <option value="Repeated customer complaints">Repeated customer complaints</option>
                  <option value="Fraudulent activity">Fraudulent activity</option>
                  <option value="Fake service listing">Fake service listing</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Misconduct">Misconduct</option>
                  <option value="Repeated cancellation">Repeated cancellation</option>
                  <option value="Incorrect pricing">Incorrect pricing</option>
                  <option value="Violation of marketplace policies">Violation of marketplace policies</option>
                </select>
                <textarea
                  rows="2"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide detailed justification for audit records..."
                  className="input-field text-sm"
                  required
                ></textarea>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`btn-primary text-sm ${
                  action === 'restore'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSubmitting ? 'Enforcing...' : `Apply ${action.toUpperCase()} to User Account`}
              </button>
            </div>
          </form>

          {/* User's Specific Moderation History */}
          {userProfile.moderationHistory?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <History size={14} /> Moderation Trail for User ({userProfile.moderationHistory.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {userProfile.moderationHistory.map((h) => (
                  <div key={h._id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">{h.action} by {h.adminName}</span>
                      <span className="text-gray-400">{formatDate(h.createdAt)}</span>
                    </div>
                    <p className="text-gray-600 mt-1">Reason: <span className="font-medium text-gray-800">{h.reason}</span></p>
                    <p className="text-gray-400 mt-0.5">Duration: {h.duration} • Status changed: {h.previousStatus} → {h.newStatus}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Global Suspension & Moderation History Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <History size={18} className="text-primary-600" /> Platform Moderation History & Audit Trail
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Immutable chronological record of all account suspensions, blocks, and restorations.
            </p>
          </div>
          <button onClick={fetchGlobalHistory} className="btn-secondary py-1 px-3 text-xs flex items-center gap-1">
            <RefreshCw size={14} className={historyLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 font-semibold uppercase tracking-wider text-gray-500">
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Target User</th>
                <th className="py-3 px-4">Target Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Enforcing Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historyLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-400">
                    Loading moderation audit records...
                  </td>
                </tr>
              ) : historyList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-400">
                    No moderation actions have been recorded yet.
                  </td>
                </tr>
              ) : (
                historyList.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50/60">
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-900">{entry.targetUserName}</p>
                      <p className="text-[11px] text-gray-400 font-mono">{entry.targetUserId}</p>
                    </td>

                    <td className="py-3 px-4 uppercase font-semibold text-gray-600">
                      {entry.targetUserRole}
                    </td>

                    <td className="py-3 px-4 font-bold">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          ['SUSPEND', 'BLOCK'].includes(entry.action)
                            ? 'bg-red-100 text-red-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {entry.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-gray-600 capitalize">
                      {entry.duration || 'N/A'}
                    </td>

                    <td className="py-3 px-4 text-gray-700 max-w-xs truncate" title={entry.reason}>
                      {entry.reason}
                    </td>

                    <td className="py-3 px-4 text-gray-600">
                      <span className="font-medium text-gray-900">{entry.adminName}</span>
                      <span className="block text-[11px] text-gray-400">{entry.adminEmail}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* History Pagination */}
        {historyPagination.pages > 1 && (
          <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div>
              Page <span className="font-semibold">{historyPage}</span> of {historyPagination.pages} ({historyPagination.total} records)
            </div>
            <div className="flex gap-2">
              <button
                disabled={historyPage <= 1}
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                className="btn-secondary py-1 px-2.5 text-xs disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={historyPage >= historyPagination.pages}
                onClick={() => setHistoryPage((p) => Math.min(historyPagination.pages, p + 1))}
                className="btn-secondary py-1 px-2.5 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
