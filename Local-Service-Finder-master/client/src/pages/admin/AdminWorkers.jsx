import { useState, useEffect } from 'react'
import {
  Briefcase,
  Search,
  RefreshCw,
  ShieldAlert,
  CheckCircle,
  Star,
  Eye,
  X,
  AlertTriangle,
  Award,
  Layers,
} from 'lucide-react'
import { adminService } from '../../services/adminService'
import { formatDate, formatCurrency, getAccountStatusColor, CATEGORIES } from '../../utils/helpers'

export default function AdminWorkers() {
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [workerDetail, setWorkerDetail] = useState(null)

  // Moderation Modal state
  const [moderationTarget, setModerationTarget] = useState(null)
  const [moderationAction, setModerationAction] = useState('suspend')
  const [moderationReason, setModerationReason] = useState('')
  const [moderationDuration, setModerationDuration] = useState('7 days')
  const [customDays, setCustomDays] = useState('14')
  const [modSubmitting, setModSubmitting] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' })

  const fetchWorkers = async () => {
    setLoading(true)
    try {
      const res = await adminService.getWorkers({
        page,
        limit: 10,
        search,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      })
      if (res.data?.success) {
        setWorkers(res.data.data.workers || [])
        setPagination(res.data.data.pagination || { total: 0, pages: 1 })
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load service providers',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkers()
  }, [page, statusFilter, categoryFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchWorkers()
  }

  const handleVerify = async (workerId) => {
    try {
      const res = await adminService.verifyWorker(workerId)
      if (res.data?.success) {
        setFeedbackMsg({ type: 'success', text: 'Service provider verified and granted verified badge' })
        fetchWorkers()
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to verify worker',
      })
    }
  }

  const handleViewDetail = async (worker) => {
    setSelectedWorker(worker)
    setDetailLoading(true)
    try {
      const res = await adminService.getUserByIdDetail(worker._id)
      if (res.data?.success) {
        setWorkerDetail(res.data.data)
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load provider profile details',
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
        setFeedbackMsg({ type: 'success', text: `Provider account updated to ${res.data.data.user.accountStatus}` })
        setModerationTarget(null)
        fetchWorkers()
        if (selectedWorker && selectedWorker._id === moderationTarget._id) {
          handleViewDetail(moderationTarget)
        }
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to moderate provider account',
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
            <Briefcase className="text-primary-600" /> Service Provider Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review service professionals, inspect marketplace service listings, verify badges, and enforce account moderation.
          </p>
        </div>
        <button onClick={fetchWorkers} className="btn-secondary flex items-center gap-2 self-start sm:self-auto">
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
              placeholder="Search by provider name, email, phone, or Provider ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn-primary shrink-0">Search</button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPage(1)
            }}
            className="input-field py-1.5 text-sm"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

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

      {/* Providers Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="py-3.5 px-4">Provider Details</th>
                <th className="py-3.5 px-4">Provider ID</th>
                <th className="py-3.5 px-4">Services & INR Pricing</th>
                <th className="py-3.5 px-4">Rating & Completed</th>
                <th className="py-3.5 px-4">Registered</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                    <p>Loading service providers...</p>
                  </td>
                </tr>
              ) : workers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400">
                    No service providers found matching your criteria.
                  </td>
                </tr>
              ) : (
                workers.map((worker) => {
                  const status = worker.accountStatus || (worker.isSuspended ? 'suspended' : 'active')
                  return (
                    <tr key={worker._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center shrink-0">
                            {worker.name?.[0]?.toUpperCase() || 'W'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-gray-900 truncate">{worker.name}</p>
                              {worker.isVerified && (
                                <span title="Verified Professional" className="text-blue-600 shrink-0">
                                  <CheckCircle size={14} className="fill-blue-50" />
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{worker.email}</p>
                            <p className="text-xs text-gray-400 truncate">{worker.phone || 'No phone'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-gray-500">
                        {worker._id}
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        {worker.categories?.length > 0 ? (
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-1">
                              {worker.categories.slice(0, 2).map((cat) => (
                                <span key={cat} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px] font-medium">
                                  {cat}
                                </span>
                              ))}
                              {worker.categories.length > 2 && (
                                <span className="text-[11px] text-gray-400">+{worker.categories.length - 2}</span>
                              )}
                            </div>
                            {worker.priceRange && (
                              <p className="text-gray-900 font-semibold">
                                {formatCurrency(worker.priceRange.min)}
                                {worker.priceRange.min !== worker.priceRange.max && ` – ${formatCurrency(worker.priceRange.max)}`}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No services listed</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star size={14} className="fill-amber-400" />
                          <span>{worker.rating ? worker.rating.toFixed(1) : 'New'}</span>
                          <span className="text-gray-400 font-normal">({worker.reviewsCount || 0})</span>
                        </div>
                        <p className="text-gray-500 mt-0.5">
                          <span className="font-semibold text-gray-900">{worker.completedBookings || 0}</span> completed
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {formatDate(worker.createdAt)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize border ${getAccountStatusColor(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                        {worker.suspensionDuration && status !== 'active' && (
                          <span className="block text-[11px] text-gray-400 mt-0.5">
                            {worker.suspensionDuration}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewDetail(worker)}
                            className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded"
                            title="View Full Profile, Services & Reviews"
                          >
                            <Eye size={16} />
                          </button>

                          {!worker.isVerified && (
                            <button
                              onClick={() => handleVerify(worker._id)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="Verify Provider"
                            >
                              <Award size={16} />
                            </button>
                          )}

                          {status === 'active' ? (
                            <>
                              <button
                                onClick={() => openModerationModal(worker, 'suspend')}
                                className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200"
                              >
                                Suspend
                              </button>
                              <button
                                onClick={() => openModerationModal(worker, 'block')}
                                className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200"
                              >
                                Block
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => openModerationModal(worker, 'restore')}
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

      {/* Provider Detail Modal */}
      {selectedWorker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setSelectedWorker(null)
                setWorkerDetail(null)
              }}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 font-bold text-2xl flex items-center justify-center">
                {selectedWorker.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{selectedWorker.name}</h2>
                  {selectedWorker.isVerified && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      <CheckCircle size={12} /> Verified
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">ID: {selectedWorker._id}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-semibold capitalize ${getAccountStatusColor(
                      selectedWorker.accountStatus || 'active'
                    )}`}
                  >
                    {selectedWorker.accountStatus || 'active'}
                  </span>
                </div>
              </div>
            </div>

            {detailLoading ? (
              <div className="py-12 text-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                <p>Loading provider profile details...</p>
              </div>
            ) : workerDetail ? (
              <div className="mt-5 space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Contact & Profile</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div>
                      <span className="text-gray-400 text-xs block">Email</span>
                      <span className="font-medium text-gray-800">{workerDetail.user.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs block">Phone</span>
                      <span className="font-medium text-gray-800">{workerDetail.user.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs block">Registered On</span>
                      <span className="font-medium text-gray-800">{formatDate(workerDetail.user.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs block">Rating</span>
                      <span className="font-medium text-amber-600 flex items-center gap-1">
                        <Star size={12} className="fill-amber-400" />
                        {workerDetail.profile?.rating || '0.0'} ({workerDetail.profile?.ratingCount || 0} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Services Listed */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Marketplace Services ({workerDetail.services?.length || 0})
                  </h3>
                  {workerDetail.services?.length === 0 ? (
                    <p className="text-xs text-gray-400">No active services listed.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                      {workerDetail.services?.map((s) => (
                        <div key={s._id} className="p-3 rounded-lg border border-gray-100 bg-white text-xs">
                          <p className="font-bold text-gray-900">{s.title}</p>
                          <p className="text-gray-500 mt-0.5">{s.category}</p>
                          <p className="text-primary-700 font-extrabold mt-1 text-sm">
                            {formatCurrency(s.price)}{' '}
                            <span className="text-[10px] text-gray-400 font-normal">({s.pricingType || 'fixed'})</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Customer Reviews */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Customer Reviews Received ({workerDetail.feedbacks?.length || 0})
                  </h3>
                  {workerDetail.feedbacks?.length === 0 ? (
                    <p className="text-xs text-gray-400">No customer feedback received yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-44 overflow-y-auto">
                      {workerDetail.feedbacks?.map((f) => (
                        <div key={f._id} className="p-2.5 rounded-lg border border-gray-100 bg-gray-50 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-900">{f.clientId?.name || 'Customer'}</span>
                            <span className="flex items-center text-amber-500 font-bold">
                              <Star size={12} className="fill-amber-400" /> {f.rating}/5
                            </span>
                          </div>
                          <p className="text-gray-600 mt-1 italic">"{f.message}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Moderation History */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Account Moderation Trail ({workerDetail.moderationHistory?.length || 0})
                  </h3>
                  {workerDetail.moderationHistory?.length === 0 ? (
                    <p className="text-xs text-gray-400">No previous moderation incidents.</p>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto">
                      {workerDetail.moderationHistory?.map((h) => (
                        <div key={h._id} className="p-2 rounded bg-gray-50 border border-gray-100 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-800">{h.action} by {h.adminName}</span>
                            <span className="text-gray-400">{formatDate(h.createdAt)}</span>
                          </div>
                          <p className="text-gray-600 mt-0.5">Reason: {h.reason}</p>
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
                  setSelectedWorker(null)
                  setWorkerDetail(null)
                }}
                className="btn-secondary text-xs"
              >
                Close
              </button>
              {selectedWorker.accountStatus !== 'active' ? (
                <button
                  onClick={() => openModerationModal(selectedWorker, 'restore')}
                  className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700"
                >
                  Restore Account
                </button>
              ) : (
                <button
                  onClick={() => openModerationModal(selectedWorker, 'suspend')}
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
                Moderate Provider: {moderationTarget.name}
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
                    <option value="Incorrect pricing">Incorrect pricing</option>
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
