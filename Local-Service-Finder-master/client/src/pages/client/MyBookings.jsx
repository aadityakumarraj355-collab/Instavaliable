import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { bookingService } from '../../services/bookingService'
import { feedbackService } from '../../services/feedbackService'
import { reportService } from '../../services/reportService'
import { socket } from '../../services/socket'
import { formatDate, formatCurrency, getStatusColor } from '../../utils/helpers'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
  CalendarCheck,
  Phone,
  MapPin,
  Clock,
  FileText,
  Star,
  Flag,
  CheckCircle,
} from 'lucide-react'
import { WhatsAppIcon } from '../../components/WhatsAppButton'
import { getBookingWhatsAppUrl, DEFAULT_WHATSAPP_NUMBER } from '../../utils/whatsapp'
import { useAuthStore } from '../../store/authStore'

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
}

const REPORT_CATEGORIES = [
  'Poor service',
  'Misconduct',
  'Fraud',
  'Harassment',
  'Incorrect pricing',
  'Unprofessional behavior',
  'Other',
]

export default function MyBookings() {
  const { user } = useAuthStore()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(null)

  // Feedback Modal State
  const [feedbackModal, setFeedbackModal] = useState(false)
  const [selectedBookingForFeedback, setSelectedBookingForFeedback] = useState(null)
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  // Report Modal State
  const [reportModal, setReportModal] = useState(false)
  const [selectedBookingForReport, setSelectedBookingForReport] = useState(null)
  const [reportCategory, setReportCategory] = useState(REPORT_CATEGORIES[0])
  const [reportDescription, setReportDescription] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)

  const fetchBookings = useCallback(() => {
    bookingService
      .getAll()
      .then(({ data }) => setBookings(data.data.bookings || []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchBookings()

    const onStatus = ({ bookingId, status }) => {
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status } : b))
      )
    }
    socket.on('booking_status', onStatus)
    return () => socket.off('booking_status', onStatus)
  }, [fetchBookings])

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return
    setCancelling(id)
    try {
      await bookingService.cancel(id)
      toast.success('Booking cancelled')
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: 'cancelled' } : b))
      )
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel')
    } finally {
      setCancelling(null)
    }
  }

  const openFeedbackModal = (b) => {
    setSelectedBookingForFeedback(b)
    setRating(5)
    setHoverRating(0)
    setFeedbackMessage('')
    setFeedbackModal(true)
  }

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault()
    if (!selectedBookingForFeedback) return
    setSubmittingFeedback(true)
    try {
      await feedbackService.submitFeedback({
        bookingId: selectedBookingForFeedback._id,
        rating,
        message: feedbackMessage.trim(),
      })
      toast.success('Thank you! Your verified feedback has been submitted.')
      setBookings((prev) =>
        prev.map((b) =>
          b._id === selectedBookingForFeedback._id ? { ...b, hasFeedback: true } : b
        )
      )
      setFeedbackModal(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const openReportModal = (b) => {
    setSelectedBookingForReport(b)
    setReportCategory(REPORT_CATEGORIES[0])
    setReportDescription('')
    setReportModal(true)
  }

  const handleReportSubmit = async (e) => {
    e.preventDefault()
    if (!selectedBookingForReport) return
    if (!reportDescription.trim()) {
      toast.error('Please provide details for your report')
      return
    }
    setSubmittingReport(true)
    try {
      await reportService.createReport({
        providerId: selectedBookingForReport.workerId?._id,
        bookingId: selectedBookingForReport._id,
        category: reportCategory,
        description: reportDescription.trim(),
      })
      toast.success('Report submitted. Our safety team and administrators will investigate.')
      setReportModal(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report')
    } finally {
      setSubmittingReport(false)
    }
  }

  if (loading) return <LoadingSpinner className="py-20" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Track and manage your service requests with direct WhatsApp communication and verified reviews.
        </p>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No bookings yet"
          description="Browse available services and request your first job."
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const displayRequestId = b.requestId || `INS-2026-${b._id?.slice(-6).toUpperCase()}`
            const whatsappUrl = getBookingWhatsAppUrl({
              phone: b.workerId?.phone || DEFAULT_WHATSAPP_NUMBER,
              requestId: displayRequestId,
              serviceTitle: b.serviceId?.title,
              clientName: user?.name,
              workerName: b.workerId?.name,
              date: formatDate(b.date),
              scheduledTime: b.scheduledTime,
              address: b.address,
              notes: b.notes,
            })

            return (
              <div
                key={b._id}
                className="card p-5 border border-gray-100 hover:border-emerald-200 transition-all shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 space-y-2.5">
                    {/* Header Row: Title + Request ID Badge + Status Badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                        {displayRequestId}
                      </span>
                      <h3 className="font-bold text-gray-900 text-base">{b.serviceId?.title}</h3>
                      <Badge className={getStatusColor(b.status)}>{b.status}</Badge>
                      {b.status === 'completed' && b.hasFeedback && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle size={12} /> Reviewed
                        </span>
                      )}
                    </div>

                    {/* Provider info with call & WhatsApp shortcut */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
                          {b.workerId?.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{b.workerId?.name}</span>
                      </div>

                      {b.workerId?.phone && (
                        <a
                          href={`tel:${b.workerId.phone}`}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
                        >
                          <Phone size={12} /> {b.workerId.phone}
                        </a>
                      )}

                      {/* WhatsApp Button */}
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#25D366] hover:text-[#20bd5a] bg-emerald-50/80 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg transition-colors border border-emerald-200/60"
                        title="Chat about this booking on WhatsApp"
                      >
                        <WhatsAppIcon size={13} />
                        <span>WhatsApp Chat</span>
                      </a>
                    </div>

                    {/* Schedule & Location */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarCheck size={13} className="text-emerald-600" />
                        {formatDate(b.date)}
                      </span>
                      {b.scheduledTime && (
                        <span className="flex items-center gap-1">
                          <Clock size={13} className="text-blue-600" />
                          {b.scheduledTime}
                        </span>
                      )}
                      {b.address && (
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-amber-600" />
                          {b.address}
                        </span>
                      )}
                    </div>

                    {/* Notes / Details */}
                    {b.notes && (
                      <p className="text-xs text-gray-500 flex items-start gap-1.5 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        <FileText size={13} className="mt-0.5 text-gray-400 shrink-0" />
                        <span className="italic">{b.notes}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions & Price */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    {b.serviceId?.price && (
                      <span className="font-extrabold text-emerald-600 text-lg">
                        {formatCurrency(b.serviceId.price)}
                      </span>
                    )}

                    {/* Cancel booking if pending or accepted */}
                    {['pending', 'accepted'].includes(b.status) && (
                      <Button
                        variant="danger"
                        size="sm"
                        loading={cancelling === b._id}
                        onClick={() => handleCancel(b._id)}
                      >
                        Cancel
                      </Button>
                    )}

                    {/* Rate & Review Button for completed bookings without feedback */}
                    {b.status === 'completed' && !b.hasFeedback && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openFeedbackModal(b)}
                        className="bg-amber-500 hover:bg-amber-600 border-none text-white shadow-sm"
                      >
                        <Star size={14} className="fill-current text-white mr-1" />
                        Rate & Review
                      </Button>
                    )}

                    {/* Report Provider button */}
                    <button
                      type="button"
                      onClick={() => openReportModal(b)}
                      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="Report an issue with this service or provider"
                    >
                      <Flag size={12} />
                      <span>Report</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Verified Feedback Modal */}
      <Modal
        isOpen={feedbackModal}
        onClose={() => setFeedbackModal(false)}
        title="Leave Verified Feedback"
      >
        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800">
            <span className="font-bold">Verified Completed Service:</span> Feedback can only be submitted for completed bookings. Your review helps maintain top-tier service on Instavaliable.
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Rating: {rating} Star{rating > 1 ? 's' : ''} — <span className="text-amber-600">{RATING_LABELS[rating]}</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = (hoverRating || rating) >= star
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      size={28}
                      className={active ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Feedback / Review Comments
            </label>
            <textarea
              rows={4}
              required
              className="input-field resize-none"
              placeholder="Tell us about the provider's professionalism, punctuality, quality of work, and pricing transparency..."
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              loading={submittingFeedback}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Submit Verified Feedback
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFeedbackModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Customer Report Modal */}
      <Modal
        isOpen={reportModal}
        onClose={() => setReportModal(false)}
        title="Report Service Provider"
      >
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
            <span className="font-bold">Instavaliable Marketplace Trust & Safety:</span> Reports are confidentially reviewed by Instavaliable Administrators. False reports are strictly prohibited.
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Reason / Category
            </label>
            <select
              className="input-field"
              value={reportCategory}
              onChange={(e) => setReportCategory(e.target.value)}
              required
            >
              {REPORT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Describe the Incident / Complaint
            </label>
            <textarea
              rows={4}
              required
              className="input-field resize-none"
              placeholder="Describe what happened in detail (e.g. date, conversation, discrepancy in pricing, behavioral issues)..."
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              loading={submittingReport}
              variant="danger"
              className="flex-1"
            >
              Submit Report
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setReportModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
