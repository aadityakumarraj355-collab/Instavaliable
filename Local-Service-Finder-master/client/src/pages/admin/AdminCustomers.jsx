import { useState, useEffect } from 'react'
import {
  Users,
  Search,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  Calendar,
  Phone,
  Mail,
  FileText,
  Clock,
  Eye,
  AlertTriangle,
  X,
} from 'lucide-react'
import { adminService } from '../../services/adminService'
import { formatDate, getAccountStatusColor } from '../../utils/helpers'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [customerDetail, setCustomerDetail] = useState(null)

  // Moderation Modal state
  const [moderationTarget, setModerationTarget] = useState(null)
  const [moderationAction, setModerationAction] = useState('suspend')
  const [moderationReason, setModerationReason] = useState('')
  const [moderationDuration, setModerationDuration] = useState('7 days')
  const [customDays, setCustomDays] = useState('14')
  const [modSubmitting, setModSubmitting] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' })

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const res = await adminService.getCustomers({
        page,
        limit: 10,
        search,
        status: statusFilter || undefined,
      })
      if (res.data?.success) {
        setCustomers(res.data.data.customers || [])
        setPagination(res.data.data.pagination || { total: 0, pages: 1 })
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load customers',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [page, statusFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchCustomers()
  }

  const handleViewDetail = async (user) => {
    setSelectedCustomer(user)
    setDetailLoading(true)
    try {
      const res = await adminService.getUserByIdDetail(user._id)
      if (res.data?.success) {
        setCustomerDetail(res.data.data)
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load customer profile details',
      })
    } finally {
      setDetailLoading(false)
    }
  }

  const openModerationModal = (user, action = 'suspend') => {
    setModerationTarget(user)
    setModerationAction(action)
    setModerationReason('')
    setModerationDuration(action === 'block' ? 'permanent' : '7 days')
  }

  const handleModerateSubmit = async (e) => {
    e.preventDefault()
    if (!moderationReason && ['suspend', 'block', 'restrict'].includes(moderationAction)) {
      setFeedbackMsg({ type: 'error', text: 'Please specify a valid reason for this moderation action' })
      return
    }

    setModSubmitting(true)
    try {
      const payload = {
        action: moderationAction,
        reason: moderationReason,
        duration: moderationDuration,
        customDurationDays: moderationDuration === 'custom' ? customDays : undefined,
      }
      const res = await adminService.moderateUser(moderationTarget._id, payload)
      if (res.data?.success) {
        setFeedbackMsg({ type: 'success', text: `Customer account updated to ${res.data.data.user.accountStatus}` })
        setModerationTarget(null)
        fetchCustomers()
        if (selectedCustomer && selectedCustomer._id === moderationTarget._id) {
          handleViewDetail(moderationTarget)
        }
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to moderate customer account',
      })
    } finally {
      setModSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-primary-600" /> Customer Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View, search, inspect service requests, and moderate registered marketplace customers.
          </p>
        </div>
        <button onClick={fetchCustomers} className="btn-secondary flex items-center gap-2 self-start sm:self-auto">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {feedbackMsg.text && (
        <div
          className={`p-4 rounded-lg text-sm flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg({ type: '', text: '' })} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by customer name, email, phone, or Customer ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn-primary shrink-0">Search</button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <label className="text-xs font-semibold text-gray-500 uppercase">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="input-field py-1.5 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="blocked">Blocked</option>
            <option value="restricted">Restricted</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4">Customer ID</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Registered</th>
                <th className="py-3.5 px-4">Activity</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                    <p>Loading registered customers...</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400">
                    No registered customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const status = customer.accountStatus || (customer.isSuspended ? 'suspended' : 'active')
                  return (
                    <tr key={customer._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-50 text-primary-700 font-bold flex items-center justify-center shrink-0">
                            {customer.name?.[0]?.toUpperCase() || 'C'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
                            <p className="text-xs text-gray-500 truncate">{customer.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-gray-500">
                        {customer._id}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        <div>{customer.phone || 'No phone'}</div>
                        <div className="text-gray-400">{customer.location || 'No location'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {formatDate(customer.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-semibold text-gray-900">{customer.bookingCount || 0}</span> bookings
                        <span className="block text-gray-400">{customer.feedbackCount || 0} reviews</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize border ${getAccountStatusColor(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                        {customer.suspensionDuration && status !== 'active' && (
                          <span className="block text-[11px] text-gray-400 mt-0.5">
                            {customer.suspensionDuration}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewDetail(customer)}
                            className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded"
                            title="View Full Profile & Bookings"
                          >
                            <Eye size={16} />
                          </button>

                          {status === 'active' ? (
                            <>
                              <button
                                onClick={() => openModerationModal(customer, 'suspend')}
                                className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200"
                              >
                                Suspend
                              </button>
                              <button
                                onClick={() => openModerationModal(customer, 'block')}
                                className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200"
                              >
                                Block
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => openModerationModal(customer, 'restore')}
                              className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <div>
              Showing page <span className="font-semibold text-gray-900">{page}</span> of {pagination.pages} ({pagination.total} total)
            </div>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setSelectedCustomer(null)
                setCustomerDetail(null)
              }}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
              <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-700 font-bold text-2xl flex items-center justify-center">
                {selectedCustomer.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">ID: {selectedCustomer._id}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-semibold capitalize ${getAccountStatusColor(
                      selectedCustomer.accountStatus || 'active'
                    )}`}
                  >
                    {selectedCustomer.accountStatus || 'active'}
                  </span>
                </div>
              </div>
            </div>

            {detailLoading ? (
              <div className="py-12 text-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                <p>Loading customer profile and history...</p>
              </div>
            ) : customerDetail ? (
              <div className="mt-5 space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Account Details</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div>
                      <span className="text-gray-400 text-xs block">Email</span>
                      <span className="font-medium text-gray-800">{customerDetail.user.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs block">Phone</span>
                      <span className="font-medium text-gray-800">{customerDetail.user.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs block">Registered On</span>
                      <span className="font-medium text-gray-800">{formatDate(customerDetail.user.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs block">Location</span>
                      <span className="font-medium text-gray-800">{customerDetail.user.location || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Suspension Details if not active */}
                {customerDetail.user.accountStatus !== 'active' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle size={16} /> Account {customerDetail.user.accountStatus}
                    </p>
                    <p className="mt-1">Reason: {customerDetail.user.suspensionReason || 'No reason provided'}</p>
                    <p className="text-xs text-red-600 mt-0.5">Duration: {customerDetail.user.suspensionDuration || 'Permanent'}</p>
                  </div>
                )}

                {/* Booking History */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Recent Bookings ({customerDetail.bookings?.length || 0})
                  </h3>
                  {customerDetail.bookings?.length === 0 ? (
                    <p className="text-xs text-gray-400">No bookings placed yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {customerDetail.bookings?.map((b) => (
                        <div key={b._id} className="p-2.5 rounded-lg border border-gray-100 bg-white flex justify-between items-center text-xs">
                          <div>
                            <p className="font-semibold text-gray-800">{b.serviceId?.title || 'Service'}</p>
                            <p className="text-gray-400">Ref: {b.requestId} • Professional: {b.workerId?.name || 'Assigned'}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded font-medium capitalize bg-gray-100">{b.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Moderation History */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Account Moderation Trail ({customerDetail.moderationHistory?.length || 0})
                  </h3>
                  {customerDetail.moderationHistory?.length === 0 ? (
                    <p className="text-xs text-gray-400">No previous moderation incidents.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {customerDetail.moderationHistory?.map((h) => (
                        <div key={h._id} className="p-2.5 rounded bg-gray-50 border border-gray-100 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-800">{h.action} by {h.adminName}</span>
                            <span className="text-gray-400">{formatDate(h.createdAt)}</span>
                          </div>
                          <p className="text-gray-600 mt-1">Reason: {h.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedCustomer(null)
                  setCustomerDetail(null)
                }}
                className="btn-secondary text-xs"
              >
                Close
              </button>
              {selectedCustomer.accountStatus !== 'active' ? (
                <button
                  onClick={() => openModerationModal(selectedCustomer, 'restore')}
                  className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700"
                >
                  Restore Account
                </button>
              ) : (
                <button
                  onClick={() => openModerationModal(selectedCustomer, 'suspend')}
                  className="btn-primary text-xs bg-red-600 hover:bg-red-700"
                >
                  Suspend Account
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Moderation Action Modal */}
      {moderationTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setModerationTarget(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="text-red-600" size={24} />
              <h2 className="text-lg font-bold text-gray-900">
                Moderate Customer: {moderationTarget.name}
              </h2>
            </div>

            <form onSubmit={handleModerateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Moderation Action
                </label>
                <select
                  value={moderationAction}
                  onChange={(e) => setModerationAction(e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="suspend">Suspend Account (Temporary / Timed)</option>
                  <option value="block">Block Account (Permanent Lockdown)</option>
                  <option value="restrict">Restrict Account (Limited Access)</option>
                  <option value="restore">Restore Account (Active)</option>
                </select>
              </div>

              {['suspend', 'restrict'].includes(moderationAction) && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Suspension Duration
                  </label>
                  <select
                    value={moderationDuration}
                    onChange={(e) => setModerationDuration(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="24 hours">24 hours</option>
                    <option value="3 days">3 days</option>
                    <option value="7 days">7 days</option>
                    <option value="30 days">30 days</option>
                    <option value="custom">Custom Duration (in days)</option>
                    <option value="permanent">Permanent</option>
                  </select>

                  {moderationDuration === 'custom' && (
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      placeholder="Enter days"
                      className="input-field mt-2 text-sm"
                    />
                  )}
                </div>
              )}

              {['suspend', 'block', 'restrict'].includes(moderationAction) && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Reason for Action <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={moderationReason}
                    onChange={(e) => setModerationReason(e.target.value)}
                    className="input-field text-sm mb-2"
                  >
                    <option value="">Select standard reason or write custom...</option>
                    <option value="Repeated customer complaints">Repeated customer complaints</option>
                    <option value="Fraudulent activity">Fraudulent activity</option>
                    <option value="Fake service listing">Fake service listing</option>
                    <option value="Harassment">Harassment</option>
                    <option value="Misconduct">Misconduct</option>
                    <option value="Repeated cancellation">Repeated cancellation</option>
                    <option value="Violation of marketplace policies">Violation of marketplace policies</option>
                  </select>
                  <textarea
                    rows="3"
                    value={moderationReason}
                    onChange={(e) => setModerationReason(e.target.value)}
                    placeholder="Enter explicit reason for record..."
                    className="input-field text-sm"
                    required
                  ></textarea>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModerationTarget(null)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modSubmitting}
                  className={`btn-primary text-sm ${
                    moderationAction === 'restore' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {modSubmitting ? 'Applying...' : `Confirm ${moderationAction.toUpperCase()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
