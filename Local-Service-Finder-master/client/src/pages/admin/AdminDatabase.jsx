import { useState, useEffect } from 'react'
import { Database, Server, RefreshCw, CheckCircle, ShieldAlert, Layers } from 'lucide-react'
import { adminService } from '../../services/adminService'

export default function AdminDatabase() {
  const [dbData, setDbData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fetchOverview = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const res = await adminService.getDatabaseOverview()
      if (res.data?.success) {
        setDbData(res.data.data)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load database overview')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchOverview()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="text-primary-600" /> Database Health & Collections
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time MongoDB connection metrics and authorized collection record counts.
          </p>
        </div>
        <button
          onClick={() => fetchOverview(true)}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh Metrics
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Connection Status Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Server size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">MongoDB Cluster</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle size={12} /> {dbData?.connectionState || 'Connected'}
                </span>
              </div>
              <p className="text-xs text-gray-500">Database Name: <span className="font-mono font-medium text-gray-700">{dbData?.dbName}</span></p>
            </div>
          </div>
          <div className="text-sm text-gray-500 md:text-right">
            <div>Host: <span className="font-mono text-gray-700">{dbData?.host}</span></div>
            <div className="text-xs text-gray-400 mt-0.5">
              Synced: {dbData?.serverTime ? new Date(dbData.serverTime).toLocaleTimeString() : 'N/A'}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
          <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Security Enforcement:</span> Direct raw MongoDB commands from frontend clients are blocked.
            All operations are executed through protected Mongoose models with audit logging.
          </div>
        </div>
      </div>

      {/* Collection Record Counts */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Layers size={18} className="text-primary-600" /> Monitored Database Collections
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dbData?.collections?.map((col, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-primary-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Collection #{idx + 1}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="mt-2">
                <p className="text-sm font-semibold text-gray-800 truncate" title={col.name}>
                  {col.name}
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-gray-900">
                    {col.count?.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">records</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
