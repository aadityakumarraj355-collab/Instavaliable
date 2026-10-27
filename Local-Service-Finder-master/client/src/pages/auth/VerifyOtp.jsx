import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Mail, Clock, RotateCw, ArrowLeft, ShieldCheck, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'
import Input from '../../components/Input'
import Button from '../../components/Button'
import Logo from '../../components/Logo'

export default function VerifyOtp() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const initialEmail = searchParams.get('email') || ''

  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState('')
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [canResend, setCanResend] = useState(false)
  // Only assume OTP is already sent if specifically indicated by navigation state
  const [otpSent, setOtpSent] = useState(Boolean(location.state?.otpSent))

  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    let timer
    if (otpSent && timeLeft > 0) {
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
  }, [otpSent, timeLeft])

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const handleSendOtp = async (e) => {
    e?.preventDefault()
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return toast.error('Please enter a valid email address')
    }

    setResending(true)
    try {
      const res = await authService.resendRegistrationOtp({ email: email.trim() })
      if (res.data.success) {
        toast.success(res.data.message || 'OTP sent successfully. Please check your email.')
        setOtpSent(true)
        setTimeLeft(300)
        setCanResend(false)
        setOtp('')
      } else {
        toast.error(res.data.message || 'Unable to send OTP. Please try again later.')
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Unable to send OTP. Please try again later.'
      )
    } finally {
      setResending(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!email) return toast.error('Please enter your email address')
    const cleanOtp = otp.trim()
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return toast.error('Please enter a valid 6-digit verification OTP')
    }

    setVerifying(true)
    try {
      const { data } = await authService.verifyRegistrationOtp({
        email: email.trim(),
        otp: cleanOtp,
      })

      if (data.success && data.data?.token) {
        setAuth(data.data.user, data.data.token)
        toast.success('Account verified successfully! Welcome to Instavaliable.')
        const role = data.data.user.role
        navigate(role === 'worker' ? '/worker/dashboard' : '/dashboard')
      } else {
        toast.error(data.message || 'Verification failed')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/60 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Logo size="lg" showTagline={true} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-4">Account Verification</h1>
          <p className="text-gray-500 text-sm mt-1">
            Complete your email OTP verification to activate your account
          </p>
        </div>

        <div className="card p-8 bg-white border border-gray-100 shadow-md rounded-2xl space-y-6">
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Input
                label="Registered Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button
                type="submit"
                loading={resending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 py-2.5 font-semibold flex items-center justify-center gap-2"
              >
                <Mail size={16} />
                {resending ? 'Sending OTP...' : 'Send Verification OTP'}
              </Button>
            </form>
          ) : (
            <>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Mail size={20} />
                </div>
                <p className="text-xs text-gray-600">Verification code sent to:</p>
                <p className="text-sm font-bold text-gray-900 break-all">{email}</p>
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

                <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                  <div className="flex items-center gap-1 font-medium">
                    <Clock size={13} className={timeLeft <= 30 ? 'text-rose-500' : 'text-emerald-600'} />
                    <span className={timeLeft <= 30 ? 'text-rose-600 font-bold' : 'text-gray-700'}>
                      {timeLeft > 0 ? `Expires in ${formatTimer(timeLeft)}` : 'OTP Expired'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendOtp}
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
                    setOtpSent(false)
                    setOtp('')
                  }}
                  className="text-gray-500 hover:text-gray-800 flex items-center gap-1"
                >
                  <ArrowLeft size={13} />
                  Change email address
                </button>

                <Link to="/login" className="text-emerald-600 hover:underline font-semibold">
                  Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
