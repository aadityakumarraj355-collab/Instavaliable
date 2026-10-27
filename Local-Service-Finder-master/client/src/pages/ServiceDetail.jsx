import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MapPin,
  Calendar,
  CheckCircle,
  Wrench,
  LocateFixed,
  Star,
  Briefcase,
  DollarSign,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  Tag,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { serviceService } from '../services/serviceService'
import { bookingService } from '../services/bookingService'
import { workerService } from '../services/workerService'
import { feedbackService } from '../services/feedbackService'
import { useAuthStore } from '../store/authStore'
import {
  formatCurrency,
  formatDate,
  formatPricingDisplay,
  formatPricingType,
} from '../utils/helpers'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { PageLoader } from '../components/LoadingSpinner'
import WhatsAppButton, { WhatsAppIcon } from '../components/WhatsAppButton'
import {
  getBookingWhatsAppUrl,
  getProviderDirectWhatsAppUrl,
  DEFAULT_WHATSAPP_NUMBER,
} from '../utils/whatsapp'

export default function ServiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()

  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)

  // Feedback & Reviews state
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    overallRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  })
  const [loadingReviews, setLoadingReviews] = useState(false)

  // Booking Modal
  const [bookingModal, setBookingModal] = useState(false)
  const [bookingForm, setBookingForm] = useState({
    date: '',
    scheduledTime: '',
    address: '',
    phone: '',
    issue: '',
    notes: '',
  })
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [booking, setBooking] = useState(false)
  const [confirmedBooking, setConfirmedBooking] = useState(null)

  // Provider profile modal
  const [workerProfile, setWorkerProfile] = useState(null)
  const [workerModal, setWorkerModal] = useState(false)

  useEffect(() => {
    serviceService
      .getOne(id)
      .then(({ data }) => {
        const s = data.data
        setService(s)

        // Load provider reviews if workerId is available
        const workerUserId = s.workerId?._id || s.workerId
        if (workerUserId) {
          setLoadingReviews(true)
          feedbackService
            .getProviderFeedback(workerUserId)
            .then(({ data: fbRes }) => {
              setReviewsData({
                reviews: fbRes.data.reviews || [],
                overallRating: fbRes.data.overallRating || 0,
                totalReviews: fbRes.data.totalReviews || 0,
                distribution: fbRes.data.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
              })
            })
            .catch(() => {})
            .finally(() => setLoadingReviews(false))
        }
      })
      .catch(() => navigate('/services'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const detectLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported')
    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const fallback = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
        setBookingForm((f) => ({ ...f, address: fallback }))
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'InstavaliableApp/1.0' } }
          )
          if (!res.ok) throw new Error('Geocode failed')
          const data = await res.json()
          if (data.display_name) setBookingForm((f) => ({ ...f, address: data.display_name }))
        } catch {
          // fallback coords already set
        } finally {
          setDetectingLocation(false)
        }
      },
      (err) => {
        toast.error(err.code === 1 ? 'Location permission denied' : 'Could not detect location')
        setDetectingLocation(false)
      },
      { timeout: 10000 }
    )
  }

  const openWorkerProfile = async () => {
    if (!service?.workerId?._id) return
    setWorkerModal(true)
    if (!workerProfile) {
      try {
        const { data } = await workerService.getWorkerById(service.workerId._id)
        setWorkerProfile(data.data)
      } catch {
        toast.error('Could not load worker profile')
      }
    }
  }

  const handleBook = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) return navigate('/login')
    setBooking(true)
    try {
      const payload = {
        serviceId: id,
        date: new Date(`${bookingForm.date}T${bookingForm.scheduledTime}`).toISOString(),
        scheduledTime: bookingForm.scheduledTime,
        address: bookingForm.address,
        phone: bookingForm.phone,
        notes: [bookingForm.issue, bookingForm.notes].filter(Boolean).join('\n\n'),
      }
      const { data } = await bookingService.create(payload)
      const created = data.data
      toast.success('Booking requested successfully!')
      setBookingModal(false)
      setConfirmedBooking(created)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking request failed')
    } finally {
      setBooking(false)
    }
  }

  if (loading) return <PageLoader />
  if (!service) return null

  const providerDirectWhatsappUrl = getProviderDirectWhatsAppUrl({
    providerPhone: service.workerId?.phone,
    providerName: service.workerId?.name,
    serviceTitle: service.title,
    price: service.price,
    pricingType: formatPricingType(service.pricingType),
    clientName: user?.name,
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Service Main Card */}
      <div className="card overflow-hidden border border-gray-100 shadow-md bg-white">
        {/* Banner */}
        <div className="h-56 bg-gradient-to-br from-emerald-500/15 via-teal-50 to-blue-500/15 flex items-center justify-center relative">
          <Wrench size={72} className="text-emerald-500/60" />
          <span className="absolute top-4 left-4 text-xs font-semibold text-emerald-800 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full shadow-xs border border-emerald-100">
            {service.category}
          </span>
          {service.pricingType && (
            <span className="absolute top-4 right-4 text-xs font-semibold text-gray-700 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full shadow-xs border border-gray-200">
              {formatPricingType(service.pricingType)}
            </span>
          )}
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                {service.title}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-xs sm:text-sm text-gray-500">
                {service.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} className="text-emerald-600" />
                    {service.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {formatDate(service.createdAt)}
                </span>
                {reviewsData.overallRating > 0 && (
                  <span className="flex items-center gap-1 font-semibold text-amber-600">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    {reviewsData.overallRating.toFixed(1)} ({reviewsData.totalReviews} reviews)
                  </span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <p className="text-3xl font-black text-emerald-600">
                {formatPricingDisplay(service.price, service.pricingType)}
              </p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Indian Rupees (₹ INR) · {formatPricingType(service.pricingType)}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Service Overview & Scope
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base whitespace-pre-line">
              {service.description}
            </p>
          </div>

          {/* Service Provider Profile Card */}
          {service.workerId && (
            <div
              onClick={openWorkerProfile}
              className="mt-8 p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-emerald-50/50 hover:border-emerald-200 transition-all shadow-2xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-lg font-bold text-white shadow-sm shrink-0">
                {service.workerId.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{service.workerId.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {service.workerId.location || 'Local Professional'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {service.workerId.isVerified && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle size={11} /> Verified Provider
                    </span>
                  )}
                  {reviewsData.overallRating > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                      {reviewsData.overallRating.toFixed(1)} ({reviewsData.totalReviews})
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-emerald-600 font-semibold shrink-0">
                View Full Profile & Reviews →
              </span>
            </div>
          )}

          {/* Action Row */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3">
            {user?.role === 'client' && (
              <Button
                onClick={() => setBookingModal(true)}
                size="lg"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
              >
                Book This Service Now
              </Button>
            )}
            {!isAuthenticated && (
              <Button
                onClick={() => navigate('/login')}
                size="lg"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
              >
                Login to Book
              </Button>
            )}

            {/* Direct WhatsApp to Provider */}
            <a
              href={providerDirectWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-semibold text-white bg-[#25D366] hover:bg-[#20bd5a] px-5 py-3 rounded-xl transition-all shadow-sm"
              title="Direct WhatsApp with Provider"
            >
              <WhatsAppIcon size={18} />
              <span>Direct WhatsApp Chat</span>
            </a>
          </div>
        </div>
      </div>

      {/* Verified Customer Reviews Section (Feature 10) */}
      <div className="card p-6 sm:p-8 border border-gray-100 shadow-md bg-white space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Star className="text-amber-400 fill-amber-400" size={22} />
              Verified Customer Reviews
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Feedback from clients who completed bookings with this service provider.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <ShieldCheck size={14} />
            <span>Strict Verification: Completed Bookings Only</span>
          </div>
        </div>

        {/* Rating Breakdown & Overview */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-gray-50/70 p-5 rounded-2xl border border-gray-100">
          <div className="md:col-span-4 text-center md:border-r border-gray-200 md:pr-6">
            <div className="text-5xl font-black text-gray-900 tracking-tight">
              {reviewsData.overallRating > 0 ? reviewsData.overallRating.toFixed(1) : '0.0'}
            </div>
            <div className="flex items-center justify-center gap-1 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={18}
                  className={
                    star <= Math.round(reviewsData.overallRating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-gray-200 fill-gray-100'
                  }
                />
              ))}
            </div>
            <p className="text-xs font-semibold text-gray-500">
              {reviewsData.totalReviews} verified rating{reviewsData.totalReviews !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="md:col-span-8 space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviewsData.distribution[stars] || 0
              const percentage =
                reviewsData.totalReviews > 0
                  ? Math.round((count / reviewsData.totalReviews) * 100)
                  : 0

              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 w-14 shrink-0 font-semibold text-gray-700">
                    <span>{stars}</span>
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                  </div>
                  <div className="flex-1 h-2.5 bg-gray-200/80 rounded-full overflow-hidden">
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

        {/* Review List or Empty State */}
        {reviewsData.reviews.length === 0 ? (
          <div className="text-center py-10 px-4 bg-gray-50/40 rounded-xl border border-dashed border-gray-200">
            <MessageSquare size={36} className="mx-auto text-gray-300 mb-2" />
            <h4 className="text-sm font-bold text-gray-700">No reviews yet for this service provider</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Be the first to leave a review after completing your service request! Reviews are submitted from the My Bookings dashboard.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviewsData.reviews.map((rev) => (
              <div
                key={rev._id}
                className="p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-all shadow-2xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shadow-inner">
                      {rev.clientId?.name?.[0]?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">
                        {rev.clientId?.name || 'Verified Customer'}
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        {formatDate(rev.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        className={
                          s <= rev.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-200 fill-gray-100'
                        }
                      />
                    ))}
                  </div>
                </div>

                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line pl-12">
                  {rev.message}
                </p>

                <div className="pl-12 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                  <CheckCircle size={12} className="text-emerald-500" />
                  <span>Verified Completed Service</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <Modal
        isOpen={bookingModal}
        onClose={() => setBookingModal(false)}
        title="Request Service Booking"
      >
        <form onSubmit={handleBook} className="space-y-4">
          <div className="bg-emerald-50/70 border border-emerald-100 p-3 rounded-xl text-xs text-emerald-800">
            <strong>Instavaliable Transparency:</strong> Price: <strong>{formatPricingDisplay(service.price, service.pricingType)}</strong>. Your request generates a verified Request ID, and you coordinate directly with the provider on WhatsApp.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Preferred Date *
              </label>
              <input
                type="date"
                className="input-field text-sm"
                value={bookingForm.date}
                onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                required
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Preferred Time *
              </label>
              <input
                type="time"
                className="input-field text-sm"
                value={bookingForm.scheduledTime}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, scheduledTime: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Service Address *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input-field text-sm flex-1"
                placeholder="123 Main St, Apartment / Landmark"
                value={bookingForm.address}
                onChange={(e) => setBookingForm({ ...bookingForm, address: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={detectLocation}
                disabled={detectingLocation}
                className="flex items-center gap-1 px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 whitespace-nowrap font-medium"
              >
                <LocateFixed
                  size={14}
                  className={detectingLocation ? 'animate-spin text-emerald-600' : ''}
                />
                {detectingLocation ? 'Detecting...' : 'Auto'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Your Contact Phone / WhatsApp Number *
            </label>
            <input
              type="tel"
              className="input-field text-sm"
              placeholder="+91 98765 43210"
              value={bookingForm.phone}
              onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Describe the Job / Work Required *
            </label>
            <textarea
              className="input-field text-sm resize-none"
              rows={3}
              placeholder="Describe what needs to be done..."
              value={bookingForm.issue}
              onChange={(e) => setBookingForm({ ...bookingForm, issue: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Additional Instructions (Optional)
            </label>
            <textarea
              className="input-field text-sm resize-none"
              rows={2}
              placeholder="Entry code, landmark, parking, etc."
              value={bookingForm.notes}
              onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              loading={booking}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Confirm & Request Booking
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setBookingModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Booking Confirmation / WhatsApp Handshake Modal */}
      <Modal
        isOpen={!!confirmedBooking}
        onClose={() => {
          setConfirmedBooking(null)
          navigate('/bookings')
        }}
        title="Booking Request Generated!"
      >
        {confirmedBooking && (
          <div className="space-y-5 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                  Verified Booking Reference
                </p>
                <p className="font-mono text-xl font-black text-gray-900 mt-0.5">
                  {confirmedBooking.requestId || 'INS-2026-CONFIRMED'}
                </p>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-1.5">
              <p>
                <strong>Service:</strong> {service?.title}
              </p>
              <p>
                <strong>Price:</strong> {formatPricingDisplay(service?.price, service?.pricingType)}
              </p>
              <p>
                <strong>Preferred Schedule:</strong>{' '}
                {formatDate(confirmedBooking.date)}{' '}
                {confirmedBooking.scheduledTime ? `at ${confirmedBooking.scheduledTime}` : ''}
              </p>
              <p>
                <strong>Location:</strong> {confirmedBooking.address}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-gray-600 space-y-3">
              <p className="font-semibold text-gray-900">
                💬 Next Step: Open WhatsApp to Coordinate Instantly
              </p>
              <p>
                Click below to send the pre-filled booking details to the provider's phone so they can confirm availability immediately.
              </p>
              <WhatsAppButton
                size="md"
                className="w-full"
                href={getBookingWhatsAppUrl({
                  phone: service?.workerId?.phone || DEFAULT_WHATSAPP_NUMBER,
                  requestId: confirmedBooking.requestId,
                  serviceTitle: service?.title,
                  price: service?.price,
                  clientName: user?.name,
                  workerName: service?.workerId?.name,
                  date: formatDate(confirmedBooking.date),
                  scheduledTime: confirmedBooking.scheduledTime,
                  address: confirmedBooking.address,
                  notes: confirmedBooking.notes,
                })}
              >
                Send Booking to WhatsApp
              </WhatsAppButton>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setConfirmedBooking(null)
                  navigate('/bookings')
                }}
                className="w-full sm:w-auto"
              >
                Go to My Bookings
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Provider Profile Modal */}
      <Modal isOpen={workerModal} onClose={() => setWorkerModal(false)} title="Provider Profile">
        {!workerProfile ? (
          <div className="py-10 text-center text-gray-400 text-sm">Loading provider profile...</div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-2xl font-bold text-white shadow-sm">
                {workerProfile.userId?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{workerProfile.userId?.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {workerProfile.userId?.isVerified && (
                    <span className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      <CheckCircle size={11} /> Verified Provider
                    </span>
                  )}
                  {reviewsData.overallRating > 0 && (
                    <span className="flex items-center gap-1 text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full">
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                      {reviewsData.overallRating.toFixed(1)} ({reviewsData.totalReviews} reviews)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {workerProfile.userId?.location && (
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin size={15} className="mt-0.5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Service Area</p>
                    <p className="font-medium text-gray-800">{workerProfile.userId.location}</p>
                  </div>
                </div>
              )}
              {workerProfile.hourlyRate && (
                <div className="flex items-start gap-2 text-gray-600">
                  <Tag size={15} className="mt-0.5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Base Hourly Rate</p>
                    <p className="font-medium text-gray-800">
                      {formatCurrency(workerProfile.hourlyRate)}/hr
                    </p>
                  </div>
                </div>
              )}
              {workerProfile.experience && (
                <div className="flex items-start gap-2 text-gray-600 col-span-2">
                  <Briefcase size={15} className="mt-0.5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Professional Experience</p>
                    <p className="text-gray-800">{workerProfile.experience}</p>
                  </div>
                </div>
              )}
            </div>

            {workerProfile.bio && (
              <div className="p-3.5 bg-gray-50 rounded-xl text-sm text-gray-700 border border-gray-100">
                <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider">
                  About Provider
                </p>
                <p className="leading-relaxed">{workerProfile.bio}</p>
              </div>
            )}

            {workerProfile.skills?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">
                  Verified Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {workerProfile.skills.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs rounded-lg font-semibold border border-emerald-100"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <a
                href={providerDirectWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 font-semibold text-white bg-[#25D366] hover:bg-[#20bd5a] px-4 py-2.5 rounded-xl transition-all shadow-sm"
              >
                <WhatsAppIcon size={16} />
                <span>Direct WhatsApp Chat</span>
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
