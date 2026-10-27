import { useEffect, useState } from 'react'
import { feedbackService } from '../../services/feedbackService'
import { formatDate } from '../../utils/helpers'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import { Star, MessageSquare, CheckCircle, ShieldAlert } from 'lucide-react'

export default function WorkerReviews() {
  const [data, setData] = useState({
    reviews: [],
    overallRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  })
  const [loading, setLoading] = useState(true)

  const fetchReviews = () => {
    feedbackService
      .getWorkerReviews()
      .then(({ data: res }) => {
        setData({
          reviews: res.data.reviews || [],
          overallRating: res.data.overallRating || 0,
          totalReviews: res.data.totalReviews || 0,
          distribution: res.data.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        })
      })
      .catch((err) => {
        console.error('Failed to load reviews:', err)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  if (loading) return <LoadingSpinner className="py-20" />

  const { overallRating, totalReviews, distribution, reviews } = data

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customer Reviews & Feedback</h1>
        <p className="text-gray-500 text-sm mt-1">
          Real verified feedback submitted by customers after completed service requests. Reviews are read-only and audited by Instavaliable.
        </p>
      </div>

      {/* Ratings Overview Card */}
      <div className="card p-6 border border-gray-100 shadow-sm bg-white">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Overall score */}
          <div className="md:col-span-4 text-center md:border-r border-gray-100 md:pr-6">
            <div className="text-5xl font-black text-gray-900 tracking-tight">
              {overallRating > 0 ? overallRating.toFixed(1) : '0.0'}
            </div>
            <div className="flex items-center justify-center gap-1 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={20}
                  className={
                    star <= Math.round(overallRating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-gray-200 fill-gray-100'
                  }
                />
              ))}
            </div>
            <p className="text-sm font-medium text-gray-500">
              Based on {totalReviews} verified review{totalReviews !== 1 ? 's' : ''}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <CheckCircle size={13} /> Instavaliable Verified Provider
            </div>
          </div>

          {/* Distribution Bars */}
          <div className="md:col-span-8 space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = distribution[stars] || 0
              const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0

              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 w-14 shrink-0 font-semibold text-gray-700">
                    <span>{stars}</span>
                    <Star size={13} className="text-amber-400 fill-amber-400" />
                  </div>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stars >= 4
                          ? 'bg-emerald-500'
                          : stars === 3
                          ? 'bg-amber-400'
                          : 'bg-red-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-16 text-right text-gray-500 font-mono shrink-0">
                    {count} ({percentage}%)
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          All Customer Reviews ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No reviews yet"
            description="When clients complete bookings with you, their verified reviews will appear here."
          />
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev._id}
                className="card p-5 border border-gray-100 hover:border-gray-200 transition-all shadow-sm bg-white"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shadow-inner">
                      {rev.clientId?.name?.[0]?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">
                        {rev.clientId?.name || 'Customer'}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {rev.serviceId?.title ? (
                          <span className="font-medium text-emerald-700">
                            {rev.serviceId.title}
                          </span>
                        ) : (
                          'Service Request'
                        )}
                        {' • '}
                        {formatDate(rev.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 self-start">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={15}
                        className={
                          s <= rev.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-200 fill-gray-100'
                        }
                      />
                    ))}
                  </div>
                </div>

                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line bg-gray-50/60 p-3.5 rounded-lg border border-gray-100">
                  {rev.message}
                </p>

                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <CheckCircle size={12} className="text-emerald-500" />
                  <span>Verified Completed Booking ID:</span>
                  <span className="font-mono text-gray-600">
                    {rev.bookingId?.requestId || rev.bookingId?._id || rev.bookingId}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
