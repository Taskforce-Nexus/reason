'use client'

import { useState, useEffect } from 'react'

type MarketplaceData = {
  total_advisors: number
  native_advisors: number
  custom_advisors: number
  by_category: Record<string, number>
  top_advisors: Array<{ id: string; name: string; category: string; is_native: boolean; usage_count: number }>
}

const CATEGORY_ES: Record<string, string> = {
  negocio: 'Negocio',
  ux_producto: 'UX/Producto',
  tecnico: 'Técnico',
  investigacion: 'Investigación',
  precios: 'Precios',
}

export default function AdminMarketplaceClient() {
  const [data, setData] = useState<MarketplaceData | null>(null)

  useEffect(() => {
    fetch('/api/admin/marketplace').then(r => r.json()).then(setData)
  }, [])

  if (!data) return <p className="text-[#8892A4]">Cargando...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Marketplace</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total asesores', value: data.total_advisors },
          { label: 'Nativos', value: data.native_advisors },
          { label: 'Personalizados', value: data.custom_advisors },
        ].map(card => (
          <div key={card.label} className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5">
            <p className="text-[#8892A4] text-xs uppercase tracking-wide mb-2">{card.label}</p>
            <p className="text-white text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Por categoría</h2>
          <div className="space-y-3">
            {Object.entries(data.by_category).map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-[#8892A4] text-sm flex-1">{CATEGORY_ES[cat] ?? cat}</span>
                <div className="w-24 bg-[#1E2A4A] rounded-full h-1.5">
                  <div
                    className="bg-[#B8860B] h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, (count / data.total_advisors) * 100)}%` }}
                  />
                </div>
                <span className="text-white text-sm w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Más usados en consejos</h2>
          <div className="space-y-3">
            {data.top_advisors.map((a, i) => (
              <div key={a.id} className="flex items-center gap-3 text-sm">
                <span className="text-[#4A5568] w-5">{i + 1}.</span>
                <div className="flex-1">
                  <p className="text-white">{a.name}</p>
                  <p className="text-[#8892A4] text-xs">{CATEGORY_ES[a.category] ?? a.category} · {a.is_native ? 'Nativo' : 'Custom'}</p>
                </div>
                <span className="text-[#8892A4]">{a.usage_count}x</span>
              </div>
            ))}
            {data.top_advisors.length === 0 && <p className="text-[#4A5568] text-sm">Sin datos aún</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
