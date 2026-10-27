import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import Input from '../../components/Input'
import Button from '../../components/Button'
import PasswordChangeWithOtp from '../../components/PasswordChangeWithOtp'

export default function ClientProfile() {
  const { user, updateUser } = useAuthStore()
  const [form, setForm] = useState({ name: user?.name || '', location: user?.location || '', phone: user?.phone || '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      updateUser({ ...user, ...form })
      toast.success('Profile updated')
      setSaving(false)
    }, 400)
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your customer profile and account security credentials.</p>
      </div>

      <div className="card p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-800 shadow-inner">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full capitalize mt-1 inline-block">
              {user?.role} Account
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Phone / WhatsApp Contact" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Location" placeholder="City, State" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input label="Email (Primary Identity)" value={user?.email} disabled className="bg-gray-50 cursor-not-allowed" />
          <Button type="submit" loading={saving} className="bg-emerald-600 hover:bg-emerald-700">Save Changes</Button>
        </form>
      </div>

      {/* Email OTP-Secured Password Update */}
      <PasswordChangeWithOtp />
    </div>
  )
}
