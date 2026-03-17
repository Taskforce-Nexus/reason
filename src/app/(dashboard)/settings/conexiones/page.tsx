'use client'

import { toast } from '@/components/ui/Toast'

export default function ConexionesPage() {
  const connections = [
    {
      id: 'github',
      name: 'GitHub',
      description: 'Conecta tu repositorio para el paso de scaffolding y generación de código.',
      status: 'disconnected' as const,
      available: true,
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Exporta documentos directamente a páginas de Notion.',
      status: 'coming_soon' as const,
      available: false,
    },
    {
      id: 'linear',
      name: 'Linear',
      description: 'Sincroniza el backlog de Reason con proyectos de Linear.',
      status: 'coming_soon' as const,
      available: false,
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Recibe notificaciones de actividad en tu canal de Slack.',
      status: 'coming_soon' as const,
      available: false,
    },
    {
      id: 'figma',
      name: 'Figma',
      description: 'Importa frames de Figma para mapear arquitectura UX.',
      status: 'coming_soon' as const,
      available: false,
    },
  ]

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-[11px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Conexiones</p>
        <p className="text-[13px] text-[#4A5568]">Integra Reason con las herramientas de tu stack.</p>
      </div>

      <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-lg overflow-hidden">
        {connections.map((conn, i) => (
          <div
            key={conn.id}
            className={`flex items-center gap-5 px-5 py-4 ${
              i < connections.length - 1 ? 'border-b border-[#1E2A4A]/50' : ''
            }`}
          >
            {/* Icon placeholder */}
            <div className="w-9 h-9 rounded-lg bg-[#0A1128] border border-[#1E2A4A] flex items-center justify-center shrink-0">
              <span className="text-[11px] text-[#4A5568] font-bold uppercase">
                {conn.name.charAt(0)}
              </span>
            </div>

            <div className="flex-1 space-y-0.5">
              <p className="text-[13px] text-white font-medium">{conn.name}</p>
              <p className="text-[12px] text-[#4A5568]">{conn.description}</p>
            </div>

            {conn.available ? (
              <button
                type="button"
                onClick={() => { window.location.href = '/api/auth/github' }}
                className="px-4 py-1.5 border border-[#1E2A4A] hover:border-[#B8860B]/50 text-[12px] text-[#8B9DB7] hover:text-[#B8860B] rounded-lg transition-colors"
              >
                Conectar
              </button>
            ) : (
              <span className="px-3 py-1.5 bg-[#0A1128] border border-[#1E2A4A] text-[11px] text-[#374151] rounded-lg font-medium">
                Próximamente
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-lg p-5 space-y-2">
        <p className="text-[13px] text-white font-medium">¿Falta alguna integración?</p>
        <p className="text-[12px] text-[#4A5568]">
          Cuéntanos qué herramientas usas y las consideraremos para el roadmap.
        </p>
        <button
          type="button"
          onClick={() => toast('Gracias — escríbenos a hola@reason.dev con la integración que necesitas.')}
          className="text-[13px] text-[#B8860B] hover:text-[#D4A017] transition-colors"
        >
          Sugerir integración →
        </button>
      </div>
    </div>
  )
}
