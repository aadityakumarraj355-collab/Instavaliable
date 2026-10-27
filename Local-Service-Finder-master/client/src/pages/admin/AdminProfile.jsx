import { useEffect, useState } from 'react'
import { Shield, User, Lock, Phone, Mail, CheckCircle2, Key } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminService } from '../../services/adminService'
import { useAuthStore } from '../../store/authStore'
import Input from '../../components/Input'
import Button from '../../components/Button'
import PasswordChangeWithOtp from '../../components/PasswordChangeWithOtp'

export default function AdminProfile() {
  const { user, updateUser } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    profileImage: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    adminService
      .getAdminProfile()
      .then(({ data }) => {
        const p = data.data
        setProfile(p)
        setForm((prev) => ({
          ...prev,
          name: p.name || '',
          phone: p.phone || '',
          profileImage: p.profileImage || '',
        }))
      })
      .catch(() => toast.error('Failed to load profile details'))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.newPassword) {
      if (form.newPassword.length < 8) {
        return toast.error('New password must be at least 8 characters long')
      }
      if (form.newPassword !== form.confirmPassword) {
        return toast.error('New password confirmation does not match')
      }
      if (!form.currentPassword) {
        return toast.error('Current password is required to set a new password')
      }
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        profileImage: form.profileImage,
      }
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword
        payload.newPassword = form.newPassword
      }

      const { data } = await adminService.updateAdminProfile(payload)
      const updated = data.data.user
      setProfile(updated)
      updateUser({ ...user, ...updated })
      toast.success('Admin profile updated successfully')
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-sm text-gray-500">Loading admin profile...</div>
  }

  const isSuper = profile?.role === 'super_admin'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Administrator Profile</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Manage your administrative contact details and update your security credentials.
        </p>
      </div>

      <div className="card p-6 sm:p-8 border border-gray-100 shadow-sm">
        {/* Profile Card Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100 mb-6">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-md ${
              isSuper
                ? 'bg-gradient-to-tr from-purple-600 to-indigo-500'
                : 'bg-gradient-to-tr from-emerald-600 to-teal-500'
            }`}
          >
            {profile?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{profile?.name}</h2>
              {isSuper ? (
                <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-200">
                  👑 Super Admin
                </span>
              ) : (
                <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                  🛡️ Administrator
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{profile?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Contact Details */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              1. Contact Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                label="Email (Fixed Identifier)"
                value={profile?.email}
                disabled
                className="bg-gray-50 cursor-not-allowed"
              />
              <Input
                label="Direct Phone Number"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Input
                label="Avatar / Image URL (Optional)"
                placeholder="https://example.com/avatar.png"
                value={form.profileImage}
                onChange={(e) => setForm({ ...form, profileImage: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              loading={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl"
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Email OTP Protected Password Update */}
      <PasswordChangeWithOtp />
    </div>
  )
}
