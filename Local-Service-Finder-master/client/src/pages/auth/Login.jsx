import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Mail, KeyRound, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { authService } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'
import Input from '../../components/Input'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import Logo from '../../components/Logo'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  // Forgot Password / OTP Reset Modal state
  const [forgotModal, setForgotModal] = useState(false)
  const [forgotStep, setForgotStep] = useState(1) // 1 = Email, 2 = OTP + New Password
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('')
  const [sendingResetOtp, setSendingResetOtp] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { data } = await authService.login(form)
      setAuth(data.data.user, data.data.token)
      toast.success('Welcome back to Instavaliable!')
      const role = data.data.user.role
      if (role === 'admin') navigate('/admin/dashboard')
      else if (role === 'worker') navigate('/worker/dashboard')
      else navigate('/dashboard')
    } catch (err) {
      if (err.response?.data?.isUnverified) {
        toast.error(err.response.data.message)
        navigate(`/verify-otp?email=${encodeURIComponent(form.email.trim())}`)
        return
      }
      const msg = err.response?.data?.message || 'Login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestResetOtp = async (e) => {
    e.preventDefault()
    if (!forgotEmail || !/^\S+@\S+\.\S+$/.test(forgotEmail)) {
      return toast.error('Please enter a valid registered email address')
    }
    setSendingResetOtp(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { email: forgotEmail.trim() })
      if (data.success) {
        toast.success(data.message || 'OTP sent successfully. Please check your email.')
        setForgotStep(2)
      } else {
        toast.error(data.message || 'Unable to send OTP. Please try again later.')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to send OTP. Please try again later.')
    } finally {
      setSendingResetOtp(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!forgotOtp || forgotOtp.length !== 6) {
      return toast.error('Please enter the 6-digit OTP')
    }
    if (forgotNewPassword.length < 8) {
      return toast.error('Password must be at least 8 characters long')
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      return toast.error('Passwords do not match')
    }

    setResettingPassword(true)
    try {
      const { data } = await api.post('/auth/reset-password', {
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword,
        confirmPassword: forgotConfirmPassword,
      })
      toast.success(data.message || 'Password reset successfully! Please sign in.')
      setForgotModal(false)
      setForgotStep(1)
      setForm({ email: forgotEmail.trim(), password: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed')
    } finally {
      setResettingPassword(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/60 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Logo size="lg" showTagline={true} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-4">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="card p-8 bg-white border border-gray-100 shadow-md rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              required
            />
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-700">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(form.email || '')
                    setForgotStep(1)
                    setForgotModal(true)
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className="input-field text-sm"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <Button type="submit" loading={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 mt-2 py-2.5 font-semibold">
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-600 font-semibold hover:underline">
              Create an Account
            </Link>
          </p>
        </div>
      </div>

      {/* Secure Email OTP Password Reset Modal */}
      <Modal
        isOpen={forgotModal}
        onClose={() => setForgotModal(false)}
        title="Secure Password Recovery"
      >
        {forgotStep === 1 ? (
          <form onSubmit={handleRequestResetOtp} className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-800">
              <span className="font-bold">Email OTP Verification:</span> Enter your registered email address. We will dispatch a single-use 6-digit verification code valid for 5 minutes.
            </div>

            <Input
              label="Registered Email Address"
              type="email"
              placeholder="you@example.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
            />

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={sendingResetOtp} className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-semibold">
                Send Verification Code
              </Button>
              <Button type="button" variant="secondary" onClick={() => setForgotModal(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
              <span>Code sent to <strong>{forgotEmail}</strong></span>
              <button
                type="button"
                onClick={handleRequestResetOtp}
                disabled={sendingResetOtp}
                className="text-emerald-700 font-bold underline"
              >
                {sendingResetOtp ? 'Sending...' : 'Resend'}
              </button>
            </div>

            <Input
              label="6-Digit Verification Code"
              type="text"
              maxLength={6}
              placeholder="e.g. 849201"
              value={forgotOtp}
              onChange={(e) => setForgotOtp(e.target.value)}
              required
            />

            <Input
              label="New Strong Password (min. 8 characters)"
              type="password"
              placeholder="••••••••••••"
              value={forgotNewPassword}
              onChange={(e) => setForgotNewPassword(e.target.value)}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••••••"
              value={forgotConfirmPassword}
              onChange={(e) => setForgotConfirmPassword(e.target.value)}
              required
            />

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={resettingPassword} className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-semibold">
                Reset Password
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setForgotStep(1)}
                className="flex-1"
              >
                Back
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
