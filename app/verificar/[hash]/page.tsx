'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface DatosVerificacion {
  hash: string
  numeroActa: string
  fechaDenuncia: string
  horaDenuncia: string
  tipoDenuncia: string
  fechaHecho: string
  horaHecho: string
  fechaHechoFin: string | null
  horaHechoFin: string | null
  lugarHecho: string
  oficina: string
  operador: string
  estado: string
  denunciante: {
    nombres: string
    documento: string
  }
}

interface ResultadoVerificacion {
  encontrada: boolean
  verificacion?: DatosVerificacion
  error?: string
}

export default function VerificarDenunciaPage() {
  const params = useParams()
  const hash = params.hash as string

  const [loading, setLoading] = useState(true)
  const [resultado, setResultado] = useState<ResultadoVerificacion | null>(null)

  useEffect(() => {
    const verificarDenuncia = async () => {
      try {
        const response = await fetch(`/api/verificar/${hash}`)
        const data = await response.json()
        setResultado(data)
      } catch (error) {
        setResultado({ encontrada: false, error: 'Error de conexión' })
      } finally {
        setLoading(false)
      }
    }

    if (hash) {
      verificarDenuncia()
    }
  }, [hash])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Verificando documento...</p>
        </div>
      </div>
    )
  }

  if (!resultado?.encontrada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Documento No Encontrado</h1>
          <p className="text-gray-600 mb-4">
            No se encontró ninguna denuncia con el código de verificación:
          </p>
          <p className="font-mono text-lg font-bold text-gray-800 bg-gray-100 px-4 py-2 rounded-lg mb-6">{hash}</p>
          <p className="text-sm text-gray-500">
            Verifique que el código QR o hash sea correcto. Si cree que esto es un error, contacte a la oficina correspondiente.
          </p>
        </div>
      </div>
    )
  }

  const datos = resultado.verificacion!

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header con logos */}
        <div className="bg-white rounded-t-lg shadow-xl p-4 flex items-center justify-between">
          <img
            src="/policianacional.png"
            alt="Policía Nacional"
            className="h-12 object-contain"
          />
          <img
            src="/dchef.png"
            alt="DCHEF"
            className="h-14 object-contain"
          />
          <img
            src="/gobiernonacional.jpg"
            alt="Gobierno Nacional"
            className="h-12 object-contain"
          />
        </div>

        {/* Badge de verificación */}
        <div className="bg-green-600 py-3 px-6 flex items-center justify-center gap-3">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-white font-bold text-lg">DOCUMENTO VERIFICADO</span>
        </div>

        {/* Contenido principal */}
        <div className="bg-white rounded-b-lg shadow-xl overflow-hidden">
          {/* Título */}
          <div className="bg-gray-800 py-4 px-6 text-center">
            <h1 className="text-xl font-bold text-white">
              ACTA DE DENUNCIA Nº {datos.numeroActa}
            </h1>
            <p className="text-blue-300 text-sm mt-1">
              Dirección Contra Hechos Punibles Económicos y Financieros
            </p>
          </div>

          {/* Datos de verificación */}
          <div className="p-6 space-y-6">
            {/* Hash */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-xs text-blue-600 uppercase tracking-wider font-medium mb-1">Código de Verificación</p>
              <p className="font-mono text-2xl font-bold text-gray-800 tracking-widest">{datos.hash}</p>
            </div>

            {/* Datos de la denuncia */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 border-b pb-2">
                Datos de la Denuncia
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Fecha de Denuncia" value={datos.fechaDenuncia} />
                <InfoItem label="Hora de Denuncia" value={datos.horaDenuncia} />
                <InfoItem label="Tipo de Denuncia" value={datos.tipoDenuncia} className="col-span-2" />
              </div>
            </div>

            {/* Datos del hecho */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 border-b pb-2">
                Datos del Hecho Denunciado
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {datos.fechaHechoFin ? (
                  <InfoItem
                    label="Fecha y Hora del Hecho"
                    value={`Entre las ${datos.horaHecho} horas de fecha ${datos.fechaHecho} y las ${datos.horaHechoFin || '—'} horas de fecha ${datos.fechaHechoFin}`}
                    className="col-span-2"
                  />
                ) : (
                  <>
                    <InfoItem label="Fecha del Hecho" value={datos.fechaHecho} />
                    <InfoItem label="Hora del Hecho" value={datos.horaHecho} />
                  </>
                )}
                <InfoItem label="Lugar del Hecho" value={datos.lugarHecho} className="col-span-2" />
              </div>
            </div>

            {/* Denunciante */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 border-b pb-2">
                Denunciante
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Nombre" value={datos.denunciante.nombres} />
                <InfoItem label="Documento" value={datos.denunciante.documento} />
              </div>
              <p className="text-xs text-gray-400 mt-2 italic">
                * Datos parcialmente ocultos por privacidad
              </p>
            </div>

            {/* Operador */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 border-b pb-2">
                Recibido por
              </h3>
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{datos.operador}</p>
                  <p className="text-sm text-gray-500">Oficina {datos.oficina}</p>
                </div>
              </div>
            </div>


          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              Este documento ha sido verificado electrónicamente. Los datos mostrados corresponden
              al registro oficial en el sistema de la Dirección Contra Hechos Punibles Económicos y Financieros.
            </p>
          </div>
        </div>

        {/* Nota de contacto */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            ¿Tiene dudas sobre este documento? Contacte a la oficina correspondiente.
          </p>
        </div>
      </div>
    </div>
  )
}

// Componente auxiliar para mostrar información
function InfoItem({
  label,
  value,
  className = ''
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={`${className}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  )
}
