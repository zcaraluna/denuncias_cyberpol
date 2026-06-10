'use client'

interface ModalGuardiaBorradorProps {
  onGuardarYSalir: () => Promise<void>
  onDescartarYSalir: () => Promise<void>
  onCancelar: () => void
  guardando: boolean
  descartando: boolean
}

export function ModalGuardiaBorrador({
  onGuardarYSalir,
  onDescartarYSalir,
  onCancelar,
  guardando,
  descartando,
}: ModalGuardiaBorradorProps) {
  const ocupado = guardando || descartando

  return (
    <div className="fixed inset-0 bg-[#002147]/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#002147] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/20 ring-1 ring-amber-400/30">
              <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">
                Borrador en progreso
              </h3>
              <p className="text-[10px] text-white/60 font-medium mt-0.5">
                Tiene una denuncia sin completar
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-xs text-slate-500 leading-relaxed mb-5">
            Si sale ahora, los cambios no guardados se perderán.
            ¿Qué desea hacer con el borrador actual?
          </p>

          <div className="flex flex-col gap-2">
            {/* Guardar y salir */}
            <button
              onClick={onGuardarYSalir}
              disabled={ocupado}
              className="w-full flex items-center gap-3 px-4 py-3 bg-[#002147] hover:bg-[#003366] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando ? (
                <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              )}
              {guardando ? 'Guardando...' : 'Guardar borrador y salir'}
            </button>

            {/* Descartar y salir */}
            <button
              onClick={onDescartarYSalir}
              disabled={ocupado}
              className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs uppercase tracking-wider border border-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {descartando ? (
                <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              {descartando ? 'Descartando...' : 'Descartar borrador y salir'}
            </button>

            {/* Cancelar */}
            <button
              onClick={onCancelar}
              disabled={ocupado}
              className="w-full py-2.5 text-slate-400 hover:text-slate-600 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Cancelar — continuar editando
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
