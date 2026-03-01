'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { MainLayout } from '@/components/MainLayout'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import {
  Search,
  FileText,
  Filter,
  Calendar,
  Clock,
  Hash,
  User,
  ChevronRight,
  Eye,
  Trash2,
  AlertCircle,
  FileSearch,
  ArrowLeft,
  ArrowRight,
  Download,
  Database,
  BarChart3,
  TrendingUp,
  Users,
  AlertTriangle,
  DollarSign,
  Briefcase,
  LayoutDashboard,
  CalendarDays,
  RefreshCcw,
  FilePieChart
} from 'lucide-react'
import { exportToExcel } from '@/lib/utils/export-excel'
import { exportToDocx } from '@/lib/utils/export-docx'
import { exportComponentToImage } from '@/lib/utils/export-image'

interface ReporteRow {
  numero_denuncia: number
  año: number
  hora_denuncia: string
  shp: string
  tipo_especifico?: string
  tipo_general?: string
  denunciante: string
  interviniente: string
  operador_grado?: string
  operador_nombre?: string
  operador_apellido?: string
  oficina?: string
  monto_dano?: number
  moneda?: string
  entidad_reportada?: string
}

interface ResumenTipo {
  tipo: string
  total: number
}

interface Recurrente {
  denunciante: string
  cedula: string
  cantidad: number
  numeros_denuncia: string[]
  tipos: string[]
  fechas: string[]
  oficiales: string[]
}

interface DatosMensuales {
  resumen_especifico: ResumenTipo[]
  resumen_general: ResumenTipo[]
  evolucion_diaria: { fecha: string; dia: number; total: number }[]
  top_operadores: { operador: string; total: number }[]
  denunciantes_recurrentes: Recurrente[]
  resumen_danos: { moneda: string; total: number }[]
  denuncias_danos?: ReporteRow[]
}

type SortField = 'numero_denuncia' | 'hora_denuncia' | 'shp' | 'monto_dano' | 'moneda' | 'entidad_reportada'
type SortDirection = 'asc' | 'desc'
type Tab = 'diario' | 'mensual' | 'danos'

const SortIcon = ({ field, currentField, direction }: { field: SortField, currentField: SortField, direction: SortDirection }) => {
  if (field !== currentField) return (
    <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  )
  return direction === 'asc' ? (
    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export default function ReportesPage() {
  const router = useRouter()
  const { usuario, loading: authLoading, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('diario')
  const [mostrarGeneral, setMostrarGeneral] = useState(true)

  // Estado para reporte diario
  const [fecha, setFecha] = useState(() => {
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Asuncion',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date())
  })
  const [fechaFin, setFechaFin] = useState('')
  const [horaInicio, setHoraInicio] = useState('07:00')
  const [horaFin, setHoraFin] = useState('07:00')
  const [tipoDenuncia, setTipoDenuncia] = useState('')
  const [datosDiario, setDatosDiario] = useState<ReporteRow[]>([])
  const [tiposDisponibles, setTiposDisponibles] = useState<string[]>([])
  const [filtrosTiposDiario, setFiltrosTiposDiario] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('hora_denuncia')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Estado para reporte mensual y daños
  const [mes, setMes] = useState(new Date().getMonth() + 1 + '')
  const [año, setAño] = useState(new Date().getFullYear() + '')
  const [datosMensuales, setDatosMensuales] = useState<DatosMensuales | null>(null)
  const [datosDanos, setDatosDanos] = useState<ReporteRow[]>([])
  const [filtrosTiposDanos, setFiltrosTiposDanos] = useState<string[]>([])

  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading) {
      setLoading(false)
    }
  }, [authLoading])

  useEffect(() => {
    if (!fecha || activeTab !== 'diario') {
      setTiposDisponibles([])
      setTipoDenuncia('')
      return
    }

    const cargarTipos = async () => {
      try {
        const response = await fetch(`/api/reportes/simple?fecha=${fecha}`)
        if (response.ok) {
          const data = await response.json()
          const tiposUnicos: string[] = Array.from(
            new Set(data.map((row: ReporteRow) => row.shp).filter((tipo: string | undefined): tipo is string => Boolean(tipo)))
          )
          setTiposDisponibles(tiposUnicos.sort())
        }
      } catch (error) {
        console.error('Error cargando tipos disponibles:', error)
        setTiposDisponibles([])
      }
    }

    const timeoutId = setTimeout(cargarTipos, 500)
    return () => clearTimeout(timeoutId)
  }, [fecha, activeTab])

  const handleBuscarDiario = async () => {
    if (!fecha) {
      setError('Por favor seleccione una fecha')
      return
    }

    setError(null)
    setCargando(true)
    setDatosDiario([])

    try {
      const params = new URLSearchParams()
      params.append('fecha', fecha)
      if (fechaFin) params.append('fechaFin', fechaFin)
      params.append('horaInicio', horaInicio)
      params.append('horaFin', horaFin)
      if (tipoDenuncia) params.append('tipoDenuncia', tipoDenuncia)

      const response = await fetch(`/api/reportes/simple?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener reporte')
      }

      setDatosDiario(data)
      const tiposUnicos: string[] = Array.from(new Set(data.map((row: ReporteRow) => row.shp).filter((tipo: string | undefined): tipo is string => Boolean(tipo))))
      setTiposDisponibles(tiposUnicos.sort())
      setFiltrosTiposDiario(tiposUnicos) // Select all by default

      if (data.length === 0 && fecha) {
        setError(`No se encontraron denuncias para la fecha ${fecha}${tipoDenuncia ? ` y tipo "${tipoDenuncia}"` : ''}`)
      } else {
        setError(null)
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar el reporte'
      setError(errorMessage)
      setDatosDiario([])
    } finally {
      setCargando(false)
    }
  }

  const handleBuscarMensual = async () => {
    setError(null)
    setCargando(true)
    setDatosMensuales(null)

    try {
      const params = new URLSearchParams()
      params.append('mes', mes)
      params.append('año', año)

      const response = await fetch(`/api/reportes/mensual?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener resumen mensual')
      }

      setDatosMensuales(data)
      if (activeTab === 'danos') {
        const rows: ReporteRow[] = data.denuncias_danos || []
        setDatosDanos(rows)
        const tiposUnicos: string[] = Array.from(new Set(rows.map(d => d.shp).filter((shp): shp is string => Boolean(shp))))
        setFiltrosTiposDanos(tiposUnicos) // Select all by default
      }

      if (data.resumen_especifico.length === 0 && data.resumen_general.length === 0 && (!data.denuncias_danos || data.denuncias_danos.length === 0)) {
        setError(`No se encontraron denuncias para el período ${mes}/${año}`)
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar el resumen mensual'
      setError(errorMessage)
    } finally {
      setCargando(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const datosDiarioOrdenados = useMemo(() => {
    const sorted = datosDiario.length > 0
      ? datosDiario.filter(d => filtrosTiposDiario.includes(rowKey(d)))
      : []

    sorted.sort((a, b) => {
      let comparison = 0
      if (sortField === 'numero_denuncia') {
        comparison = a.numero_denuncia - b.numero_denuncia
      } else if (sortField === 'hora_denuncia') {
        comparison = (a.hora_denuncia || '00:00').localeCompare(b.hora_denuncia || '00:00')
      } else if (sortField === 'shp') {
        comparison = (a.tipo_especifico || a.shp || '').localeCompare(b.tipo_especifico || b.shp || '')
      } else if (sortField === 'monto_dano') {
        comparison = (a.monto_dano || 0) - (b.monto_dano || 0)
      } else if (sortField === 'entidad_reportada') {
        comparison = (a.entidad_reportada || '').localeCompare(b.entidad_reportada || '')
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
    return sorted
  }, [datosDiario, sortField, sortDirection, filtrosTiposDiario])

  const datosDanosOrdenados = useMemo(() => {
    const sorted = datosDanos.length > 0
      ? datosDanos.filter(d => filtrosTiposDanos.includes(rowKey(d)))
      : []

    sorted.sort((a, b) => {
      let comparison = 0
      if (sortField === 'numero_denuncia') {
        comparison = a.numero_denuncia - b.numero_denuncia
      } else if (sortField === 'monto_dano') {
        comparison = (a.monto_dano || 0) - (b.monto_dano || 0)
      } else if (sortField === 'entidad_reportada') {
        comparison = (a.entidad_reportada || '').localeCompare(b.entidad_reportada || '')
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
    return sorted
  }, [datosDanos, sortField, sortDirection, filtrosTiposDanos])

  function rowKey(row: ReporteRow) {
    return row.tipo_especifico || row.shp || ''
  }

  const handleLogout = () => {
    logout()
  }

  const handleLimpiarFiltros = () => {
    if (activeTab === 'diario') {
      setFecha('')
      setFechaFin('')
      setHoraInicio('07:00')
      setHoraFin('07:00')
      setTipoDenuncia('')
      setDatosDiario([])
      setTiposDisponibles([])
      setFiltrosTiposDiario([])
    } else {
      setMes(new Date().getMonth() + 1 + '')
      setAño(new Date().getFullYear() + '')
      setDatosMensuales(null)
      setDatosDanos([])
      setFiltrosTiposDanos([])
    }
    setError(null)
  }

  const handleExportDailyExcel = () => {
    const data = datosDiarioOrdenados.map(d => ({
      ...d,
      denuncia: `${d.numero_denuncia}/${d.año}`,
      tipo_hecho: d.tipo_especifico || d.shp
    }));

    const columns = [
      { header: 'Denuncia', key: 'denuncia', width: 15 },
      { header: 'Denunciante', key: 'denunciante', width: 30 },
      { header: 'Hecho Punible', key: 'tipo_hecho', width: 40 },
      { header: 'Hora', key: 'hora_denuncia', width: 10 },
      { header: 'Interviniente', key: 'interviniente', width: 35 },
      { header: 'Monto Daño', key: 'monto_dano', width: 15 },
      { header: 'Moneda', key: 'moneda', width: 15 }
    ];
    exportToExcel(data, `Reporte_Denuncias_${fecha || activeTab}`, columns);
  };

  // Estado para Modal de Exportación DOCX (Nota de Elevación)
  const [showDocxModal, setShowDocxModal] = useState(false);
  const [docxMeta, setDocxMeta] = useState({
    numeroNota: '',
    destinatarioGrado: '',
    destinatarioNombre: '',
    destinatarioCargo: 'Jefe de Servicio',
    remitenteGrado: '',
    remitenteNombre: '',
    remitenteCargo: 'Jefe de Cuartel'
  });

  const handleExportDailyDocx = async () => {
    setShowDocxModal(true);
  };

  const confirmExportDocx = async () => {
    setShowDocxModal(false);
    setCargando(true);

    // Obtener cotizaciones para conversión
    let cotizaciones: Record<string, { compra: number; venta: number }> = {};
    try {
      const resp = await fetch('/api/cotizaciones');
      const json = await resp.json();
      cotizaciones = json.rates || {};
    } catch (e) {
      console.error('Error al obtener cotizaciones para exportación:', e);
    }

    const data = datosDiarioOrdenados.map(d => {
      let montoGs = d.monto_dano || 0;

      // Conversión automática si no es Guaraníes
      if (d.moneda && d.moneda !== 'Guaraníes' && montoGs > 0) {
        let tasa = 1;
        if (d.moneda === 'Dólares') tasa = cotizaciones['USD']?.venta || 1;
        else if (d.moneda === 'Euros') tasa = cotizaciones['EUR']?.venta || 1;
        else if (d.moneda === 'Reales') tasa = cotizaciones['BRL']?.venta || 1;
        else if (d.moneda === 'Pesos Argentinos') tasa = cotizaciones['ARS']?.venta || 1;

        montoGs = Math.round(montoGs * tasa);
      }

      // Formato interviniente (GRADO PRIMERNOMBRE PRIMERAPELLIDO)
      let intervinienteAbrev = d.interviniente || '-------';
      if (d.operador_grado || d.operador_nombre || d.operador_apellido) {
        const grado = d.operador_grado || '';
        const pNombre = (d.operador_nombre || '').split(' ')[0] || '';
        const pApellido = (d.operador_apellido || '').split(' ')[0] || '';
        // Combinamos y quitamos espacios extra si alguna parte está vacía
        intervinienteAbrev = `${grado} ${pNombre} ${pApellido}`.replace(/\s+/g, ' ').trim();
      }

      return {
        ...d,
        num: d.numero_denuncia,
        tipo_hecho: (d.tipo_especifico || d.shp || '').toUpperCase(),
        interviniente: intervinienteAbrev,
        oficina_vacia: '',
        perdida: montoGs > 0 ? `${montoGs.toLocaleString('es-PY')} Gs.` : '-------'
      };
    });

    const columns = [
      { header: 'NUM.', key: 'num', width: 6 },
      { header: 'HORA', key: 'hora_denuncia', width: 8 },
      { header: 'S.H.P.', key: 'tipo_hecho', width: 16 },
      { header: 'DENUNCIANTE', key: 'denunciante', width: 18 },
      { header: 'INTERVINIENTE', key: 'interviniente', width: 16 },
      { header: 'DPTO. A CARGO', key: 'oficina_vacia', width: 12 },
      { header: 'PÉRDIDA (Gs.)', key: 'perdida', width: 12 },
      { header: 'ENTIDAD REPORTADA', key: 'entidad_reportada', width: 12 }
    ];

    // Lógica para determinar el rango de fecha (guardia de 07:00 a 07:00 por defecto)
    const fInicio = new Date(fecha + 'T12:00:00');
    let fFin: Date;
    if (fechaFin) {
      fFin = new Date(fechaFin + 'T12:00:00');
    } else {
      fFin = new Date(fInicio);
      fFin.setDate(fFin.getDate() + 1);
    }

    // Formatear fechas para el párrafo: DD/MM/AAAA
    const fmt = (d: Date) => d.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const fmtDia = (d: Date) => d.toLocaleDateString('es-PY', { weekday: 'long' }).toUpperCase();

    // Usar horas de la UI
    const hIn = `${horaInicio} horas`;
    const hFi = `${horaFin} horas`;

    const metadataFormateada = {
      ...docxMeta,
      fechaDesde: `${fmtDia(fInicio)} ${fmt(fInicio)}`,
      fechaHasta: `${fmtDia(fFin)} ${fmt(fFin)}`,
      horaDesde: hIn,
      horaHasta: hFi,
      oficina: datosDiarioOrdenados[0]?.oficina || 'Asunción'
    };

    await exportToDocx(data, 'Reporte Diario de Denuncias', columns, metadataFormateada);
    setCargando(false);
  };

  const handleExportDanosExcel = () => {
    const data = datosDanosOrdenados
      .filter(d => (d.monto_dano || 0) > 0)
      .map(d => ({
        ...d,
        denuncia: `${d.numero_denuncia}/${d.año}`,
        tipo_hecho: d.tipo_especifico || d.shp
      }));

    const columns = [
      { header: 'Denuncia', key: 'denuncia', width: 15 },
      { header: 'Denunciante', key: 'denunciante', width: 30 },
      { header: 'Hecho Punible', key: 'tipo_hecho', width: 40 },
      { header: 'Monto Daño', key: 'monto_dano', width: 15 },
      { header: 'Moneda', key: 'moneda', width: 15 }
    ];
    exportToExcel(data, `Reporte_Danos_Patrimoniales_${activeTab}`, columns);
  };

  const handleExportMonthlyTypesExcel = () => {
    const columns = [
      { header: 'Tipo de Hecho', key: 'tipo', width: 40 },
      { header: 'Total', key: 'total', width: 15 }
    ];
    const data = mostrarGeneral ? datosMensuales?.resumen_general : datosMensuales?.resumen_especifico;
    exportToExcel(data || [], 'Resumen_por_Tipos', columns);
  };

  const handleExportMonthlyOperatorsExcel = () => {
    const columns = [
      { header: 'Personal Interviniente', key: 'operador', width: 40 },
      { header: 'Total Denuncias', key: 'total', width: 20 }
    ];
    exportToExcel(datosMensuales?.top_operadores || [], 'Ranking_Operadores', columns);
  };

  const handleExportMonthlyTypesDocx = () => {
    const columns = [
      { header: 'Tipo de Hecho', key: 'tipo' },
      { header: 'Total', key: 'total' }
    ];
    const data = mostrarGeneral ? datosMensuales?.resumen_general : datosMensuales?.resumen_especifico;
    exportToDocx(data || [], 'Resumen de Denuncias por Tipo', columns);
  };

  const handleExportMonthlyOperatorsDocx = () => {
    const columns = [
      { header: 'Personal Interviniente', key: 'operador' },
      { header: 'Total Denuncias', key: 'total' }
    ];
    exportToDocx(datosMensuales?.top_operadores || [], 'Ranking de Operadores del Mes', columns);
  };

  const handleExportChartImage = () => {
    exportComponentToImage('chart-evolution', 'Evolucion_Diaria_Denuncias');
  };

  const handleExportRecurrenteExcel = (rec: Recurrente) => {
    const data = rec.numeros_denuncia.map((num, i) => ({
      numero: num,
      tipo: rec.tipos[i] || 'SIN ESPECIFICAR',
      fecha: rec.fechas[i] || '-',
      oficial: rec.oficiales ? rec.oficiales[i] : '-'
    }));
    const columns = [
      { header: 'Nro. Denuncia', key: 'numero', width: 20 },
      { header: 'Tipo de Hecho', key: 'tipo', width: 40 },
      { header: 'Fecha y Hora', key: 'fecha', width: 25 },
      { header: 'Personal Interviniente', key: 'oficial', width: 40 }
    ];
    exportToExcel(data, `Recurrente_${rec.denunciante.split(' ')[0]}_${rec.cedula}`, columns);
  };

  const handleExportRecurrenteDocx = (rec: Recurrente) => {
    const data = rec.numeros_denuncia.map((num, i) => ({
      numero: num,
      tipo: rec.tipos[i] || 'SIN ESPECIFICAR',
      fecha: rec.fechas[i] || '-',
      oficial: rec.oficiales ? rec.oficiales[i] : '-'
    }));
    const columns = [
      { header: 'Nro. Denuncia', key: 'numero' },
      { header: 'Tipo de Hecho', key: 'tipo' },
      { header: 'Fecha y Hora', key: 'fecha' },
      { header: 'Interviniente', key: 'oficial' }
    ];
    exportToDocx(data, `Denuncias de ${rec.denunciante} (CI: ${rec.cedula})`, columns);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Cargando...</div>
      </div>
    )
  }

  if (!usuario) {
    return null
  }


  const meses = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ]

  const años = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString())

  const formatearFecha = (fechaStr: string) => {
    // fechaStr viene como "YYYY-MM-DD HH:MM:SS" (o similar)
    try {
      if (!fechaStr) return ''
      const parts = fechaStr.split(' ')
      const datePart = parts[0]
      const timePart = parts[1] ? parts[1].substring(0, 5) : '' // Tomar solo HH:MM

      const [year, month, day] = datePart.split('-').map(Number)

      const date = new Date(year, month - 1, day)
      const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

      return `${dias[date.getDay()]}. ${day.toString().padStart(2, '0')} - ${timePart}`
    } catch (e) {
      return fechaStr
    }
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8 font-sans">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#002147] rounded-xl shadow-lg shadow-blue-900/20">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-black text-[#002147] uppercase tracking-tight">Reportes Estadísticos</h1>
              </div>
              <p className="text-slate-500 font-medium text-sm ml-1">Analice el comportamiento de las denuncias y el desempeño institucional.</p>
            </div>

            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200 w-full md:w-auto overflow-x-auto no-scrollbar">
              {[
                { id: 'diario', label: 'Diario', icon: CalendarDays },
                { id: 'mensual', label: 'Mensual', icon: TrendingUp },
                { id: 'danos', label: 'Daños', icon: DollarSign }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`flex-1 md:flex-none px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === tab.id
                      ? 'bg-[#002147] text-white shadow-lg shadow-blue-900/20'
                      : 'text-slate-400 hover:text-[#002147] hover:bg-slate-50'
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Panel de Búsqueda Principal */}
          <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 p-6 mb-8 animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#002147]"></div>
            <div className="flex flex-col lg:flex-row items-end gap-6">
              {activeTab === 'diario' ? (
                <div className="flex-1 w-full lg:w-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bloque Desde */}
                  <div className="flex flex-col gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Fecha Desde</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#002147] transition-colors" />
                        </div>
                        <input
                          type="date"
                          value={fecha}
                          onChange={(e) => setFecha(e.target.value)}
                          className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 text-[#002147] text-xs font-bold rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div className="w-full sm:w-32">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Hora Inicio</label>
                      <div className="relative">
                        <input
                          type="time"
                          value={horaInicio}
                          onChange={(e) => setHoraInicio(e.target.value)}
                          className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-[#002147] text-xs font-bold rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bloque Hasta */}
                  <div className="flex flex-col gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Fecha Hasta</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#002147] transition-colors" />
                        </div>
                        <input
                          type="date"
                          value={fechaFin}
                          onChange={(e) => setFechaFin(e.target.value)}
                          className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 text-[#002147] text-xs font-bold rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div className="w-full sm:w-32">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Hora Fin</label>
                      <div className="relative">
                        <input
                          type="time"
                          value={horaFin}
                          onChange={(e) => setHoraFin(e.target.value)}
                          className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-[#002147] text-xs font-bold rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 w-full gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mes</label>
                    <select
                      value={mes}
                      onChange={(e) => setMes(e.target.value)}
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 text-[#002147] text-sm font-bold rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all outline-none appearance-none"
                    >
                      {meses.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Año</label>
                    <select
                      value={año}
                      onChange={(e) => setAño(e.target.value)}
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 text-[#002147] text-sm font-bold rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all outline-none appearance-none"
                    >
                      {años.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 w-full lg:w-auto">
                <button
                  onClick={activeTab === 'diario' ? handleBuscarDiario : handleBuscarMensual}
                  disabled={cargando}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-[#002147] text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-[#003366] transition-all shadow-lg shadow-blue-900/20 active:scale-95 disabled:opacity-50"
                >
                  {cargando ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {cargando ? 'Buscando...' : 'Consultar'}
                </button>
                <button
                  onClick={handleLimpiarFiltros}
                  className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all shadow-sm"
                  title="Limpiar Búsqueda"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filtro por Hecho Punible (Multiselección) - SOLO EN DAÑOS */}
          {activeTab === 'danos' && datosDanos.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 p-6 mb-8 animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <Filter className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-[11px] font-black text-[#002147] uppercase tracking-widest flex items-center gap-2">
                    Filtrar por Hecho Punible
                  </h3>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                  <button
                    onClick={() => setFiltrosTiposDanos(Array.from(new Set(datosDanos.map(d => rowKey(d)).filter(Boolean))))}
                    className="flex-1 sm:flex-none text-[9px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                  >
                    Marcar Todos
                  </button>
                  <button
                    onClick={() => setFiltrosTiposDanos([])}
                    className="flex-1 sm:flex-none text-[9px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all border border-slate-100"
                  >
                    Desmarcar
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 p-1">
                {Array.from(new Set(datosDanos.map(d => rowKey(d)).filter(Boolean))).sort().map((tipo) => (
                  <label key={tipo} className="flex items-center gap-3 group cursor-pointer">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={filtrosTiposDanos.includes(tipo)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFiltrosTiposDanos([...filtrosTiposDanos, tipo])
                          } else {
                            setFiltrosTiposDanos(filtrosTiposDanos.filter(t => t !== tipo))
                          }
                        }}
                        className="peer h-4 w-4 cursor-pointer appearance-none rounded border-2 border-slate-200 checked:bg-[#002147] checked:border-[#002147] transition-all focus:ring-4 focus:ring-blue-100"
                      />
                      <svg className="absolute w-2.5 h-2.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-1/2 -translate-x-1/2 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-[#002147] transition-colors truncate uppercase tracking-tight" title={tipo}>
                      {tipo}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {/* Resultados Diario */}
          {activeTab === 'diario' && datosDiarioOrdenados.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 overflow-hidden border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#002147] rounded-xl shadow-lg shadow-blue-900/10">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[11px] font-black text-[#002147] uppercase tracking-widest">Registros Encontrados</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{datosDiarioOrdenados.length} denuncias procesadas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                  <button
                    onClick={handleExportDailyExcel}
                    title="Exportar a Excel"
                    className="p-2 bg-white border border-slate-200 rounded-xl text-green-600 hover:bg-green-50 shadow-sm transition-all"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleExportDailyDocx}
                    title="Exportar a Word"
                    className="p-2 bg-white border border-slate-200 rounded-xl text-blue-600 hover:bg-blue-50 shadow-sm transition-all"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-slate-50/20">
                      <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 cursor-pointer hover:text-[#002147] transition" onClick={() => handleSort('numero_denuncia')}>
                        <div className="flex items-center gap-2">NUM. <SortIcon field="numero_denuncia" currentField={sortField} direction={sortDirection} /></div>
                      </th>
                      <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 cursor-pointer hover:text-[#002147] transition" onClick={() => handleSort('hora_denuncia')}>
                        <div className="flex items-center gap-2">HORA <SortIcon field="hora_denuncia" currentField={sortField} direction={sortDirection} /></div>
                      </th>
                      <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">S.H.P.</th>
                      <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">DENUNCIANTE</th>
                      <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">INTERVINIENTE</th>
                      <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">PÉRDIDA (Gs.)</th>
                      <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 cursor-pointer hover:text-[#002147] transition" onClick={() => handleSort('entidad_reportada')}>
                        <div className="flex items-center gap-2">ENTIDAD REPORTADA <SortIcon field="entidad_reportada" currentField={sortField} direction={sortDirection} /></div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {datosDiarioOrdenados.map((row, index) => (
                      <tr key={index} className="group hover:bg-slate-50/80 transition-all">
                        <td className="px-6 py-4 whitespace-nowrap text-[10px] font-black text-[#002147]/70 font-mono italic">{row.numero_denuncia}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-[10px] font-bold text-[#002147]/60">
                          <div className="flex items-center gap-2 uppercase tracking-tighter">
                            <Clock className="w-3 h-3 text-slate-300" />
                            {row.hora_denuncia || '--:--'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black uppercase tracking-tight text-blue-600">
                            {row.tipo_especifico || row.shp || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-tight">{row.denunciante || '-'}</td>
                        <td className="px-6 py-4 text-[10px] font-bold text-[#002147]/80 uppercase tracking-tight italic">{row.interviniente || '-'}</td>
                        <td className="px-6 py-4 text-[10px] font-black text-[#002147] tabular-nums">
                          {row.monto_dano ? row.monto_dano.toLocaleString('es-PY') : '0'}
                        </td>
                        <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-tight">{row.entidad_reportada || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Resultados Mensual */}
          {activeTab === 'mensual' && datosMensuales && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              {/* Resumen por Tipos y Ranking de Operadores */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Desglose por Tipos */}
                <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#002147] rounded-xl shadow-lg shadow-blue-900/10">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-[11px] font-black text-[#002147] uppercase tracking-widest">Resumen por Tipo</h3>
                    </div>
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                      <button
                        onClick={() => setMostrarGeneral(false)}
                        className={`px-3 py-1.5 text-[9px] font-black rounded-lg transition-all uppercase tracking-widest ${!mostrarGeneral
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-400 hover:text-slate-600'
                          }`}
                      >
                        Específico
                      </button>
                      <button
                        onClick={() => setMostrarGeneral(true)}
                        className={`px-3 py-1.5 text-[9px] font-black rounded-lg transition-all uppercase tracking-widest ${mostrarGeneral
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-400 hover:text-slate-600'
                          }`}
                      >
                        General
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-slate-50/20">
                          <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Categoría</th>
                          <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-medium">
                        {(mostrarGeneral ? datosMensuales.resumen_general : datosMensuales.resumen_especifico).map((tipo: ResumenTipo, idx: number) => (
                          <tr key={idx} className="group hover:bg-slate-50 transition-all">
                            <td className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-tight">{tipo.tipo}</td>
                            <td className="px-6 py-4 text-[10px] font-black text-[#002147] text-right bg-slate-50/30">{tipo.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top 5 Intervinientes */}
                <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                  <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-900/10">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-[11px] font-black text-[#002147] uppercase tracking-widest">Top 5 Intervinientes</h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleExportMonthlyOperatorsExcel}
                        title="Exportar a Excel"
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-slate-50/20">
                          <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Personal</th>
                          <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Denuncias</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {datosMensuales.top_operadores?.map((op, idx) => (
                          <tr key={idx} className="group hover:bg-emerald-50/30 transition-all">
                            <td className="px-6 py-4 text-[10px] text-slate-600 uppercase tracking-tight flex items-center gap-3">
                              <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 font-black text-[10px] shadow-sm">
                                {idx + 1}
                              </span>
                              <span className="font-bold">{op.operador || 'Desconocido'}</span>
                            </td>
                            <td className="px-6 py-4 text-[10px] font-black text-[#002147] text-right bg-slate-50/30">{op.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Denunciantes Recurrentes */}
              <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-600 rounded-xl shadow-lg shadow-red-900/10">
                      <AlertCircle className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-[11px] font-black text-[#002147] uppercase tracking-widest">Denunciantes Recurrentes</h3>
                  </div>
                </div>
                <div className="p-6">
                  {datosMensuales.denunciantes_recurrentes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {datosMensuales.denunciantes_recurrentes.map((rec, idx) => (
                        <div key={idx} className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-black text-[#002147] text-xs uppercase tracking-tight group-hover:text-blue-600 transition-colors">{rec.denunciante}</h4>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Hash className="w-3 h-3 text-slate-300" />
                                <p className="text-[9px] text-slate-400 font-black font-mono tracking-widest">DOC: {rec.cedula}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-lg uppercase tracking-widest shadow-sm">
                                {rec.cantidad} denuncias
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2 pr-1">
                            {rec.numeros_denuncia.map((num, i) => (
                              <div key={i} className="flex flex-col gap-1 text-[10px] text-slate-600 bg-white p-3 rounded-xl border border-slate-100 shadow-sm group/item">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-blue-600 text-[9px] font-mono whitespace-nowrap">{num}</span>
                                  <span className="text-slate-100">—</span>
                                  <span className="truncate flex-1 font-bold text-slate-500 uppercase tracking-tighter">{rec.tipos[i]}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50 text-[9px] text-slate-400 font-bold">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-2.5 h-2.5 text-slate-300" />
                                    <span>{formatearFecha(rec.fechas[i])}</span>
                                  </div>
                                  {rec.oficiales && rec.oficiales[i] && (
                                    <>
                                      <span className="text-slate-200">|</span>
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <User className="w-2.5 h-2.5 text-slate-300 shrink-0" />
                                        <span className="italic truncate">{rec.oficiales[i].split(',')[0]}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-[10px] bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      Sin anomalías de recurrencia en este periodo.
                    </div>
                  )}
                </div>
              </div>

              {/* Evolución Diaria */}
              <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#002147]"></div>
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#002147] rounded-xl shadow-lg shadow-blue-900/10">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-[11px] font-black text-[#002147] uppercase tracking-widest">Evolución Diaria</h3>
                  </div>
                  <button
                    onClick={handleExportChartImage}
                    className="px-4 py-2 bg-white border border-slate-200 text-[#002147] rounded-xl hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Capturar Gráfico
                  </button>
                </div>
                <div className="p-6 md:p-8" id="chart-evolution">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={datosMensuales.evolucion_diaria}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="dia"
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#64748b', fontWeight: 700 }}
                          dy={10}
                        />
                        <YAxis
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#64748b', fontWeight: 700 }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          cursor={{ fill: '#f8fafc' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-[#002147] p-3 shadow-2xl rounded-xl border border-white/10">
                                  <p className="text-[9px] text-blue-200 font-black uppercase tracking-widest mb-1.5 border-b border-white/10 pb-1.5 flex items-center gap-2">
                                    <Calendar className="w-3 h-3" /> Día {payload[0].payload.dia}
                                  </p>
                                  <p className="text-xl font-black text-white">{payload[0].value} <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest ml-1">Denuncias</span></p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="total"
                          radius={[6, 6, 0, 0]}
                        >
                          {datosMensuales.evolucion_diaria.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.total > 0 ? '#002147' : '#f1f5f9'}
                              fillOpacity={entry.total > 0 ? 0.9 : 1}
                              className="transition-all duration-300 hover:fill-blue-600"
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resultados Daños */}
          {activeTab === 'danos' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              {/* Resumen de Daños (Tarjetas) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(() => {
                  const stats: Record<string, number> = {}
                  datosDanosOrdenados.forEach(d => {
                    if (d.monto_dano && d.moneda) {
                      stats[d.moneda] = (stats[d.moneda] || 0) + (typeof d.monto_dano === 'string' ? parseInt(d.monto_dano, 10) : d.monto_dano)
                    }
                  })
                  const entries = Object.entries(stats)
                  if (entries.length === 0) {
                    return (
                      <div className="md:col-span-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center gap-4">
                        <div className="p-4 bg-white rounded-full shadow-sm">
                          <DollarSign className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Sin registros de perjuicio patrimonial</p>
                      </div>
                    )
                  }
                  return entries.map(([moneda, total], idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 group hover:-translate-y-1 transition-all duration-300 relative">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Total Perjuicio {moneda}
                      </p>
                      <p className="text-2xl font-black text-[#002147] tracking-tighter">
                        {total.toLocaleString('es-PY')}
                        <span className="text-[11px] ml-1.5 font-black text-blue-500 uppercase tracking-widest">{moneda}</span>
                      </p>
                    </div>
                  ))
                })()}
              </div>

              {/* Tabla Detallada de Daños */}
              <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 overflow-hidden border border-slate-100 relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#002147]"></div>
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#002147] rounded-xl shadow-lg shadow-blue-900/10">
                      <Briefcase className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black text-[#002147] uppercase tracking-widest">Detalle de Perjuicios</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Desglose individual por denuncia</p>
                    </div>
                  </div>
                  <button
                    onClick={handleExportDanosExcel}
                    className="flex items-center gap-2 px-5 py-2 bg-[#002147] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#003366] transition-all shadow-lg shadow-blue-900/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exportar Datos
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-slate-50/20">
                        <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 cursor-pointer hover:text-[#002147] transition" onClick={() => handleSort('numero_denuncia')}>
                          <div className="flex items-center gap-2">NUM. <SortIcon field="numero_denuncia" currentField={sortField} direction={sortDirection} /></div>
                        </th>
                        <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Denunciante</th>
                        <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Hecho Punible</th>
                        <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 cursor-pointer hover:text-[#002147] transition" onClick={() => handleSort('monto_dano')}>
                          <div className="flex items-center gap-2 justify-end">Monto <SortIcon field="monto_dano" currentField={sortField} direction={sortDirection} /></div>
                        </th>
                        <th className="px-6 py-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Moneda</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium">
                      {datosDanosOrdenados.filter(d => (d.monto_dano || 0) > 0).map((row, index) => (
                        <tr key={index} className="group hover:bg-slate-50 transition-all">
                          <td className="px-6 py-4 whitespace-nowrap text-[10px] font-black text-[#002147]/70 font-mono italic">{row.numero_denuncia}/{row.año}</td>
                          <td className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-tight">{row.denunciante}</td>
                          <td className="px-6 py-4">
                            <span className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[8px] font-black text-slate-500 uppercase tracking-wider">
                              {row.shp}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-[11px] font-black text-[#002147] text-right bg-slate-50/30">
                            {row.monto_dano?.toLocaleString('es-PY')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-[9px] font-black text-blue-500 text-center uppercase tracking-widest italic">
                            {row.moneda}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sección de Administración - Solo para garv */}
          {usuario?.usuario === 'garv' && (
            <div className="mt-16 pt-8 border-t border-slate-200 max-w-3xl">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  <Database className="w-16 h-16 text-[#002147]" />
                </div>
                <div className="flex items-start gap-4 relative z-10">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <Database className="w-5 h-5 text-[#002147]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#002147] uppercase tracking-wider mb-1">Copia de Seguridad</h3>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-sm">
                      Genere un respaldo integral en formato <code className="bg-slate-100 px-1 rounded text-blue-600 font-mono italic">.sql</code> de la base de datos institucional.
                    </p>
                  </div>
                </div>
                <a
                  href="/api/admin/backup"
                  className="shrink-0 flex items-center gap-2.5 px-6 py-3 bg-[#002147] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#003366] transition-all shadow-lg shadow-blue-900/20 active:scale-95 relative z-10"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar SQL
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Metadatos de Nota de Elevación (DOCX) */}
      {showDocxModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#002147]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#002147] rounded-xl">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#002147] uppercase tracking-wider">Metadatos de la Nota</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Complete remitente y destinatario</p>
                </div>
              </div>
              <button
                onClick={() => setShowDocxModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <RefreshCcw className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nº de Nota (###)</label>
                <input
                  type="text"
                  placeholder="Ej: 125"
                  value={docxMeta.numeroNota}
                  onChange={(e) => setDocxMeta({ ...docxMeta, numeroNota: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#002147] focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Grado del Destinatario</label>
                <input
                  type="text"
                  placeholder="Ej: Comisario MGAP"
                  value={docxMeta.destinatarioGrado}
                  onChange={(e) => setDocxMeta({ ...docxMeta, destinatarioGrado: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#002147] focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nombre y Apellido</label>
                  <input
                    type="text"
                    placeholder="Ej: JUAN PÉREZ"
                    value={docxMeta.destinatarioNombre}
                    onChange={(e) => setDocxMeta({ ...docxMeta, destinatarioNombre: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#002147] uppercase focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Cargo</label>
                  <select
                    value={docxMeta.destinatarioCargo}
                    onChange={(e) => setDocxMeta({ ...docxMeta, destinatarioCargo: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#002147] focus:ring-4 focus:ring-blue-50 outline-none transition-all appearance-none"
                  >
                    <option value="Jefe de Servicio">Jefe de Servicio</option>
                    <option value="Jefe de Cuartel">Jefe de Cuartel</option>
                    <option value="Oficial de Guardia">Oficial de Guardia</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-2">
                <h4 className="text-[11px] font-black text-[#002147] uppercase tracking-widest mb-3">Datos del Remitente (Firma)</h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Grado del Remitente</label>
                    <input
                      type="text"
                      placeholder="Ej: Oficial Inspector P.S."
                      value={docxMeta.remitenteGrado}
                      onChange={(e) => setDocxMeta({ ...docxMeta, remitenteGrado: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#002147] focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nombre y Apellido</label>
                      <input
                        type="text"
                        placeholder="Ej: PEDRO GÓMEZ"
                        value={docxMeta.remitenteNombre}
                        onChange={(e) => setDocxMeta({ ...docxMeta, remitenteNombre: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#002147] uppercase focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Cargo</label>
                      <select
                        value={docxMeta.remitenteCargo}
                        onChange={(e) => setDocxMeta({ ...docxMeta, remitenteCargo: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#002147] focus:ring-4 focus:ring-blue-50 outline-none transition-all appearance-none"
                      >
                        <option value="Jefe de Cuartel">Jefe de Cuartel</option>
                        <option value="Oficial de Guardia">Oficial de Guardia</option>
                        <option value="Jefe de Servicio">Jefe de Servicio</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setShowDocxModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmExportDocx}
                  disabled={!docxMeta.numeroNota || !docxMeta.destinatarioNombre}
                  className="flex-1 px-4 py-3 bg-[#002147] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#003366] transition-all shadow-lg shadow-blue-900/10 disabled:opacity-50"
                >
                  Exportar Nota
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
