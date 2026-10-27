import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, Clock, CheckCircle, XCircle } from 'lucide-react'
import { bookingService } from '../../services/bookingService'
import { useAuthStore } from '../../store/authStore'
import StatCard from '../../components/StatCard'
import { formatDate, getStatusColor } from '../../utils/helpers'
import Badge from '../../components/Badge'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function ClientDashboard() {
  const { user } = useAuthStore()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    bookingService.getAll({ limit: 5 })
      .then(({ data }) => setBookings(data.data.bookings))
      .finally(() => setLoading(false))
  }, [])

  const counts = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your bookings.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Bookings" value={counts.total} icon={CalendarCheck} color="blue" />
        <StatCard title="Pending" value={counts.pending} icon={Clock} color="orange" />
        <StatCard title="Completed" value={counts.completed} icon={CheckCircle} color="green" />
        <StatCard title="Cancelled" value={counts.cancelled} icon={XCircle} color="purple" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Bookings</h2>
          <Link to="/bookings" className="text-sm text-primary-600 hover:underline">View all</Link>
        </div>
        {loading ? <LoadingSpinner className="py-10" /> : (
          <div className="divide-y divide-gray-100">
            {bookings.length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">No bookings yet. <Link to="/services" className="text-primary-600">Browse services</Link></p>
            ) : bookings.map((b) => (
              <div key={b._id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{b.serviceId?.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDate(b.date)}</p>
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
