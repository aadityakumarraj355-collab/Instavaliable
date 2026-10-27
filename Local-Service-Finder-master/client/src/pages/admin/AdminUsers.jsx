import { useEffect, useState, useRef } from 'react'
import { Trash2, CheckCircle, ShieldCheck, Ban, ShieldOff, MoreVertical,
         User, Mail, Phone, MapPin, Globe, Clock, CalendarCheck, Briefcase, ChevronDown, ChevronUp, AlertCircle, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminService } from '../../services/adminService'
import { formatDate, formatCurrency, getStatusColor } from '../../utils/helpers'
import Modal from '../../components/Modal'
import Badge from '../../components/Badge'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'

function ActionsDropdown({ u, onVerify, onSuspend, onDelete }) {
  const [pos, setPos] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    if (!pos) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setPos(null) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pos])

  if (u.role === 'admin') return <span className="text-xs text-gray-400">—</span>

  const handleOpen = (e) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
  }

  return (
    <div ref={ref}>
      <button onClick={handleOpen}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
        <MoreVertical size={15} />
      </button>
      {pos && (
        <div style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999 }}
          className="w-36 bg-white border border-gray-200 rounded-lg shadow-xl py-1">
          {u.role === 'worker' && !u.isVerified && (
            <button onClick={(e) => { e.stopPropagation(); onVerify(u._id); setPos(null) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-green-600 hover:bg-green-50 whitespace-nowrap">
              <ShieldCheck size={13} /> Verify
            </button>
          )}
          {u.role === 'worker' && u.isVerified && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-green-600 opacity-60 cursor-default whitespace-nowrap">
              <CheckCircle size={13} /> Verified
            </div>
          )}
          <button onClick={(e) => { e.stopPropagation(); onSuspend(u._id, u.isSuspended); setPos(null) }}
            className={`flex items-center gap-2 w-full px-3 py-2 text-xs whitespace-nowrap ${u.isSuspended ? 'text-green-600 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'}`}>
            {u.isSuspended ? <><ShieldOff size={13} /> Unsuspend</> : <><Ban size={13} /> Suspend</>}
          </button>
          <hr className="my-1 border-gray-100" />
          <button onClick={(e) => { e.stopPropagation(); onDelete(u._id); setPos(null) }}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 whitespace-nowrap">
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('')
  const [acting, setActing] = useState(null)
  const [detail, setDetail] = useState(null)   // { user, bookings }
  const [detailLoading, setDetailLoading] = useState(false)
  const [expandedBooking, setExpandedBooking] = useState(null)

  const fetchUsers = () => {
    adminService.getUsers(roleFilter ? { role: roleFilter } : {})
      .then(({ data }) => setUsers(data.data.users))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [roleFilter])

  const openDetail = async (id) => {
    setDetail({ user: null, bookings: [] })
    setDetailLoading(true)
    try {
      const { data } = await adminService.getUserDetail(id)
      setDetail(data.data)
    } catch {
      toast.error('Failed to load user details')
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return
    setActing(id + 'del')
    try {
      await adminService.deleteUser(id)
      toast.success('User deleted')
      setDetail(null)
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setActing(null) }
  }

  const handleVerify = async (id) => {
    setActing(id + 'ver')
    try {
      await adminService.verifyWorker(id)
      toast.success('Worker verified')
      fetchUsers()
    } catch { toast.error('Failed to verify') }
    finally { setActing(null) }
  }

  const handleSuspend = async (id, isSuspended) => {
    setActing(id + 'sus')
    try {
      await adminService.suspendUser(id)
      toast.success(isSuspended ? 'User unsuspended' : 'User suspended')
      fetchUsers()
    } catch { toast.error('Failed') }
    finally { setActing(null) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
        <select className="input-field w-auto text-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="client">Clients</option>
          <option value="worker">Workers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {loading ? <LoadingSpinner className="py-20" /> : users.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name', 'Email', 'Role', 'Status', 'Location', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id} onClick={() => openDetail(u._id)}
                    className="hover:bg-primary-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'worker' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      {u.isSuspended
                        ? <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Suspended</span>
                        : <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Active</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.location || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <ActionsDropdown u={u} onVerify={handleVerify} onSuspend={handleSuspend} onDelete={handleDelete} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      <Modal isOpen={!!detail} onClose={() => { setDetail(null); setExpandedBooking(null) }} title="User Details">
        {detailLoading ? (
          <LoadingSpinner className="py-10" />
        ) : detail?.user && (
          <div className="space-y-5">
            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-200 flex items-center justify-center text-2xl font-bold text-primary-700">
                {detail.user.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{detail.user.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    detail.user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    detail.user.role === 'worker' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>{detail.user.role}</span>
                  {detail.user.isSuspended && <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Suspended</span>}
                  {detail.user.isVerified && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Verified</span>}
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2 text-gray-600">
                <Mail size={14} className="mt-0.5 text-primary-400 shrink-0" />
                <div><p className="text-xs text-gray-400">Email</p><p>{detail.user.email}</p></div>
              </div>
              {detail.user.phone && (
                <div className="flex items-start gap-2 text-gray-600">
                  <Phone size={14} className="mt-0.5 text-primary-400 shrink-0" />
                  <div><p className="text-xs text-gray-400">Phone</p><p>{detail.user.phone}</p></div>
                </div>
              )}
              {detail.user.location && (
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin size={14} className="mt-0.5 text-primary-400 shrink-0" />
                  <div><p className="text-xs text-gray-400">Location</p><p>{detail.user.location}</p></div>
                </div>
              )}
              {detail.user.lastIp && (
                <div className="flex items-start gap-2 text-gray-600">
                  <Globe size={14} className="mt-0.5 text-primary-400 shrink-0" />
                  <div><p className="text-xs text-gray-400">Last IP</p><p className="font-mono text-xs">{detail.user.lastIp}</p></div>
                </div>
              )}
              {detail.user.lastLoginAt && (
                <div className="flex items-start gap-2 text-gray-600">
                  <Clock size={14} className="mt-0.5 text-primary-400 shrink-0" />
                  <div><p className="text-xs text-gray-400">Last Login</p><p>{formatDate(detail.user.lastLoginAt)}</p></div>
                </div>
              )}
              <div className="flex items-start gap-2 text-gray-600">
                <CalendarCheck size={14} className="mt-0.5 text-primary-400 shrink-0" />
                <div><p className="text-xs text-gray-400">Joined</p><p>{formatDate(detail.user.createdAt)}</p></div>
              </div>
            </div>

            {/* Bookings */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Briefcase size={12} /> {detail.user.role === 'worker' ? 'Assigned Bookings' : 'Bookings'} ({detail.bookings.length})
              </p>
              {detail.bookings.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No bookings found</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {detail.bookings.map((b) => {
                    const isOpen = expandedBooking === b._id
                    return (
                      <div key={b._id} className="border border-gray-100 rounded-xl overflow-hidden">
                        {/* Summary row — click to expand */}
                        <button
                          onClick={() => setExpandedBooking(isOpen ? null : b._id)}
                          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                        >
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{b.serviceId?.title || '—'}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {detail.user.role === 'worker' ? `Client: ${b.clientId?.name}` : `Worker: ${b.workerId?.name}`}
                              {' · '}{formatDate(b.date)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {b.serviceId?.price && <span className="text-xs font-medium text-primary-600">{formatCurrency(b.serviceId.price)}</span>}
                            <Badge className={getStatusColor(b.status)}>{b.status}</Badge>
                            {isOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                          </div>
                        </button>

                        {/* Expanded full details */}
                        {isOpen && (
                          <div className="p-3 space-y-3 bg-white border-t border-gray-100">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-start gap-2 text-gray-600">
                                <User size={13} className="mt-0.5 text-primary-400 shrink-0" />
                                <div>
                                  <p className="text-xs text-gray-400">Client</p>
                                  <p>{b.clientId?.name}</p>
                                  <p className="text-xs text-gray-400">{b.clientId?.email}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2 text-gray-600">
                                <User size={13} className="mt-0.5 text-primary-400 shrink-0" />
                                <div>
                                  <p className="text-xs text-gray-400">Worker</p>
                                  <p>{b.workerId?.name}</p>
                                  <p className="text-xs text-gray-400">{b.workerId?.email}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2 text-gray-600">
                                <CalendarCheck size={13} className="mt-0.5 text-primary-400 shrink-0" />
                                <div><p className="text-xs text-gray-400">Date</p><p>{formatDate(b.date)}</p></div>
                              </div>
                              {b.scheduledTime && (
                                <div className="flex items-start gap-2 text-gray-600">
                                  <Clock size={13} className="mt-0.5 text-primary-400 shrink-0" />
                                  <div><p className="text-xs text-gray-400">Time</p><p>{b.scheduledTime}</p></div>
                                </div>
                              )}
                              {b.phone && (
                                <div className="flex items-start gap-2 text-gray-600">
                                  <Phone size={13} className="mt-0.5 text-primary-400 shrink-0" />
                                  <div><p className="text-xs text-gray-400">Phone</p><p>{b.phone}</p></div>
                                </div>
                              )}
                              {b.address && (
                                <div className="flex items-start gap-2 text-gray-600 col-span-2">
                                  <MapPin size={13} className="mt-0.5 text-primary-400 shrink-0" />
                                  <div><p className="text-xs text-gray-400">Address</p><p>{b.address}</p></div>
                                </div>
                              )}
                            </div>
                            {b.notes && (
                              <div className="p-2.5 bg-red-50 border border-red-100 rounded-lg">
                                <p className="text-xs font-semibold text-red-600 flex items-center gap-1 mb-1"><AlertCircle size={11} /> Issue</p>
                                <p className="text-xs text-gray-700 whitespace-pre-line">{b.notes.split('\n\n')[0]}</p>
                              </div>
                            )}
                            {b.notes?.includes('\n\n') && (
                              <div className="p-2.5 bg-yellow-50 border border-yellow-100 rounded-lg">
                                <p className="text-xs font-semibold text-yellow-600 flex items-center gap-1 mb-1"><FileText size={11} /> Notes</p>
                                <p className="text-xs text-gray-700 whitespace-pre-line">{b.notes.split('\n\n').slice(1).join('\n\n')}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
