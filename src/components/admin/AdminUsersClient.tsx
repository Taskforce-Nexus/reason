'use client'

import { useState, useEffect, useCallback } from 'react'

type UserRow = {
  id: string
  email: string
  name: string
  role: string
  plan: string
  balance_usd: number
  projects: number
  sessions_this_month: number
  created_at: string
}

const PLAN_BADGE: Record<string, string> = {
  free: 'bg-[#1E2A4A] text-[#8892A4]',
  core: 'bg-blue-900/40 text-blue-300',
  pro: 'bg-purple-900/40 text-purple-300',
  enterprise: 'bg-[#B8860B]/20 text-[#B8860B]',
}

export default function AdminUsersClient() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<UserRow | null>(null)
  const [addBalance, setAddBalance] = useState('')
  const [newPlan, setNewPlan] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/users?page=${page}`)
    const data = await res.json()
    setUsers(data.users ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [page])

  useEffect(() => { load() }, [load])

  async function save() {
    if (!selected) return
    setSaving(true)
    const body: Record<string, unknown> = {}
    if (newPlan) body.plan = newPlan
    if (addBalance) body.add_balance = parseFloat(addBalance)
    await fetch(`/api/admin/users/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    setSelected(null)
    setAddBalance('')
    setNewPlan('')
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Usuarios <span className="text-[#8892A4] text-base font-normal">({total})</span></h1>

      {loading ? (
        <p className="text-[#8892A4]">Cargando...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#1E2A4A]">
          <table className="w-full text-sm">
            <thead className="bg-[#0D1535] text-[#8892A4] text-xs uppercase">
              <tr>
                {['Email', 'Nombre', 'Plan', 'Balance', 'Proyectos', 'Sesiones/mes', 'Registrado', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className={`border-t border-[#1E2A4A] ${i % 2 === 0 ? 'bg-[#0A1128]' : 'bg-[#0D1535]/50'} hover:bg-[#1E2A4A]/30`}>
                  <td className="px-4 py-3 text-[#E2E8F0]">{u.email}</td>
                  <td className="px-4 py-3 text-[#8892A4]">{u.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_BADGE[u.plan] ?? PLAN_BADGE.free}`}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#8892A4]">${u.balance_usd.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center text-[#8892A4]">{u.projects}</td>
                  <td className="px-4 py-3 text-center text-[#8892A4]">{u.sessions_this_month}</td>
                  <td className="px-4 py-3 text-[#8892A4] text-xs">{new Date(u.created_at).toLocaleDateString('es')}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => { setSelected(u); setNewPlan(u.plan) }}
                      className="text-xs text-[#B8860B] hover:text-[#D4A017]"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm border border-[#1E2A4A] rounded-lg disabled:opacity-40 text-[#8892A4] hover:text-white">← Anterior</button>
        <span className="px-3 py-1.5 text-sm text-[#8892A4]">Página {page}</span>
        <button type="button" disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm border border-[#1E2A4A] rounded-lg disabled:opacity-40 text-[#8892A4] hover:text-white">Siguiente →</button>
      </div>

      {selected && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setSelected(null)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[420px] bg-[#0D1535] border border-[#1E2A4A] rounded-2xl p-6 shadow-2xl">
            <h3 className="text-white font-bold mb-1">{selected.email}</h3>
            <p className="text-[#8892A4] text-xs mb-5">Plan actual: {selected.plan} · Balance: ${selected.balance_usd.toFixed(2)}</p>

            <label className="block text-xs text-[#8892A4] mb-1">Cambiar plan</label>
            <select
              value={newPlan}
              onChange={e => setNewPlan(e.target.value)}
              className="w-full bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 py-2 text-sm text-white mb-4"
            >
              {['free', 'core', 'pro', 'enterprise'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <label className="block text-xs text-[#8892A4] mb-1">Agregar balance (USD)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={addBalance}
              onChange={e => setAddBalance(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 py-2 text-sm text-white mb-5"
            />

            <div className="flex gap-2">
              <button type="button" onClick={save} disabled={saving} className="flex-1 py-2 bg-[#B8860B] hover:bg-[#A07710] text-[#0A1128] text-sm font-semibold rounded-lg disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => setSelected(null)} className="flex-1 py-2 border border-[#1E2A4A] text-[#8892A4] hover:text-white text-sm rounded-lg">
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
