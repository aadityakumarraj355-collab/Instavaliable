import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { serviceService } from '../../services/serviceService'
import { adminService } from '../../services/adminService'
import { formatCurrency, formatDate } from '../../utils/helpers'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'

export default function AdminServices() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchServices = () => {
    serviceService.getAll({ limit: 50 })
      .then(({ data }) => setServices(data.data.services))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchServices() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this service?')) return
    try {
      await adminService.deleteService(id)
      toast.success('Service deleted')
      fetchServices()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Services</h1>
      {loading ? <LoadingSpinner className="py-20" /> : services.length === 0 ? (
        <EmptyState title="No services found" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Title', 'Category', 'Worker', 'Price', 'Location', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {services.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate">{s.title}</td>
                    <td className="px-4 py-3 text-gray-500">{s.category}</td>
                    <td className="px-4 py-3 text-gray-500">{s.workerId?.name || '—'}</td>
                    <td className="px-4 py-3 font-medium text-primary-600">{formatCurrency(s.price)}</td>
                    <td className="px-4 py-3 text-gray-500">{s.location || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(s._id)}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium">
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
