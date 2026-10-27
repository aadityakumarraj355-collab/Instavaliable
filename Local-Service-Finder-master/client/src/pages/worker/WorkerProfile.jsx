import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle, Clock } from 'lucide-react'
import { workerService } from '../../services/workerService'
import { useAuthStore } from '../../store/authStore'
import Input from '../../components/Input'
import Button from '../../components/Button'
import LoadingSpinner from '../../components/LoadingSpinner'
import PasswordChangeWithOtp from '../../components/PasswordChangeWithOtp'

export default function WorkerProfile() {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ bio: '', experience: '', hourlyRate: '', location: '', skills: '' })

  useEffect(() => {
    workerService
      .getProfile()
      .then(({ data }) => {
        const p = data.data
        setProfile(p)
        setForm({
          bio: p.bio || '',
          experience: p.experience || '',
          hourlyRate: p.hourlyRate || '',
          location: p.location || '',
          skills: (p.skills || []).join(', '),
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        skills: form.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }
      await workerService.updateProfile(payload)
      toast.success('Worker profile updated successfully')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner className="py-20" />

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Provider Profile & Security</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your trade details, experience, rates in INR, and account credentials.
        </p>
      </div>

      <div className="card p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-2xl font-bold text-white shadow-sm">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <div className="mt-1">
              {user?.isVerified ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                  <CheckCircle size={12} /> Verified Service Provider
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-semibold">
                  <Clock size={12} /> Under Review
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Professional Bio & Specializations
            </label>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="Tell clients about your trade, experience, warranty on work..."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>

          <Input
            label="Years of Experience"
            placeholder="e.g. 8 years certified master plumbing"
            value={form.experience}
            onChange={(e) => setForm({ ...form, experience: e.target.value })}
          />

          <Input
            label="Base Hourly Rate (₹ INR)"
            type="number"
            min="0"
            placeholder="e.g. 350"
            value={form.hourlyRate}
            onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
          />

          <Input
            label="Service Coverage Area"
            placeholder="e.g. South Delhi, Indiranagar, Bandra"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skills (Comma-separated)
            </label>
            <input
              className="input-field"
              placeholder="e.g. Pipe fitting, Leak detection, MCB repair"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
            />
          </div>

          <Button type="submit" loading={saving} className="bg-emerald-600 hover:bg-emerald-700">
            Save Provider Profile
          </Button>
        </form>
      </div>

      {/* Email OTP-Secured Password Update */}
      <PasswordChangeWithOtp />
    </div>
  )
}
