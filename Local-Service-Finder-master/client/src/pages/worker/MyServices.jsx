import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Tag, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { serviceService } from '../../services/serviceService'
import { formatCurrency, formatPricingDisplay, formatPricingType, CATEGORIES } from '../../utils/helpers'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import Input from '../../components/Input'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'

const PRICING_TYPES = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'starting_at', label: 'Starting From' },
  { value: 'hourly', label: 'Hourly Rate' },
  { value: 'per_visit', label: 'Per Visit' },
  { value: 'custom_quote', label: 'Custom Quote / Estimate' },
]

const emptyForm = {
  title: '',
  category: '',
  description: '',
  price: '',
  pricingType: 'fixed',
  location: '',
}

export default function MyServices() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchServices = () => {
    serviceService
      .getMyServices()
      .then(({ data }) => setServices(data.data.services || []))
      .catch(() => {
        // Fallback to getAll if needed
        serviceService.getAll()
          .then(({ data }) => setServices(data.data.services || []))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModal(true)
  }

  const openEdit = (s) => {
    setEditing(s._id)
    setForm({
      title: s.title,
      category: s.category,
      description: s.description,
      price: s.price,
      pricingType: s.pricingType || 'fixed',
      location: s.location || '',
    })
    setModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await serviceService.update(editing, form)
        toast.success('Service updated successfully')
      } else {
        await serviceService.create(form)
        toast.success('Service created successfully')
      }
      setModal(false)
      fetchServices()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save service')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this service listing?')) return
    try {
      await serviceService.delete(id)
      toast.success('Service deleted')
      fetchServices()
    } catch {
      toast.error('Failed to delete service')
    }
  }

  if (loading) return <LoadingSpinner className="py-20" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Service Listings</h1>
          <p className="text-gray-500 text-sm mt-1">
            Configure your offerings, transparent INR rates, and pricing models.
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus size={16} /> Add New Service
        </Button>
      </div>

      {services.length === 0 ? (
        <EmptyState
          title="No services yet"
          description="Create your first service listing to start receiving customer bookings and WhatsApp inquiries."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s) => (
            <div
              key={s._id}
              className="card p-5 border border-gray-100 hover:border-emerald-200 transition-all flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    {s.category}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(s)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-emerald-600 transition-colors"
                      title="Edit Service"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(s._id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete Service"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 text-base mb-1.5">{s.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-3 mb-3 leading-relaxed">
                  {s.description}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-emerald-600">
                    {formatPricingDisplay(s.price, s.pricingType)}
                  </span>
                  <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                    {formatPricingType(s.pricingType)}
                  </span>
                </div>

                {s.location && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin size={12} className="text-gray-400" />
                    <span>{s.location}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Create / Edit Modal */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit Service Listing' : 'Create New Service Listing'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Service Title"
            placeholder="e.g. Master Home Deep Cleaning"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                className="input-field"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              >
                <option value="">Select Category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pricing Structure
              </label>
              <select
                className="input-field"
                value={form.pricingType}
                onChange={(e) => setForm({ ...form, pricingType: e.target.value })}
                required
              >
                {PRICING_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description & Scope of Work
            </label>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="Detail what is included, tools used, and guarantee..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Price (₹ INR)"
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 750"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
            <Input
              label="Service Area / Location"
              placeholder="e.g. South Delhi, Indiranagar"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs text-emerald-800">
            <span className="font-semibold">Transparent Pricing:</span> Customers see this exact price in Indian Rupees (₹) and your selected structure ({formatPricingType(form.pricingType)}).
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving} className="flex-1">
              {editing ? 'Save Changes' : 'Publish Service'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
