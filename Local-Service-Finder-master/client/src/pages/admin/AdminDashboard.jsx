import { useEffect, useState } from 'react'
import { Users, Briefcase, CalendarCheck, UserCheck, TrendingUp } from 'lucide-react'
import { adminService } from '../../services/adminService'
import StatCard from '../../components/StatCard'
import LoadingSpinner from '../../components/LoadingSpinner'

// Pure SVG bar chart
function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  const W = 480, H = 120, pad = 32, barW = Math.floor((W - pad * 2) / data.length) - 6

  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full">
      {data.map((d, i) => {
        const barH = Math.max(4, (d.count / max) * H)
        const x = pad + i * ((W - pad * 2) / data.length)
        const y = H - barH
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={4}
              className="fill-primary-500 opacity-80 hover:opacity-100 transition-opacity" />
            {d.count > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={10} className="fill-gray-500">{d.count}</text>
            )}
            <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize={10} className="fill-gray-400">{d.date}</text>
          </g>
        )
      })}
    </svg>
  )
}

// Pure SVG donut chart
function DonutChart({ segments }) {
  const total = segments.reduce((s, d) => s + d.value, 0) || 1
  const r = 52, cx = 70, cy = 70, stroke = 22
  let offset = 0

  const arcs = segments.map((seg) => {
    const pct = seg.value / total
    const dash = pct * 2 * Math.PI * r
    const gap = 2 * Math.PI * r - dash
    const arc = { ...seg, dash, gap, offset }
    offset += dash
    return arc
  })

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 140 140" className="w-32 h-32 shrink-0">
        {arcs.map((arc, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            strokeWidth={stroke}
            stroke={arc.color}
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
          />
        ))}
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize={14} fontWeight="bold" className="fill-gray-700">{total}</text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: seg.color }} />
            <span className="text-gray-600">{seg.label}</span>
            <span className="font-semibold text-gray-900 ml-auto pl-4">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService.getStats()
      .then(({ data }) => setStats(data.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner className="py-20" />

  const bs = stats?.bookingsByStatus || {}
  const donutSegments = [
    { label: 'Pending',   value: bs.pending   || 0, color: '#f97316' },
    { label: 'Accepted',  value: bs.accepted  || 0, color: '#3b82f6' },
    { label: 'Completed', value: bs.completed || 0, color: '#22c55e' },
    { label: 'Cancelled', value: bs.cancelled || 0, color: '#ef4444' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform overview and statistics.</p>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users"  value={stats?.totalUsers    ?? 0} icon={Users}        color="blue"   />
        <StatCard title="Workers"      value={stats?.totalWorkers  ?? 0} icon={UserCheck}    color="green"  />
        <StatCard title="Services"     value={stats?.totalServices ?? 0} icon={Briefcase}    color="purple" />
        <StatCard title="Bookings"     value={stats?.totalBookings ?? 0} icon={CalendarCheck} color="orange" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-primary-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Bookings — Last 7 Days</h2>
          </div>
          {stats?.bookingsLast7Days?.length ? (
            <BarChart data={stats.bookingsLast7Days} />
          ) : (
            <p className="text-sm text-gray-400 py-8 text-center">No data yet</p>
          )}
        </div>

        {/* Donut chart */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarCheck size={16} className="text-primary-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Bookings by Status</h2>
          </div>
          <DonutChart segments={donutSegments} />
        </div>
      </div>

      {/* User breakdown */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 text-sm mb-4">User Breakdown</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Clients', value: stats?.totalClients ?? 0, color: 'bg-gray-100 text-gray-700' },
            { label: 'Workers', value: stats?.totalWorkers ?? 0, color: 'bg-blue-100 text-blue-700' },
            { label: 'Total',   value: stats?.totalUsers   ?? 0, color: 'bg-primary-100 text-primary-700' },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl p-4 ${item.color}`}>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs font-medium mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
