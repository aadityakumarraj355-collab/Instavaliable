import { useState, useEffect } from 'react'
import {
  MessageSquare,
  Search,
  RefreshCw,
  Star,
  Eye,
  EyeOff,
  Flag,
  CheckCircle,
  AlertTriangle,
  X,
  Filter,
} from 'lucide-react'
import { feedbackService } from '../../services/feedbackService'
import { formatDate } from '../../utils/helpers'

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })

  // Moderation modal
  const [moderatingItem, setModeratingItem] = useState(null)
  const [newStatus, setNewStatus] = useState('hidden')
  const [moderationReason, setModerationReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' })

  const fetchFeedbacks = async () => {
    setLoading(true)
    try {
      const res = await feedbackService.getAdminFeedbacks({
        page,
        limit: 12,
        search,
        status: statusFilter || undefined,
      })
      if (res.data?.success) {
        setFeedbacks(res.data.data.feedbacks || [])
        setPagination(res.data.data.pagination || { total: 0, pages: 1 })
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load feedbacks',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedbacks()
  }, [page, statusFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchFeedbacks()
  }

  const openModerateModal = (item, targetStatus) => {
    setModeratingItem(item)
    setNewStatus(targetStatus)
    setModerationReason('')
  }

  const handleModerateSubmit = async (e) => {
    e.preventDefault()
    if (newStatus === 'hidden' && (!moderationReason || !moderationReason.trim())) {
      setFeedbackMsg({ type: 'error', text: 'A reason is strictly required to hide customer feedback.' })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await feedbackService.moderateFeedback(moderatingItem._id, {
        status: newStatus,
        moderationReason,
      })
      if (res.data?.success) {
        setFeedbackMsg({ type: 'success', text: `Feedback marked as ${newStatus}` })
        setModeratingItem(null)
        fetchFeedbacks()
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update feedback status',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="text-primary-600" /> Customer Feedback & Review Moderation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review verified ratings from completed bookings, inspect flagged reviews, and moderate visibility while preserving audit integrity.
          </p>
        </div>
        <button onClick={fetchFeedbacks} className="btn-secondary flex items-center gap-2 self-start sm:self-auto">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {feedbackMsg.text && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between ${
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
              placeholder="Search by Booking ID, Provider ID, or Customer ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn-primary shrink-0">Search</button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <label className="text-xs font-semibold text-gray-500 uppercase">Visibility:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="input-field py-1.5 text-sm"
          >
            <option value="">All Feedbacks</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
      </div>

      {/* Feedbacks Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-gray-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
            <p>Loading customer reviews...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-xl border border-gray-200 p-6">
            No customer feedback records found.
          </div>
        ) : (
          feedbacks.map((f) => (
            <div
              key={f._id}
              className={`bg-white rounded-xl border p-5 shadow-sm flex flex-col justify-between transition-all ${
                f.status === 'hidden'
                  ? 'border-gray-200 bg-gray-50/70 opacity-75'
                  : f.status === 'flagged'
                  ? 'border-amber-300 bg-amber-50/30'
                  : 'border-gray-200 hover:border-primary-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={15}
                        className={star <= f.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                      />
                    ))}
                    <span className="text-xs font-bold text-gray-900 ml-1">{f.rating}/5</span>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      f.status === 'visible'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : f.status === 'hidden'
                        ? 'bg-gray-100 text-gray-600 border-gray-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {f.status}
                  </span>
                </div>

                <div className="mt-3">
                  <p className="text-sm text-gray-800 italic leading-relaxed">
                    "{f.message}"
                  </p>
                </div>

                {f.moderationReason && f.status === 'hidden' && (
                  <div className="mt-3 p-2 rounded bg-red-50 border border-red-100 text-[11px] text-red-700">
                    <span className="font-bold">Moderation Note:</span> {f.moderationReason}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-medium text-gray-800">{f.clientId?.name || 'Customer'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Provider:</span>
                  <span className="font-medium text-gray-800">{f.workerId?.name || 'Professional'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service:</span>
                  <span className="font-medium text-gray-800 truncate max-w-[180px]">{f.serviceId?.title || 'Service'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{formatDate(f.createdAt)}</span>
                </div>
                <div className="flex justify-between font-mono text-[10px] text-gray-400">
                  <span>Ref:</span>
                  <span>{f.bookingId?.requestId || f.bookingId?._id}</span>
                </div>

                {/* Moderation Controls */}
                <div className="pt-2 flex justify-end gap-1.5 border-t border-gray-100">
                  {f.status !== 'visible' && (
                    <button
                      onClick={() => openModerateModal(f, 'visible')}
                      className="px-2 py-1 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1"
                    >
                      <Eye size={12} /> Make Visible
                    </button>
                  )}
                  {f.status !== 'flagged' && (
                    <button
                      onClick={() => openModerateModal(f, 'flagged')}
                      className="px-2 py-1 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 flex items-center gap-1"
                    >
                      <Flag size={12} /> Flag
                    </button>
                  )}
                  {f.status !== 'hidden' && (
                    <button
                      onClick={() => openModerateModal(f, 'hidden')}
                      className="px-2 py-1 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 flex items-center gap-1"
                    >
                      <EyeOff size={12} /> Hide Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="p-4 bg-white rounded-xl border border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <div>
            Page <span className="font-semibold text-gray-900">{page}</span> of {pagination.pages} ({pagination.total} total reviews)
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

      {/* Moderate Feedback Modal */}
      {moderatingItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setModeratingItem(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-gray-900 mb-2">
              Update Feedback Visibility: {newStatus.toUpperCase()}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Original Rating: <span className="font-bold text-amber-500">{moderatingItem.rating} ★</span> by{' '}
              <span className="font-bold text-gray-800">{moderatingItem.clientId?.name}</span>
            </p>

            <form onSubmit={handleModerateSubmit} className="space-y-4">
              {newStatus === 'hidden' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Moderation Justification <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={moderationReason}
                    onChange={(e) => setModerationReason(e.target.value)}
                    className="input-field text-sm mb-2"
                  >
                    <option value="">Select reason...</option>
                    <option value="Contains abusive or profane language">Contains abusive or profane language</option>
                    <option value="Personal harassment or private information exposed">Personal harassment or private information exposed</option>
                    <option value="Commercial spam or competitor tampering">Commercial spam or competitor tampering</option>
                    <option value="Violates marketplace community guidelines">Violates marketplace community guidelines</option>
                  </select>
                  <textarea
                    rows="3"
                    value={moderationReason}
                    onChange={(e) => setModerationReason(e.target.value)}
                    placeholder="Enter reason for audit record..."
                    className="input-field text-sm"
                    required
                  ></textarea>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModeratingItem(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`btn-primary text-xs ${
                    newStatus === 'visible'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : newStatus === 'hidden'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {isSubmitting ? 'Updating...' : `Set as ${newStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
