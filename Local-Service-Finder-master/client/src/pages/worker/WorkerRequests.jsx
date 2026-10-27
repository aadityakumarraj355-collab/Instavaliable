import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { bookingService } from '../../services/bookingService'
import { socket } from '../../services/socket'
import { formatDate, getStatusColor } from '../../utils/helpers'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { CalendarCheck, Phone, MapPin, Clock, FileText, AlertCircle, Hash } from 'lucide-react'
import { WhatsAppIcon } from '../../components/WhatsAppButton'
import { buildWhatsAppLink, DEFAULT_WHATSAPP_NUMBER } from '../../utils/whatsapp'

export default function WorkerRequests() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [selected, setSelected] = useState(null)

  const fetchBookings = useCallback(() => {
    bookingService
      .getAll()
      .then(({ data }) => setBookings(data.data.bookings))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchBookings()

    const onNew = ({ booking }) => {
      if (booking) {
        setBookings((prev) => [booking, ...prev])
      } else {
        fetchBookings()
      }
    }

    socket.on('new_booking', onNew)
    return () => socket.off('new_booking', onNew)
  }, [fetchBookings])

  const handleStatus = async (id, status) => {
    setUpdating(id + status)
    try {
      await bookingService.updateStatus(id, status)
      toast.success(`Booking ${status}`)
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status } : b))
      )
      setSelected((prev) => (prev?._id === id ? { ...prev, status } : prev))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <LoadingSpinner className="py-20" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Incoming Service Requests</h1>
        <p className="text-gray-500 text-sm mt-1">
          Review, accept, and message customers directly via WhatsApp.
        </p>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No requests yet"
          description="Service requests from nearby clients will appear here automatically."
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const displayId = b.requestId || `INS-2026-${b._id?.slice(-6).toUpperCase()}`
            return (
              <div
                key={b._id}
                onClick={() => setSelected(b)}
                className="card p-5 cursor-pointer hover:shadow-md hover:border-emerald-300 border border-transparent transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                      {b.clientId?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {displayId}
                        </span>
                        <p className="font-bold text-gray-900 text-sm">{b.serviceId?.title}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Client: <span className="font-medium text-gray-700">{b.clientId?.name}</span> · Scheduled: {formatDate(b.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(b.status)}>{b.status}</Badge>
                    <span className="text-xs text-emerald-600 font-semibold hidden sm:inline">Details →</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Booking Request Overview">
        {selected && (
          <div className="space-y-4">
            {/* Request ID Header */}
            <div className="flex items-center justify-between p-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Booking Request ID</span>
                <p className="font-mono font-bold text-lg text-gray-900">
                  {selected.requestId || `INS-2026-${selected._id?.slice(-6).toUpperCase()}`}
                </p>
              </div>
              <Badge className={getStatusColor(selected.status)}>{selected.status}</Badge>
            </div>

            {/* Client info */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-800 font-bold">
                {selected.clientId?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{selected.clientId?.name}</p>
                <p className="text-xs text-gray-500">{selected.clientId?.email}</p>
              </div>
              {selected.phone && (
                <span className="text-xs font-medium text-gray-600 bg-white px-2.5 py-1 rounded-md border border-gray-200">
                  {selected.phone}
                </span>
              )}
            </div>

            {/* Date / Time / Address */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2 text-gray-600">
                <CalendarCheck size={15} className="mt-0.5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-medium">Date</p>
                  <p className="font-medium text-gray-800">{formatDate(selected.date)}</p>
                </div>
              </div>
              {selected.scheduledTime && (
                <div className="flex items-start gap-2 text-gray-600">
                  <Clock size={15} className="mt-0.5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Time</p>
                    <p className="font-medium text-gray-800">{selected.scheduledTime}</p>
                  </div>
                </div>
              )}
              {selected.address && (
                <div className="flex items-start gap-2 text-gray-600 col-span-2">
                  <MapPin size={15} className="mt-0.5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Address</p>
                    <p className="text-gray-800 font-medium">{selected.address}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Issue card */}
            {selected.notes && (
              <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
                <div className="flex items-center gap-1.5 text-amber-800 text-xs font-semibold mb-1">
                  <AlertCircle size={13} /> Job Request Details
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {selected.notes.split('\n\n')[0]}
                </p>
              </div>
            )}

            {/* Secondary notes */}
            {selected.notes?.includes('\n\n') && (
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                <div className="flex items-center gap-1.5 text-blue-800 text-xs font-semibold mb-1">
                  <FileText size={13} /> Additional Notes
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {selected.notes.split('\n\n').slice(1).join('\n\n')}
                </p>
              </div>
            )}

            {/* WhatsApp Client shortcut */}
            {selected.phone && (
              <div className="pt-2">
                <a
                  href={buildWhatsAppLink(
                    selected.phone,
                    `Hello ${selected.clientId?.name || 'Customer'}! I am reaching out from Instavaliable regarding your booking request [${selected.requestId || 'INS-2026'}] for "${selected.serviceId?.title}".`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-sm shadow-sm transition-all"
                >
                  <WhatsAppIcon size={16} />
                  <span>Chat with Client on WhatsApp</span>
                </a>
              </div>
            )}

            {/* Actions row: accept/reject/complete */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-400 font-medium">Update status:</span>
              <div className="flex gap-2">
                {selected.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleStatus(selected._id, 'accepted')}
                      loading={updating === selected._id + 'accepted'}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleStatus(selected._id, 'rejected')}
                      loading={updating === selected._id + 'rejected'}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {selected.status === 'accepted' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleStatus(selected._id, 'completed')}
                    loading={updating === selected._id + 'completed'}
                  >
                    Mark as Completed
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
