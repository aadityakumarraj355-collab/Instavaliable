import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  User,
  Briefcase,
  ShieldCheck,
  Check,
  AlertCircle,
  Mail,
  Clock,
  RotateCw,
  ArrowLeft,
  KeyRound,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'
import Input from '../../components/Input'
import Button from '../../components/Button'
import Logo from '../../components/Logo'

export default function Register() {
  const [searchParams] = useSearchParams()
  const initialEmail = searchParams.get('email') || ''

  // Step 1 = Registration Details, Step 2 = OTP Verification
  const [step, setStep] = useState(initialEmail ? 2 : 1)
  const [registeredEmail, setRegisteredEmail] = useState(initialEmail)
  const [otp, setOtp] = useState('')

  // Form State
  const [form, setForm] = useState({
    name: '',
    email: initialEmail,
    password: '',
    confirmPassword: '',
    role: 'client',
    location: '',
    phone: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)

  // 5-minute OTP countdown (300 seconds)
  const [timeLeft, setTimeLeft] = useState(300)
  const [canResend, setCanResend] = useState(false)

  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    let timer
    if (step === 2 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [step, timeLeft])

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const validatePasswordRules = (pwd) => {
    return {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
    }
  }

  const pwdChecks = validatePasswordRules(form.password)
  const isPasswordStrong = Object.values(pwdChecks).every(Boolean)

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    if (!form.email) e.email = 'Email address is required'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Please provide a valid email address'

    if (!isPasswordStrong) {
      e.password = 'Password does not meet strong security requirements'
    }

    if (form.password !== form.confirmPassword) {
      e.confirmPassword = 'Passwords do not match'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Handle Initial Registration -> Triggers Backend OTP Dispatch
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
        location: form.location.trim(),
        phone: form.phone.trim(),
      }

      const res = await authService.register(payload)
      const data = res.data

      // STRICT CHECK: Backend must explicitly report success
      if (data.success) {
        toast.success(data.message || 'OTP sent successfully. Please check your email.')
        setRegisteredEmail(form.email.trim())
        setStep(2)
        setTimeLeft(300)
        setCanResend(false)
      } else {
        toast.error(data.message || 'Unable to send OTP. Please try again later.')
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Unable to send OTP. Please verify email and SMTP settings.'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP Verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    const cleanOtp = otp.trim()
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return toast.error('Please enter the valid 6-digit numeric OTP')
    }

    setVerifying(true)
    try {
      const { data } = await authService.verifyRegistrationOtp({
        email: registeredEmail,
        otp: cleanOtp,
      })

      if (data.success && data.data?.token) {
        setAuth(data.data.user, data.data.token)
        toast.success('Account verified successfully! Welcome to Instavaliable.')
        const role = data.data.user.role
        navigate(role === 'worker' ? '/worker/dashboard' : '/dashboard')
      } else {
        toast.error(data.message || 'Verification failed. Please check OTP.')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP')
    } finally {
      setVerifying(false)
    }
  }

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (!registeredEmail) {
      return toast.error('No email address found to resend OTP')
    }

    setResending(true)
    try {
      const { data } = await authService.resendRegistrationOtp({ email: registeredEmail })

      if (data.success) {
        toast.success(data.message || 'OTP sent successfully. Please check your email.')
        setTimeLeft(300)
        setCanResend(false)
        setOtp('')
      } else {
        toast.error(data.message || 'Unable to resend OTP. Please try again later.')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/60 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Logo size="lg" showTagline={true} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-4">
            {step === 1 ? 'Join Instavaliable' : 'Verify Your Email'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 1
              ? 'Connect with nearby clients and verified skilled professionals'
              : 'Enter the single-use verification code sent to your email'}
          </p>
        </div>

        <div className="card p-8 bg-white border border-gray-100 shadow-md rounded-2xl">
          {/* STEP 1: Registration Information Form */}
          {step === 1 && (
            <>
              {/* Role selector */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { value: 'client', label: 'I need services', subtitle: 'Customer', icon: User },
                  { value: 'worker', label: 'I offer services', subtitle: 'Service Provider', icon: Briefcase },
                ].map(({ value, label, subtitle, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, role: value })}
                    className={`flex flex-col items-center gap-1.5 p-3.5 rounded-xl border-2 transition-all ${
                      form.role === value
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-800'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Icon size={20} className={form.role === value ? 'text-emerald-600' : 'text-gray-400'} />
                    <span className="text-xs font-bold">{label}</span>
                    <span className="text-[10px] text-gray-400">{subtitle}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="e.g. Ramesh Kumar"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  error={errors.name}
                  required
                />

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
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    error={errors.password}
                    required
                  />

                  {/* Password strength visual guidelines */}
                  {form.password && (
                    <div className="mt-2.5 p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-1.5 text-xs text-gray-600">
                      <p className="font-semibold text-gray-700 text-[11px] mb-1">Password Requirements:</p>
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
                          {pwdChecks.special ? <Check size={12} /> : '○'} Special character (!@#$%^&*)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  error={errors.confirmPassword}
                  required
                />

                <Input
                  label="City / Location"
                  placeholder="e.g. Bangalore, Mumbai, Delhi"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />

                <Input
                  label="Phone / WhatsApp Contact"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 py-2.5 mt-2 shadow-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Mail size={16} />
                  {loading ? 'Sending Verification OTP...' : 'Register & Send OTP'}
                </Button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
                  Sign In
                </Link>
              </p>
            </>
          )}

          {/* STEP 2: Email OTP Verification Screen */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Mail size={20} />
                </div>
                <p className="text-xs text-gray-600">Verification code sent to:</p>
                <p className="text-sm font-bold text-gray-900 break-all">{registeredEmail}</p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 text-center">
                    Enter 6-Digit Email OTP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 px-4 border-2 border-emerald-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 bg-gray-50/50"
                    autoFocus
                    required
                  />
                </div>

                {/* Expiration Timer & Resend Controls */}
                <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                  <div className="flex items-center gap-1 font-medium">
                    <Clock size={13} className={timeLeft <= 30 ? 'text-rose-500' : 'text-emerald-600'} />
                    <span className={timeLeft <= 30 ? 'text-rose-600 font-bold' : 'text-gray-700'}>
                      {timeLeft > 0 ? `Expires in ${formatTimer(timeLeft)}` : 'OTP Expired'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending || (!canResend && timeLeft > 240)}
                    className="text-emerald-600 hover:text-emerald-700 font-semibold disabled:text-gray-400 flex items-center gap-1 transition-colors"
                  >
                    <RotateCw size={12} className={resending ? 'animate-spin' : ''} />
                    {resending ? 'Sending...' : 'Resend OTP'}
                  </button>
                </div>

                <Button
                  type="submit"
                  loading={verifying}
                  disabled={otp.length !== 6 || timeLeft === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 py-2.5 shadow-sm font-semibold"
                >
                  {verifying ? 'Verifying...' : 'Verify & Activate Account'}
                </Button>
              </form>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setOtp('')
                  }}
                  className="text-gray-500 hover:text-gray-800 flex items-center gap-1"
                >
                  <ArrowLeft size={13} />
                  Change registration details
                </button>

                <Link to="/login" className="text-emerald-600 hover:underline font-semibold">
                  Go to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
