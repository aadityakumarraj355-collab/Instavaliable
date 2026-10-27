import { useEffect, useState } from 'react'
import { adminService } from '../../services/adminService'
import { formatDate, formatCurrency, getStatusColor } from '../../utils/helpers'
import Badge from '../../components/Badge'
import Modal from '../../components/Modal'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import { CalendarCheck, Clock, MapPin, Phone, FileText, AlertCircle, User, Wrench } from 'lucide-react'
import { WhatsAppIcon } from '../../components/WhatsAppButton'
import { buildWhatsAppLink } from '../../utils/whatsapp'

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setLoading(true)
    adminService.getBookings(statusFilter ? { status: statusFilter } : {})
      .then(({ data }) => setBookings(data.data.bookings))
      .finally(() => setLoading(false))
  }, [statusFilter])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Bookings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Oversee all platform service requests and WhatsApp bookings.</p>
        </div>
        <select className="input-field w-auto text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {['pending', 'accepted', 'rejected', 'completed', 'cancelled'].map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
      </div>

      {loading ? <LoadingSpinner className="py-20" /> : bookings.length === 0 ? (
        <EmptyState title="No bookings found" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Request ID', 'Service', 'Client', 'Worker', 'Date', 'Price', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => {
                  const reqId = b.requestId || `INS-2026-${b._id?.slice(-6).toUpperCase()}`
                  return (
                    <tr key={b._id} onClick={() => setSelected(b)}
                      className="hover:bg-emerald-50/50 cursor-pointer transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-xs text-emerald-800">
                        {reqId}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[160px] truncate">{b.serviceId?.title}</td>
                      <td className="px-4 py-3 text-gray-500">{b.clientId?.name}</td>
                      <td className="px-4 py-3 text-gray-500">{b.workerId?.name}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(b.date)}</td>
                      <td className="px-4 py-3 text-emerald-600 font-medium">
                        {b.serviceId?.price ? formatCurrency(b.serviceId.price) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusColor(b.status)}>{b.status}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Booking Details">
        {selected && (
          <div className="space-y-4">
            {/* Request ID Banner */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Request ID</span>
                <p className="font-mono font-bold text-gray-900 text-base">
                  {selected.requestId || `INS-2026-${selected._id?.slice(-6).toUpperCase()}`}
                </p>
              </div>
              <Badge className={getStatusColor(selected.status)}>{selected.status}</Badge>
            </div>

            {/* Service */}
            <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl">
              <Wrench size={16} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Service</p>
                <p className="font-semibold text-gray-900">{selected.serviceId?.title}</p>
                <p className="text-xs text-gray-500">{selected.serviceId?.category} · {selected.serviceId?.price ? formatCurrency(selected.serviceId.price) : '—'}</p>
              </div>
            </div>

            {/* Client & Worker */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><User size={11} /> Client</p>
                <p className="font-medium text-gray-900 text-sm">{selected.clientId?.name}</p>
                <p className="text-xs text-gray-500">{selected.clientId?.email}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><User size={11} /> Worker</p>
                <p className="font-medium text-gray-900 text-sm">{selected.workerId?.name}</p>
                <p className="text-xs text-gray-500">{selected.workerId?.email}</p>
              </div>
            </div>

            {/* Date / Time / Phone / Address */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2 text-gray-600">
                <CalendarCheck size={14} className="mt-0.5 text-emerald-600 shrink-0" />
                <div><p className="text-xs text-gray-400">Date</p><p>{formatDate(selected.date)}</p></div>
              </div>
              {selected.scheduledTime && (
                <div className="flex items-start gap-2 text-gray-600">
                  <Clock size={14} className="mt-0.5 text-emerald-600 shrink-0" />
                  <div><p className="text-xs text-gray-400">Time</p><p>{selected.scheduledTime}</p></div>
                </div>
              )}
              {selected.phone && (
                <div className="flex items-start gap-2 text-gray-600">
                  <Phone size={14} className="mt-0.5 text-emerald-600 shrink-0" />
                  <div><p className="text-xs text-gray-400">Phone</p><p>{selected.phone}</p></div>
                </div>
              )}
              {selected.address && (
                <div className="flex items-start gap-2 text-gray-600 col-span-2">
                  <MapPin size={14} className="mt-0.5 text-emerald-600 shrink-0" />
                  <div><p className="text-xs text-gray-400">Address</p><p>{selected.address}</p></div>
                </div>
              )}
            </div>

            {/* Notes */}
            {selected.notes && (
              <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
                <div className="flex items-center gap-1.5 text-amber-800 text-xs font-semibold mb-1">
                  <AlertCircle size={13} /> Details
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line">{selected.notes}</p>
              </div>
            )}

            {/* WhatsApp direct actions */}
            {selected.phone && (
              <div className="pt-2">
                <a
                  href={buildWhatsAppLink(
                    selected.phone,
                    `Hello! This is Instavaliable Admin regarding booking ${selected.requestId || ''} for "${selected.serviceId?.title}".`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-semibold transition-all"
                >
                  <WhatsAppIcon size={14} />
                  <span>WhatsApp Contact ({selected.phone})</span>
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
