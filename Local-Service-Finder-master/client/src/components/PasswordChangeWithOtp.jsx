import { useState } from 'react'
import { ShieldCheck, Mail, Lock, Check, KeyRound, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import Input from './Input'
import Button from './Button'

export default function PasswordChangeWithOtp() {
  const { user, setAuth } = useAuthStore()

  const [step, setStep] = useState(1) // 1 = Request OTP, 2 = Enter OTP + New Password
  const [requestingOtp, setRequestingOtp] = useState(false)
  const [updatingPassword, setUpdatingPassword] = useState(false)

  const [form, setForm] = useState({
    currentPassword: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})

  const validatePasswordRules = (pwd) => {
    return {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
    }
  }

  const pwdChecks = validatePasswordRules(form.newPassword)
  const isPasswordStrong = Object.values(pwdChecks).every(Boolean)

  const handleRequestOtp = async () => {
    setRequestingOtp(true)
    try {
      const { data } = await api.post('/auth/request-password-change-otp')
      if (data.success) {
        toast.success(data.message || 'OTP sent successfully. Please check your email.')
        setStep(2)
      } else {
        toast.error(data.message || 'Unable to send OTP. Please try again later.')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to send OTP. Please try again later.')
    } finally {
      setRequestingOtp(false)
    }
  }

  const handleConfirmPasswordChange = async (e) => {
    e.preventDefault()
    const errs = {}

    if (!form.currentPassword) errs.currentPassword = 'Current password is required'
    if (!form.otp || form.otp.length !== 6) errs.otp = 'Please enter the 6-digit OTP'
    if (!isPasswordStrong) errs.newPassword = 'New password does not meet security requirements'
    if (form.newPassword !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setUpdatingPassword(true)
    try {
      const { data } = await api.post('/auth/confirm-password-change', {
        currentPassword: form.currentPassword,
        otp: form.otp.trim(),
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      })

      if (data.data?.token) {
        setAuth(user, data.data.token)
      }

      toast.success('Your password has been securely changed!')
      setStep(1)
      setForm({
        currentPassword: '',
        otp: '',
        newPassword: '',
        confirmPassword: '',
      })
      setErrors({})
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password')
    } finally {
      setUpdatingPassword(false)
    }
  }

  return (
    <div className="card p-6 border border-gray-100 shadow-sm bg-white rounded-2xl space-y-5">
      <div className="flex items-start justify-between border-b border-gray-100 pb-4">
        <div>
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <KeyRound size={18} className="text-emerald-600" />
            Security & Password Change
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Requires single-use email OTP verification to protect against unauthorized updates.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <ShieldCheck size={12} /> Email OTP Protected
        </span>
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Registered Verification Email
                </p>
                <p className="font-semibold text-gray-900 text-sm mt-0.5">{user?.email}</p>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleRequestOtp}
              loading={requestingOtp}
              className="bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap text-xs py-2 px-3.5"
            >
              Send OTP Code
            </Button>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Clicking the button sends an encrypted 6-digit code valid for 10 minutes.
          </p>
        </div>
      ) : (
        <form onSubmit={handleConfirmPasswordChange} className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-800 flex items-center justify-between gap-2">
            <span>
              Verification code sent to <strong>{user?.email}</strong>. Code expires in 10 minutes.
            </span>
            <button
              type="button"
              onClick={handleRequestOtp}
              disabled={requestingOtp}
              className="text-emerald-700 hover:text-emerald-900 font-bold underline shrink-0"
            >
              {requestingOtp ? 'Sending...' : 'Resend'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              error={errors.currentPassword}
              required
            />
            <Input
              label="6-Digit Email OTP Code"
              type="text"
              maxLength={6}
              placeholder="e.g. 582914"
              value={form.otp}
              onChange={(e) => setForm({ ...form, otp: e.target.value })}
              error={errors.otp}
              required
            />
          </div>

          <div>
            <Input
              label="New Strong Password"
              type="password"
              placeholder="Min. 8 characters with upper, lower, number, symbol"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              error={errors.newPassword}
              required
            />

            {form.newPassword && (
              <div className="mt-2 p-2.5 bg-gray-50 border border-gray-100 rounded-xl space-y-1 text-xs text-gray-600">
                <p className="font-semibold text-gray-700 text-[11px]">Complexity Requirements:</p>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <span className={`flex items-center gap-1 ${pwdChecks.length ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                    {pwdChecks.length ? <Check size={12} /> : '○'} 8+ characters
                  </span>
                  <span className={`flex items-center gap-1 ${pwdChecks.uppercase ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                    {pwdChecks.uppercase ? <Check size={12} /> : '○'} Uppercase (A-Z)
                  </span>
                  <span className={`flex items-center gap-1 ${pwdChecks.lowercase ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                    {pwdChecks.lowercase ? <Check size={12} /> : '○'} Lowercase (a-z)
                  </span>
                  <span className={`flex items-center gap-1 ${pwdChecks.number ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                    {pwdChecks.number ? <Check size={12} /> : '○'} Number (0-9)
                  </span>
                  <span className={`flex items-center gap-1 col-span-2 ${pwdChecks.special ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                    {pwdChecks.special ? <Check size={12} /> : '○'} Special symbol (!@#$%^&*)
                  </span>
                </div>
              </div>
            )}
          </div>

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter new password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            error={errors.confirmPassword}
            required
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              loading={updatingPassword}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-semibold"
            >
              Verify OTP & Update Password
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setStep(1)
                setErrors({})
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
