import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { serviceService } from '../services/serviceService'
import ServiceCard from '../components/ServiceCard'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { CATEGORIES } from '../utils/helpers'

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [services, setServices] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    page: 1,
  })

  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await serviceService.getAll(filters)
      setServices(data.data.services)
      setPagination(data.data.pagination)
    } catch {
      setServices([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchServices() }, [fetchServices])

  const applyFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value, page: 1 }))
  const clearFilters = () => setFilters({ keyword: '', category: '', location: '', page: 1 })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
          On Demand Marketplace
        </span>
        <h1 className="text-3xl font-extrabold text-gray-900 mt-2">Explore Local Services</h1>
        <p className="text-gray-500 text-sm mt-1">
          Discover verified local freelancers and skilled professionals. Chat and book directly via WhatsApp.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 flex-1 bg-white border border-gray-300 rounded-xl px-3 shadow-xs">
          <Search size={18} className="text-emerald-500" />
          <input
            className="flex-1 py-2.5 outline-none text-sm"
            placeholder="Search services by skill or title..."
            value={filters.keyword}
            onChange={(e) => applyFilter('keyword', e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 btn-secondary px-4 py-2.5 rounded-xl text-sm font-semibold"
        >
          <SlidersHorizontal size={16} /> Filters
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="card p-4 mb-6 grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <select className="input-field text-sm" value={filters.category}
              onChange={(e) => applyFilter('category', e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
            <input className="input-field text-sm" placeholder="City, State"
              value={filters.location} onChange={(e) => applyFilter('location', e.target.value)} />
          </div>
          <div className="flex items-end">
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600">
              <X size={14} /> Clear filters
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner size={36} className="py-20" />
      ) : services.length === 0 ? (
        <EmptyState title="No service providers available yet" description="Try adjusting your search filters or check back shortly." />
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{pagination.total} services found</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {services.map((s) => <ServiceCard key={s._id} service={s} />)}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilters((f) => ({ ...f, page: p }))}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    filters.page === p ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
