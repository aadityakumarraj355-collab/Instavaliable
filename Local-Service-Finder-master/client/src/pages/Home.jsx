import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Search,
  MapPin,
  Shield,
  Clock,
  Star,
  Sparkles,
  Wrench,
  Zap,
  Hammer,
  Paintbrush,
  Leaf,
  Truck,
  BookOpen,
  ChefHat,
  PawPrint,
  CheckCircle2,
  HardHat,
  Laptop,
  Users,
  Compass,
  ArrowRight,
} from 'lucide-react'
import { CATEGORIES } from '../utils/helpers'
import WhatsAppButton from '../components/WhatsAppButton'
import { DEFAULT_WHATSAPP_NUMBER, buildWhatsAppLink } from '../utils/whatsapp'
import logoImg from '../assets/logo.jpeg'

const categoryIcons = {
  Cleaning: Sparkles,
  Plumbing: Wrench,
  Electrical: Zap,
  Carpentry: Hammer,
  Painting: Paintbrush,
  Gardening: Leaf,
  Moving: Truck,
  Tutoring: BookOpen,
  Cooking: ChefHat,
  'Pet Care': PawPrint,
}

export default function Home() {
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (keyword) params.set('keyword', keyword)
    if (location) params.set('location', location)
    navigate(`/services?${params.toString()}`)
  }

  const pillars = [
    {
      title: 'Freelancers',
      subtitle: '(Earn)',
      desc: 'Independent talent providing top digital & local craft skills.',
      icon: Laptop,
      color: 'text-emerald-500 bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Professionals',
      subtitle: '(Grow)',
      desc: 'Certified local tradesmen, plumbers, electricians & technicians.',
      icon: HardHat,
      color: 'text-blue-500 bg-blue-50 border-blue-200',
    },
    {
      title: 'Customers',
      subtitle: '(Get Service)',
      desc: 'Effortless on-demand bookings with direct WhatsApp messaging.',
      icon: Users,
      color: 'text-purple-500 bg-purple-50 border-purple-200',
    },
    {
      title: 'Nearby',
      subtitle: '(Fast & Easy)',
      desc: 'Immediate dispatch and verified local experts in your area.',
      icon: Compass,
      color: 'text-amber-500 bg-amber-50 border-amber-200',
    },
  ]

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B1020] via-[#0F172A] to-[#1E293B] text-white py-20 px-4 sm:px-6 lg:px-8">
        {/* Glow ambient effects */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold mb-6 uppercase tracking-wider backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Local Services · On Demand
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-5 leading-tight">
            Find Trusted Local Services{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
              Instantly Available
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Connect with skilled freelancers and verified local service professionals.
            Zero payment gateway hurdles — seamless booking and direct communication via WhatsApp.
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearch}
            className="bg-white p-2.5 rounded-2xl flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto shadow-2xl border border-gray-100"
          >
            <div className="flex items-center gap-2.5 flex-1 px-3">
              <Search size={18} className="text-emerald-500 shrink-0" />
              <input
                className="flex-1 outline-none text-gray-900 placeholder-gray-400 text-sm py-2"
                placeholder="What service do you need? (e.g. Plumbing, Cleaning)"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2.5 flex-1 px-3 border-t sm:border-t-0 sm:border-l border-gray-200">
              <MapPin size={18} className="text-blue-500 shrink-0" />
              <input
                className="flex-1 outline-none text-gray-900 placeholder-gray-400 text-sm py-2"
                placeholder="City, neighborhood, or ZIP"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-7 py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-sm shrink-0"
            >
              Search
            </button>
          </form>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-400" /> 100% Free Booking Enquiries
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-400" /> Direct WhatsApp Connect
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-400" /> Verified Local Pros
            </span>
          </div>
        </div>
      </section>

      {/* 4 Pillars Section (From Instavaliable Brand Logo) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
            The Instavaliable Ecosystem
          </h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Built for Everyone in the Community
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon
            return (
              <div
                key={pillar.title}
                className="card p-6 border hover:border-emerald-300 hover:shadow-lg transition-all duration-300 group"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border transition-transform group-hover:scale-110 ${pillar.color}`}
                >
                  <Icon size={26} />
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <h3 className="font-bold text-gray-900 text-lg">{pillar.title}</h3>
                  <span className="text-xs font-semibold text-emerald-600">{pillar.subtitle}</span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">{pillar.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* WhatsApp Direct Connect Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl space-y-3 text-center lg:text-left">
            <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-100">
              No Payment Gateway Hassles
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              Instant Booking & Direct WhatsApp Chat
            </h2>
            <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
              Every booking request receives a unique identifier (e.g.{' '}
              <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white font-bold">INS-2026-000123</span>).
              Chat with service providers directly on WhatsApp to coordinate schedules, scope, and settlement.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <WhatsAppButton
              size="lg"
              href={buildWhatsAppLink(
                DEFAULT_WHATSAPP_NUMBER,
                'Hello Instavaliable! I would like to enquire about available local services in my area.'
              )}
            >
              Connect on WhatsApp
            </WhatsAppButton>
            <Link
              to="/services"
              className="inline-flex items-center justify-center font-semibold text-sm px-6 py-3.5 bg-white text-gray-900 hover:bg-slate-100 rounded-xl transition-all shadow-sm"
            >
              Explore Services <ArrowRight size={16} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Popular Service Categories</h2>
            <p className="text-sm text-gray-500 mt-1">
              Select any category to find qualified professionals ready on demand.
            </p>
          </div>
          <Link
            to="/services"
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
          >
            View all categories <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = categoryIcons[cat] || Wrench
            return (
              <Link
                key={cat}
                to={`/services?category=${encodeURIComponent(cat)}`}
                className="card p-5 text-center hover:shadow-md transition-all hover:border-emerald-300 hover:-translate-y-1 group"
              >
                <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 flex items-center justify-center mb-3 group-hover:bg-emerald-500 transition-colors">
                  <Icon
                    size={24}
                    className="text-emerald-600 group-hover:text-white transition-colors"
                  />
                </div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-emerald-600">
                  {cat}
                </p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Features: Why Instavaliable? */}
      <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
              The Instavaliable Advantage
            </h2>
            <p className="text-3xl font-extrabold text-gray-900">
              Why Choose Instavaliable?
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Verified Professionals',
                desc: 'All tradespeople and service providers undergo admin verification for quality and safety.',
              },
              {
                icon: Zap,
                title: 'Real-Time Notifications',
                desc: 'Powered by Socket.io, both workers and clients receive instant live updates on requests.',
              },
              {
                icon: Clock,
                title: 'Instant WhatsApp Booking',
                desc: 'Seamless click-to-chat with automated request summaries. Fast, accessible, and transparent.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center p-4">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 rounded-2xl mb-4 text-emerald-600">
                  <Icon size={26} />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="max-w-5xl mx-auto px-4 text-center">
        <div className="card p-10 bg-gradient-to-br from-emerald-50/60 to-blue-50/60 border border-emerald-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Ready to get started?</h2>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto text-sm sm:text-base">
            Join thousands of clients, freelancers, and service providers on Instavaliable today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-sm text-sm"
            >
              Get Started as Customer
            </Link>
            <Link
              to="/register"
              className="btn-secondary px-6 py-3 rounded-xl text-sm font-semibold hover:border-emerald-300"
            >
              Offer Services as Pro
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
