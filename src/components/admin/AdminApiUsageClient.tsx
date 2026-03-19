'use client'

import { useState, useEffect } from 'react'

type ApiUsageData = {
  total_cost_usd: number
  total_input_tokens: number
  total_output_tokens: number
  total_calls: number
  per_model: Record<string, { calls: number; cost_usd: number }>
  top_users: Array<{ user_id: string; cost_usd: number }>
}

export default function AdminApiUsageClient() {
  const [data, setData] = useState<ApiUsageData | null>(null)

  useEffect(() => {
    fetch('/api/admin/api-usage').then(r => r.json()).then(setData)
  }, [])

  if (!data) return <p className="text-[#8892A4]">Cargando...</p>

  const totalTokens = data.total_input_tokens + data.total_output_tokens

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">API Usage <span className="text-[#8892A4] text-sm font-normal">(este mes)</span></h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Costo Anthropic', value: `$${data.total_cost_usd.toFixed(4)}` },
          { label: 'Total tokens', value: (totalTokens / 1000).toFixed(1) + 'K' },
          { label: 'Llamadas', value: data.total_calls },
          { label: 'Avg / llamada', value: data.total_calls > 0 ? `$${(data.total_cost_usd / data.total_calls).toFixed(5)}` : '—' },
        ].map(card => (
          <div key={card.label} className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5">
            <p className="text-[#8892A4] text-xs uppercase tracking-wide mb-2">{card.label}</p>
            <p className="text-white text-xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Por modelo</h2>
          <div className="space-y-3">
            {Object.entries(data.per_model)
              .sort((a, b) => b[1].cost_usd - a[1].cost_usd)
              .map(([model, stats]) => (
                <div key={model} className="flex items-center justify-between text-sm">
                  <span className="text-[#8892A4] truncate max-w-[200px]">{model}</span>
                  <span className="text-white">{stats.calls} calls</span>
                  <span className="text-[#B8860B]">${stats.cost_usd.toFixed(4)}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Top usuarios por costo</h2>
          <div className="space-y-3">
            {data.top_users.map((u, i) => (
              <div key={u.user_id} className="flex items-center gap-3 text-sm">
                <span className="text-[#4A5568] w-5">{i + 1}.</span>
                <span className="text-[#8892A4] flex-1 font-mono text-xs">{u.user_id.slice(0, 12)}…</span>
                <span className="text-[#B8860B]">${u.cost_usd.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
