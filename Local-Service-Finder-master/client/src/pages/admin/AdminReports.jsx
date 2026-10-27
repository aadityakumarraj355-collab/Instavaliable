import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  X,
  ShieldAlert,
  User,
  Briefcase,
  FileText,
} from 'lucide-react'
import { reportService } from '../../services/reportService'
import { adminService } from '../../services/adminService'
import { formatDate } from '../../utils/helpers'

export default function AdminReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })

  // Report resolution modal
  const [selectedReport, setSelectedReport] = useState(null)
  const [newStatus, setNewStatus] = useState('resolved')
  const [adminNotes, setAdminNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' })

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await reportService.getAdminReports({
        page,
        limit: 12,
        status: statusFilter || undefined,
      })
      if (res.data?.success) {
        setReports(res.data.data.reports || [])
        setPagination(res.data.data.pagination || { total: 0, pages: 1 })
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load safety reports',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [page, statusFilter])

  const openResolveModal = (rep) => {
    setSelectedReport(rep)
    setNewStatus(rep.status === 'pending' ? 'investigating' : 'resolved')
    setAdminNotes(rep.adminNotes || '')
  }

  const handleUpdateStatus = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await reportService.updateReportStatus(selectedReport._id, {
        status: newStatus,
        adminNotes,
      })
      if (res.data?.success) {
        setFeedbackMsg({ type: 'success', text: `Report status updated to ${newStatus}` })
        setSelectedReport(null)
        fetchReports()
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update report status',
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
            <AlertTriangle className="text-red-600" /> Service Provider Safety & Policy Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Investigate customer complaints regarding misconduct, fraud, incorrect pricing, and policy violations.
          </p>
        </div>
        <button onClick={fetchReports} className="btn-secondary flex items-center gap-2 self-start sm:self-auto">
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

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Filter by Investigation State
        </span>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="input-field py-1.5 text-sm max-w-xs"
        >
          <option value="">All States</option>
          <option value="pending">Pending Investigation</option>
          <option value="investigating">Under Investigation</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-gray-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
            <p>Loading provider reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-xl border border-gray-200 p-6">
            No safety reports found matching your criteria.
          </div>
        ) : (
          reports.map((rep) => (
            <div
              key={rep._id}
              className={`bg-white rounded-xl border p-5 shadow-sm flex flex-col justify-between transition-all ${
                rep.status === 'pending'
                  ? 'border-red-200 bg-red-50/20'
                  : rep.status === 'investigating'
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-gray-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
                    {rep.category}
                  </span>

                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      rep.status === 'pending'
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : rep.status === 'investigating'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : rep.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {rep.status}
                  </span>
                </div>

                <div className="mt-3">
                  <p className="text-xs text-gray-800 font-medium leading-relaxed bg-white p-3 rounded-lg border border-gray-100">
                    "{rep.description}"
                  </p>
                </div>

                {rep.adminNotes && (
                  <div className="mt-2.5 p-2 rounded bg-gray-50 border border-gray-100 text-[11px] text-gray-700">
                    <span className="font-bold text-gray-900">Admin Notes:</span> {rep.adminNotes}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Reported Provider:</span>
                  <span className="font-semibold text-gray-900">{rep.providerId?.name || 'Professional'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Provider Status:</span>
                  <span className="font-medium capitalize text-gray-700">{rep.providerId?.accountStatus || 'active'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Reporting Client:</span>
                  <span className="font-medium text-gray-800">{rep.reporterId?.name || 'Customer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span>{formatDate(rep.createdAt)}</span>
                </div>
                {rep.bookingId?.requestId && (
                  <div className="flex justify-between font-mono text-[11px] text-gray-400">
                    <span>Booking Ref:</span>
                    <span>{rep.bookingId.requestId}</span>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                  <button
                    onClick={() => openResolveModal(rep)}
                    className="btn-secondary py-1 px-3 text-xs"
                  >
                    Investigate & Update
                  </button>
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
            Page <span className="font-semibold text-gray-900">{page}</span> of {pagination.pages} ({pagination.total} total reports)
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

      {/* Investigation / Resolution Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-gray-900 mb-1">
              Investigate Report
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Against: <span className="font-bold text-gray-800">{selectedReport.providerId?.name}</span> • Category: <span className="font-semibold text-red-600">{selectedReport.category}</span>
            </p>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Investigation Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="investigating">Under Investigation</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Investigation & Moderation Notes
                </label>
                <textarea
                  rows="3"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Document findings, communications, or penalties enforced..."
                  className="input-field text-sm"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Save Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
