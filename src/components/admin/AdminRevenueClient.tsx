'use client'

import { useState, useEffect } from 'react'

type RevenueData = {
  mrr: number
  plan_counts: Record<string, number>
  token_revenue_this_month: number
  total_active_paying: number
  recent_subscriptions: Array<{
    user_id: string
    plan: string
    status: string
    created_at: string
    profiles?: { email?: string }
  }>
}

const PLAN_PRICE: Record<string, number> = { free: 0, core: 29, pro: 79, enterprise: 199 }

export default function AdminRevenueClient() {
  const [data, setData] = useState<RevenueData | null>(null)

  useEffect(() => {
    fetch('/api/admin/revenue').then(r => r.json()).then(setData)
  }, [])

  if (!data) return <p className="text-[#8892A4]">Cargando...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Revenue</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'MRR', value: `$${data.mrr.toLocaleString()}` },
          { label: 'Clientes pagos', value: data.total_active_paying },
          { label: 'Token revenue (mes)', value: `$${data.token_revenue_this_month.toFixed(2)}` },
        ].map(card => (
          <div key={card.label} className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5">
            <p className="text-[#8892A4] text-xs uppercase tracking-wide mb-2">{card.label}</p>
            <p className="text-white text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5 mb-6">
        <h2 className="text-white font-semibold mb-4">Distribución por plan</h2>
        <div className="space-y-2">
          {Object.entries(data.plan_counts).map(([plan, count]) => (
            <div key={plan} className="flex items-center gap-3">
              <span className="w-20 text-sm text-[#8892A4] capitalize">{plan}</span>
              <div className="flex-1 bg-[#1E2A4A] rounded-full h-2">
                <div
                  className="bg-[#B8860B] h-2 rounded-full"
                  style={{ width: `${Math.min(100, (count / Math.max(1, data.total_active_paying + (data.plan_counts.free ?? 0))) * 100)}%` }}
                />
              </div>
              <span className="text-sm text-white w-8 text-right">{count}</span>
              <span className="text-xs text-[#8892A4] w-20 text-right">${(count * (PLAN_PRICE[plan] ?? 0)).toLocaleString()}/mes</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Suscripciones recientes</h2>
        <div className="space-y-2">
          {data.recent_subscriptions.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-[#1E2A4A] last:border-0">
              <span className="text-[#E2E8F0]">{s.profiles?.email ?? s.user_id.slice(0, 8)}</span>
              <span className="text-[#8892A4] capitalize">{s.plan}</span>
              <span className="text-[#8892A4] text-xs">{new Date(s.created_at).toLocaleDateString('es')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
