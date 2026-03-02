'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export default function FirmarPage() {
    const params = useParams()
    const router = useRouter()
    const token = params.token as string
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [info, setInfo] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const res = await fetch(`/api/firmas/${token}`)
                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error || 'Token inválido')
                }
                const data = await res.json()
                if (data.usado) {
                    setSuccess(true)
                }
                setInfo(data)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchInfo()
    }, [token])

    const startDrawing = (e: any) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        setIsDrawing(true)
        const rect = canvas.getBoundingClientRect()
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
        ctx.beginPath()
        ctx.moveTo(x, y)
    }

    const draw = (e: any) => {
        if (!isDrawing) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top

        ctx.lineTo(x, y)
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.stroke()
        e.preventDefault()
    }

    const stopDrawing = () => {
        setIsDrawing(false)
    }

    const clearCanvas = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    const handleSubmit = async () => {
        const canvas = canvasRef.current
        if (!canvas) return

        // Verificar si el canvas está vacío (simple check)
        const ctx = canvas.getContext('2d')
        const pixelData = ctx?.getImageData(0, 0, canvas.width, canvas.height).data
        const isCanvasEmpty = !pixelData?.some(p => p !== 0)

        if (isCanvasEmpty) {
            alert('Por favor, realice su firma antes de enviar.')
            return
        }

        setSubmitting(true)
        try {
            const dataUrl = canvas.toDataURL('image/png')
            const res = await fetch(`/api/firmas/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firma: dataUrl })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Error al guardar la firma')
            }

            setSuccess(true)
        } catch (err: any) {
            alert(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002147]"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 max-w-sm">
                    <div className="text-red-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Error</h2>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <button onClick={() => router.push('/')} className="w-full py-3 bg-[#002147] text-white rounded-xl font-bold">Volver al Inicio</button>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-green-100 max-w-sm">
                    <div className="text-green-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">¡Firma Registrada!</h2>
                    <p className="text-slate-600">Su firma ha sido procesada exitosamente. Ya puede cerrar esta ventana.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-[#002147] p-6 text-center text-white shadow-lg">
                <h1 className="text-lg font-black tracking-wider uppercase">Firma Digital Cyberpol</h1>
                <p className="text-xs text-blue-200 mt-1 opacity-80">ACTA Nº {info?.orden} • {info?.rol === 'operador' ? 'OPERADOR' : 'DENUNCIANTE'}</p>
            </header>

            <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-lg mx-auto w-full">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col flex-1 border border-slate-200">
                    <div className="p-4 bg-slate-50 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-700">Por favor, firme dentro del cuadro:</p>
                        <p className="text-[10px] text-slate-500 uppercase mt-1 tracking-tight">Utilice su dedo o lápiz óptico</p>
                    </div>

                    <div className="flex-1 relative bg-white touch-none">
                        <canvas
                            ref={canvasRef}
                            width={400}
                            height={500}
                            className="w-full h-full cursor-crosshair"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseOut={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-3">
                        <button
                            onClick={clearCanvas}
                            className="py-3 px-4 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-slate-100 transition-colors"
                        >
                            Limpiar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="py-3 px-4 bg-[#002147] text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-[#003366] transition-colors disabled:opacity-50"
                        >
                            {submitting ? 'Enviando...' : 'Enviar Firma'}
                        </button>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                        Departamento de lucha contra el cibercrimen
                    </p>
                </div>
            </main>
        </div>
    )
}
