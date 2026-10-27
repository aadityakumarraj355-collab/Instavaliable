import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  UserPlus,
  Search,
  Key,
  Trash2,
  Power,
  RefreshCw,
  Edit2,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Check,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminService } from '../../services/adminService'
import { useAuthStore } from '../../store/authStore'
import { formatDate } from '../../utils/helpers'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'

const PERMISSION_LABELS = {
  manage_customers: 'Customers',
  manage_workers: 'Workers',
  manage_services: 'Services',
  manage_bookings: 'Bookings',
  manage_whatsapp: 'WhatsApp',
  manage_database: 'Database',
  view_audit_logs: 'Audit Logs',
}

export default function AdminAdministrators() {
  const { user: currentUser } = useAuthStore()
  const [administrators, setAdministrators] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedAdmin, setSelectedAdmin] = useState(null)
  const [editModal, setEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '', permissions: [] })
  const [actionLoading, setActionLoading] = useState(null)

  const fetchAdministrators = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminService.getAdministrators({ search, status: statusFilter })
      setAdministrators(data.data.administrators)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch administrators')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    fetchAdministrators()
  }, [fetchAdministrators])

  const handleToggleStatus = async (admin) => {
    if (admin.role === 'super_admin') {
      return toast.error('Super Administrator status cannot be suspended')
    }
    const actionText = admin.isSuspended ? 'reactivate' : 'suspend'
    if (!confirm(`Are you sure you want to ${actionText} administrator account "${admin.name}"?`)) return

    setActionLoading(`status-${admin._id}`)
    try {
      await adminService.toggleAdminStatus(admin._id)
      toast.success(`Administrator ${actionText}d`)
      fetchAdministrators()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status change failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRevokeSession = async (admin) => {
    if (!confirm(`Revoke all active sessions for "${admin.name}"? They will be immediately logged out.`)) return

    setActionLoading(`revoke-${admin._id}`)
    try {
      await adminService.revokeAdminSession(admin._id)
      toast.success(`Active sessions revoked for ${admin.name}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke sessions')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (admin) => {
    if (admin.role === 'super_admin') {
      return toast.error('Security Constraint: Super Administrator accounts cannot be deleted')
    }
    if (!confirm(`Permanently delete administrator account "${admin.name}"? This action cannot be undone.`)) return

    setActionLoading(`delete-${admin._id}`)
    try {
      await adminService.deleteAdministrator(admin._id)
      toast.success(`Administrator account deleted`)
      setAdministrators((prev) => prev.filter((a) => a._id !== admin._id))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete administrator')
    } finally {
      setActionLoading(null)
    }
  }

  const openEditModal = (admin) => {
    setSelectedAdmin(admin)
    setEditForm({
      name: admin.name || '',
      phone: admin.phone || '',
      permissions: admin.permissions || [],
    })
    setEditModal(true)
  }

  const toggleEditPermission = (key) => {
    setEditForm((prev) => {
      const exists = prev.permissions.includes(key)
      return {
        ...prev,
        permissions: exists ? prev.permissions.filter((p) => p !== key) : [...prev.permissions, key],
      }
    })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!selectedAdmin) return
    setActionLoading('save-edit')
    try {
      await adminService.updateAdministrator(selectedAdmin._id, editForm)
      toast.success('Administrator updated successfully')
      setEditModal(false)
      fetchAdministrators()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update administrator')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Super Admin Control Center
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-1">Administrator Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Create, manage permissions, suspend, and monitor all platform administrators.
          </p>
        </div>

        <Link
          to="/admin/administrators/create"
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all shrink-0"
        >
          <UserPlus size={16} />
          <span>Create Administrator</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-xs">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            className="flex-1 outline-none text-xs sm:text-sm placeholder-gray-400"
            placeholder="Search administrators by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none text-gray-700"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="suspended">Suspended Only</option>
        </select>
      </div>

      {/* Administrators List */}
      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : administrators.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No Administrators Found"
          description="Click 'Create Administrator' above to add a new admin."
        />
      ) : (
        <div className="card overflow-hidden border border-gray-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Administrator</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Assigned Permissions</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {administrators.map((admin) => {
                  const isSuper = admin.role === 'super_admin'
                  const isSelf = admin._id === currentUser?._id

                  return (
                    <tr key={admin._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name / Email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                              isSuper ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {admin.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                              {admin.name}
                              {isSelf && (
                                <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">{admin.email}</p>
                            {admin.phone && (
                              <p className="text-[11px] text-gray-400 mt-0.5">{admin.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-5 py-4">
                        {isSuper ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full border border-purple-200 shadow-2xs">
                            👑 Super Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                            🛡️ Administrator
                          </span>
                        )}
                      </td>

                      {/* Permissions */}
                      <td className="px-5 py-4 max-w-xs">
                        {isSuper ? (
                          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                            Full Unrestricted Access
                          </span>
                        ) : admin.permissions?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {admin.permissions.map((p) => (
                              <span
                                key={p}
                                className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                              >
                                {PERMISSION_LABELS[p] || p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 font-medium">None Assigned</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {admin.isSuspended ? (
                          <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                            Suspended
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Edit Details */}
                          <button
                            type="button"
                            onClick={() => openEditModal(admin)}
                            className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit Permissions & Details"
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* Revoke Sessions */}
                          <button
                            type="button"
                            onClick={() => handleRevokeSession(admin)}
                            disabled={actionLoading === `revoke-${admin._id}`}
                            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Revoke Active Sessions"
                          >
                            <Key size={15} />
                          </button>

                          {/* Toggle Suspend (Ordinary Admins Only) */}
                          {!isSuper && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(admin)}
                              disabled={actionLoading === `status-${admin._id}`}
                              className={`p-1.5 rounded-lg transition-colors ${
                                admin.isSuspended
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-amber-600 hover:bg-amber-50'
                              }`}
                              title={admin.isSuspended ? 'Reactivate Admin' : 'Suspend Admin'}
                            >
                              <Power size={15} />
                            </button>
                          )}

                          {/* Delete Account (Ordinary Admins Only) */}
                          {!isSuper && (
                            <button
                              type="button"
                              onClick={() => handleDelete(admin)}
                              disabled={actionLoading === `delete-${admin._id}`}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Administrator"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title={`Edit Administrator: ${selectedAdmin?.name}`}>
        {selectedAdmin && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  className="input-field text-sm"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  className="input-field text-sm"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
            </div>

            {selectedAdmin.role !== 'super_admin' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Assigned Permissions
                </label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto p-2 border border-gray-200 rounded-xl">
                  {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
                    const isChecked = editForm.permissions.includes(key)
                    return (
                      <label
                        key={key}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                          checked={isChecked}
                          onChange={() => toggleEditPermission(key)}
                        />
                        <span className="font-medium text-gray-800">{label}</span>
                        <span className="text-[11px] text-gray-400 font-mono ml-auto">{key}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-purple-50 text-purple-800 text-xs rounded-xl font-medium">
                👑 Super Administrator inherently retains all platform permissions.
              </div>
            )}

            <div className="flex gap-2 pt-3">
              <Button type="submit" loading={actionLoading === 'save-edit'} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                Save Changes
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditModal(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
