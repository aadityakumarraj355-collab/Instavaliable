import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, CalendarCheck, CheckCircle, Clock } from 'lucide-react'
import { serviceService } from '../../services/serviceService'
import { bookingService } from '../../services/bookingService'
import { useAuthStore } from '../../store/authStore'
import StatCard from '../../components/StatCard'
import Badge from '../../components/Badge'
import { formatDate, getStatusColor } from '../../utils/helpers'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function WorkerDashboard() {
  const { user } = useAuthStore()
  const [bookings, setBookings] = useState([])
  const [serviceCount, setServiceCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      bookingService.getAll({ limit: 5 }),
      serviceService.getMyServices(),
    ]).then(([bRes, sRes]) => {
      setBookings(bRes.data.data.bookings || [])
      setServiceCount(sRes.data.data?.length || 0)
    }).finally(() => setLoading(false))
  }, [])

  const pending = bookings.filter((b) => b.status === 'pending').length
  const completed = bookings.filter((b) => b.status === 'completed').length

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Worker Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your services and bookings.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="My Services" value={serviceCount} icon={Briefcase} color="blue" />
        <StatCard title="Total Requests" value={bookings.length} icon={CalendarCheck} color="purple" />
        <StatCard title="Pending" value={pending} icon={Clock} color="orange" />
        <StatCard title="Completed" value={completed} icon={CheckCircle} color="green" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Requests</h2>
          <Link to="/worker/requests" className="text-sm text-primary-600 hover:underline">View all</Link>
        </div>
        {loading ? <LoadingSpinner className="py-10" /> : (
          <div className="divide-y divide-gray-100">
            {bookings.length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">No requests yet.</p>
            ) : bookings.map((b) => (
              <div key={b._id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{b.serviceId?.title}</p>
                  <p className="text-xs text-gray-500">Client: {b.clientId?.name} · {formatDate(b.date)}</p>
                </div>
                <Badge className={getStatusColor(b.status)}>{b.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
