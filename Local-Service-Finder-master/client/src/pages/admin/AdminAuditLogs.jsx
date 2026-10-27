import { useEffect, useState, useCallback } from 'react'
import { ShieldCheck, Search, Calendar, User, Activity, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminService } from '../../services/adminService'
import { formatDate } from '../../utils/helpers'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'

const ACTION_COLORS = {
  SETUP_INITIAL_SUPER_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  CREATE_ADMINISTRATOR: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  UPDATE_ADMINISTRATOR: 'bg-blue-100 text-blue-800 border-blue-200',
  ADMIN_LOGIN_SUCCESS: 'bg-teal-50 text-teal-800 border-teal-200',
  REVOKE_ADMIN_SESSION: 'bg-amber-100 text-amber-800 border-amber-200',
  SUSPEND_ADMIN: 'bg-red-100 text-red-800 border-red-200',
  DELETE_ADMINISTRATOR: 'bg-red-100 text-red-800 border-red-200',
  SUSPEND_USER: 'bg-orange-100 text-orange-800 border-orange-200',
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(1)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminService.getAuditLogs({ page, limit: 15, action: actionFilter })
      setLogs(data.data.logs)
      setPagination(data.data.pagination)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch audit logs')
    } finally {
      setLoading(false)
    }
  }, [page, actionFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            System Compliance Trail
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-1">Security Audit Logs</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Immutable log record of all administrative logins, privilege assignments, and marketplace actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            className="input-field text-xs py-2 w-48"
            placeholder="Filter action (e.g. LOGIN)"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No Audit Logs Found"
          description="Security and administrative events will be recorded here automatically."
        />
      ) : (
        <div className="card overflow-hidden border border-gray-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Actor</th>
                  <th className="px-5 py-3.5">Target</th>
                  <th className="px-5 py-3.5">Details</th>
                  <th className="px-5 py-3.5">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {logs.map((log) => {
                  const badgeClass =
                    ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700 border-gray-200'

                  return (
                    <tr key={log._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-[11px] border ${badgeClass}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div>
                          <p className="font-bold text-gray-900">{log.actorName}</p>
                          <p className="text-[10px] text-gray-400 capitalize">{log.actorRole}</p>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-medium text-gray-700">
                        {log.targetType} {log.targetId ? `(${log.targetId.slice(-6)})` : ''}
                      </td>

                      <td className="px-5 py-3.5 text-gray-600 max-w-xs truncate font-mono text-[11px]">
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-gray-400 text-[11px]">
                        {log.ipAddress || 'internal'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 text-xs">
              <span className="text-gray-500">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total events)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
