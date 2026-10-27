import { useEffect, useState, useCallback } from 'react'
import {
  MessageSquare,
  Plus,
  Phone,
  Star,
  Trash2,
  Edit2,
  Power,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { whatsAppService } from '../../services/whatsAppService'
import { WhatsAppIcon } from '../../components/WhatsAppButton'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'

const CATEGORY_LABELS = {
  customer_support: 'Customer Support',
  booking_support: 'Booking Dispatch',
  worker_support: 'Provider Onboarding',
  general: 'General Helpline',
}

export default function AdminWhatsApp() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    category: 'customer_support',
    isPrimary: false,
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await whatsAppService.getAllContacts()
      setContacts(data.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch WhatsApp contacts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const openAddModal = () => {
    setEditingContact(null)
    setForm({
      name: '',
      phoneNumber: '',
      category: 'customer_support',
      isPrimary: contacts.length === 0,
      notes: '',
    })
    setModalOpen(true)
  }

  const openEditModal = (c) => {
    setEditingContact(c)
    setForm({
      name: c.name || '',
      phoneNumber: c.phoneNumber || '',
      category: c.category || 'customer_support',
      isPrimary: c.isPrimary || false,
      notes: c.notes || '',
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.phoneNumber.trim()) {
      return toast.error('Name and phone number are required')
    }

    setSubmitting(true)
    try {
      if (editingContact) {
        await whatsAppService.updateContact(editingContact._id, form)
        toast.success('WhatsApp contact updated')
      } else {
        await whatsAppService.createContact(form)
        toast.success('New WhatsApp contact added')
      }
      setModalOpen(false)
      fetchContacts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save contact')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSetPrimary = async (id) => {
    try {
      await whatsAppService.setPrimaryContact(id)
      toast.success('Primary WhatsApp contact updated')
      fetchContacts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update primary contact')
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await whatsAppService.toggleContactStatus(id)
      toast.success('Contact status updated')
      fetchContacts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  const handleDelete = async (contact) => {
    if (contact.isPrimary) {
      return toast.error('Cannot delete the primary WhatsApp contact')
    }
    if (!confirm(`Delete contact "${contact.name}"?`)) return

    try {
      await whatsAppService.deleteContact(contact._id)
      toast.success('Contact deleted')
      setContacts((prev) => prev.filter((c) => c._id !== contact._id))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete contact')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Click-to-Chat Routing
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-1">WhatsApp Contacts Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Configure official business numbers used across the customer enquiry and booking workflow.
          </p>
        </div>

        <Button
          onClick={openAddModal}
          className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm shrink-0"
        >
          <Plus size={16} className="mr-1.5" />
          <span>Add WhatsApp Contact</span>
        </Button>
      </div>

      {/* Contacts List */}
      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No WhatsApp Contacts Configured"
          description="Add a primary business WhatsApp number for customer and worker communication."
        />
      ) : (
        <div className="card overflow-hidden border border-gray-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Contact Name & Notes</th>
                  <th className="px-5 py-3.5">Phone Number</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contacts.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#25D366] flex items-center justify-center shrink-0">
                          <WhatsAppIcon size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{c.name}</p>
                          {c.notes && <p className="text-xs text-gray-400 mt-0.5">{c.notes}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono font-semibold text-xs text-gray-800">
                      {c.phoneNumber}
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {CATEGORY_LABELS[c.category] || c.category}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {c.isPrimary ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <Star size={11} className="fill-emerald-700" /> Primary
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(c._id)}
                          className="text-xs font-medium text-gray-500 hover:text-emerald-600 hover:underline"
                        >
                          Set Primary
                        </button>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {c.isActive ? (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          Disabled
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 size={15} />
                        </button>
                        {!c.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(c._id)}
                            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title={c.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <Power size={15} />
                          </button>
                        )}
                        {!c.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Contact"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingContact ? 'Edit WhatsApp Contact' : 'Add WhatsApp Contact'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Contact Label / Purpose *"
            placeholder="e.g. Primary Customer Support Helpline"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <Input
            label="WhatsApp Phone Number (with Country Code) *"
            placeholder="+1234567890"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Support Category</label>
            <select
              className="input-field text-sm"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="customer_support">Customer Support</option>
              <option value="booking_support">Booking Dispatch & Scheduling</option>
              <option value="worker_support">Provider & Freelancer Onboarding</option>
              <option value="general">General Marketplace Helpline</option>
            </select>
          </div>

          <Input
            label="Internal Notes (Optional)"
            placeholder="e.g. Mon-Fri 9am-6pm support queue"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              className="rounded text-emerald-600 focus:ring-emerald-500"
              checked={form.isPrimary}
              onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
            />
            <span>Designate as Primary Marketplace Contact Number</span>
          </label>

          <div className="flex gap-2 pt-3">
            <Button
              type="submit"
              loading={submitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold"
            >
              {editingContact ? 'Save Changes' : 'Create Contact'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              className="flex-1 text-sm"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
