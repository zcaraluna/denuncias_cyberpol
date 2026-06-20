'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { ACTIVE_OFFICES } from '@/lib/data/oficinas'
import { MainLayout } from '@/components/MainLayout'
import {
  UserPlus,
  Users,
  Shield,
  Building2,
  Edit3,
  Trash2,
  UserCircle,
  CheckCircle2,
  XCircle,
  Key,
  Copy,
  Check,
  Building
} from 'lucide-react'

interface UsuarioCompleto {
  id: number
  usuario: string
  nombre: string
  apellido: string
  grado: string
  oficina: string
  rol: string
  activo: boolean
  preguntas_configuradas?: boolean
  tipo_cuenta?: string
}

interface UsuarioAuth {
  id: number
  usuario: string
  nombre: string
  apellido: string
  grado: string
  oficina: string
  rol: string
}

const ROLE_WEIGHTS: Record<string, number> = {
  superadmin: 4,
  admin: 3,
  supervisor: 2,
  operador: 1,
  visor: 1
}

const grados = [
  'Comisario General',
  'Comisario Principal',
  'Comisario',
  'Subcomisario',
  'Oficial Inspector',
  'Oficial Primero',
  'Oficial Segundo',
  'Oficial Ayudante',
  'Suboficial Superior',
  'Suboficial Principal',
  'Suboficial Mayor',
  'Suboficial Inspector',
  'Suboficial Primero',
  'Suboficial Segundo',
  'Suboficial Ayudante',
  'Funcionario/a'
]

const oficinas = ACTIVE_OFFICES

const roles = [
  { value: 'operador', label: 'Operador', color: 'blue' },
  { value: 'supervisor', label: 'Supervisor', color: 'green' },
  { value: 'visor', label: 'Visor', color: 'teal' },
  { value: 'admin', label: 'Admin', color: 'orange' },
  { value: 'superadmin', label: 'Superadmin', color: 'red' },
  { value: 'developer', label: 'Developer', color: 'purple' }
]

export default function GestionUsuariosPage() {
  const router = useRouter()
  const { usuario: usuarioAuth, loading: authLoading } = useAuth()
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(null)
  const [usuarios, setUsuarios] = useState<UsuarioCompleto[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false)
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioCompleto | null>(null)

  // Estados para modal de restauración de contraseña
  const [mostrarModalResetClave, setMostrarModalResetClave] = useState(false)
  const [usuarioResetClave, setUsuarioResetClave] = useState<UsuarioCompleto | null>(null)
  const [nuevaClaveTemporal, setNuevaClaveTemporal] = useState('')
  const [claveCopiada, setClaveCopiada] = useState(false)
  const [cargandoReset, setCargandoReset] = useState(false)

  // Estados para formulario de creación
  const [nuevoUsuario, setNuevoUsuario] = useState({
    usuario: '',
    contraseña: '',
    nombre: '',
    apellido: '',
    grado: '',
    oficina: '',
    rol: 'operador',
    tipo_cuenta: 'personal'
  })

  // Estados para formulario de edición
  const [editUsuario, setEditUsuario] = useState({
    nombre: '',
    apellido: '',
    grado: '',
    oficina: '',
    rol: 'operador',
    activo: true,
    contraseña: '',
    tipo_cuenta: 'personal'
  })

  useEffect(() => {
    if (usuarioAuth) {
      setUsuario(usuarioAuth)

      // Solo superadmin, admin, supervisor y developer pueden acceder a esta página
      if (
        usuarioAuth.rol !== 'superadmin' &&
        usuarioAuth.rol !== 'admin' &&
        usuarioAuth.rol !== 'supervisor' &&
        usuarioAuth.rol !== 'developer'
      ) {
        router.push('/inicio')
        return
      }

      cargarUsuarios()
    }
  }, [usuarioAuth, router])

  const cargarUsuarios = async () => {
    try {
      const response = await fetch('/api/usuarios')
      if (!response.ok) throw new Error('Error al cargar usuarios')

      const data = await response.json()
      setUsuarios(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCrearUsuario = async () => {
    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoUsuario)
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Error al crear usuario')
        return
      }

      alert('Usuario creado exitosamente')
      setMostrarModalCrear(false)
      setNuevoUsuario({
        usuario: '',
        contraseña: '',
        nombre: '',
        apellido: '',
        grado: '',
        oficina: '',
        rol: 'operador',
        tipo_cuenta: 'personal'
      })
      cargarUsuarios()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear usuario')
    }
  }

  const handleAbrirEditar = (user: UsuarioCompleto) => {
    setUsuarioEditando(user)
    setEditUsuario({
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      grado: user.grado || '',
      oficina: user.oficina,
      rol: user.rol,
      activo: user.activo,
      contraseña: '',
      tipo_cuenta: user.tipo_cuenta || 'personal'
    })
    setMostrarModalEditar(true)
  }

  const handleActualizarUsuario = async () => {
    if (!usuarioEditando) return

    try {
      const response = await fetch(`/api/usuarios/${usuarioEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUsuario)
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Error al actualizar usuario')
        return
      }

      alert('Usuario actualizado exitosamente. Si se cambió la contraseña, deberá cambiarla al iniciar sesión.')
      setMostrarModalEditar(false)
      cargarUsuarios()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar usuario')
    }
  }

  const handleEliminarUsuario = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este usuario?')) {
      return
    }

    if (id === usuario?.id) {
      alert('No puede eliminar su propio usuario')
      return
    }

    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        alert('Error al eliminar usuario')
        return
      }

      alert('Usuario eliminado exitosamente')
      cargarUsuarios()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar usuario')
    }
  }

  // Lógica de reseteo de claves
  const handleAbrirResetClave = (user: UsuarioCompleto) => {
    setUsuarioResetClave(user)
    // Generar contraseña sugerida: 5 caracteres alfanuméricos completamente aleatorios (evitando O, 0, I, l)
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
    let claveSugerida = ''
    for (let i = 0; i < 5; i++) {
      claveSugerida += caracteres.charAt(Math.floor(Math.random() * caracteres.length))
    }
    setNuevaClaveTemporal(claveSugerida)
    setClaveCopiada(false)
    setMostrarModalResetClave(true)
  }

  const handleResetearClave = async () => {
    if (!usuarioResetClave) return
    setCargandoReset(true)

    try {
      const response = await fetch(`/api/usuarios/${usuarioResetClave.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contraseña: nuevaClaveTemporal })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Error al restablecer la contraseña')
        return
      }

      const nombreMostrar = usuarioResetClave.tipo_cuenta === 'oficina'
        ? usuarioResetClave.nombre
        : `${usuarioResetClave.nombre} ${usuarioResetClave.apellido || ''}`.trim()
      alert(`Contraseña de ${nombreMostrar} restablecida exitosamente a: ${nuevaClaveTemporal}`)
      setMostrarModalResetClave(false)
    } catch (error) {
      console.error('Error:', error)
      alert('Error de red al restablecer la contraseña')
    } finally {
      setCargandoReset(false)
    }
  }

  const handleCopiarClave = () => {
    navigator.clipboard.writeText(nuevaClaveTemporal)
    setClaveCopiada(true)
    setTimeout(() => setClaveCopiada(false), 2000)
  }

  const puedoRestablecer = (targetUser: UsuarioCompleto) => {
    const realizadorRol = usuario?.rol || ''
    const targetRol = targetUser.rol
    const realizadorPeso = ROLE_WEIGHTS[realizadorRol] || 0
    const targetPeso = ROLE_WEIGHTS[targetRol] || 0

    if (realizadorRol === 'operador') return false
    if (realizadorPeso < targetPeso) return false

    if (realizadorRol === 'supervisor') {
      return targetUser.oficina === usuario?.oficina
    }

    return true
  }

  const esSupervisor = usuario?.rol === 'supervisor'
  const esAdmin = usuario?.rol === 'admin' || usuario?.rol === 'superadmin' || usuario?.rol === 'developer'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-3 border-[#002147]/10 border-t-[#002147] rounded-full animate-spin mb-4" />
          <div className="text-[#002147] font-bold animate-pulse text-sm uppercase tracking-widest">Cargando usuarios...</div>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return null
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
        {/* Cabecera */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 md:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 z-0 opacity-50"></div>

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-start gap-3 md:gap-5">
                <div className="p-3 md:p-4 bg-[#002147] rounded-2xl shadow-lg shadow-blue-900/10 shrink-0">
                  <Users className="h-6 w-6 md:h-8 md:w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-3xl font-black text-[#002147] leading-tight">
                    {esSupervisor ? 'Personal de Guardia' : 'Gestión de Usuarios'}
                  </h1>
                  <p className="text-slate-500 font-medium text-xs md:text-sm mt-1">
                    {esSupervisor
                      ? `Lista de personal asignado a la oficina regional de ${usuario.oficina}.`
                      : 'Administre las cuentas, roles y accesos de los funcionarios de la institución.'}
                  </p>
                </div>
              </div>

              {esAdmin && (
                <button
                  onClick={() => setMostrarModalCrear(true)}
                  className="group flex items-center justify-center gap-2 px-6 py-3.5 bg-[#002147] text-white rounded-2xl hover:bg-[#003366] transition-all shadow-lg shadow-blue-900/10 font-black text-xs md:text-sm"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>NUEVO USUARIO</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Grid Responsivo de Tarjetas (Visualización Premium sin Scroll) */}
        <div className="max-w-7xl mx-auto">
          {usuarios.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/60 p-16 text-center shadow-sm">
              <div className="inline-flex p-4 bg-slate-50 rounded-2xl text-slate-300 mb-4">
                <Users className="h-10 w-10" />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm">
                No se encontraron usuarios registrados
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20 md:mb-8">
              {usuarios.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group relative"
                >
                  {/* Barra lateral decorativa del rol */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      user.rol === 'developer'
                        ? 'bg-purple-500'
                        : user.rol === 'superadmin'
                        ? 'bg-red-500'
                        : user.rol === 'admin'
                        ? 'bg-orange-500'
                        : user.rol === 'supervisor'
                        ? 'bg-emerald-500'
                        : user.rol === 'visor'
                        ? 'bg-teal-500'
                        : 'bg-blue-500'
                    }`}
                  />

                  {/* Cuerpo de la tarjeta */}
                  <div className="p-6 flex-1 pl-8">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      {/* Avatar y Funcionario */}
                      <div className="flex items-center gap-3.5">
                        <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#002147] font-black text-sm border border-slate-200 shadow-inner group-hover:bg-slate-100 transition-colors">
                          {(user.nombre?.[0] || '') + (user.tipo_cuenta !== 'oficina' && user.apellido?.[0] ? user.apellido[0] : '') || '?'}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-[#002147] leading-tight">
                            {user.nombre}{user.tipo_cuenta !== 'oficina' && user.apellido ? ` ${user.apellido}` : ''}
                          </h3>
                          <p className="text-[10px] font-mono text-slate-400 tracking-tight mt-0.5">
                            {user.usuario}
                          </p>
                        </div>
                      </div>

                      {/* Badges de Rol y Tipo de Cuenta */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${
                            user.rol === 'developer'
                              ? 'bg-purple-50 text-purple-700 border-purple-100'
                              : user.rol === 'superadmin'
                              ? 'bg-red-50 text-red-700 border-red-100'
                              : user.rol === 'admin'
                              ? 'bg-orange-50 text-orange-700 border-orange-100'
                              : user.rol === 'supervisor'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : user.rol === 'visor'
                              ? 'bg-teal-50 text-teal-700 border-teal-100'
                              : 'bg-blue-50 text-blue-700 border-blue-100'
                          }`}
                        >
                          <Shield className="h-2.5 w-2.5" />
                          {roles.find((r) => r.value === user.rol)?.label}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md border text-[7px] font-black uppercase tracking-wider ${
                            user.tipo_cuenta === 'oficina'
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                          }`}
                        >
                          {user.tipo_cuenta === 'oficina' ? 'Oficina' : 'Personal'}
                        </span>
                      </div>
                    </div>

                    {/* Información */}
                    <div className="space-y-2.5 py-4 border-t border-b border-slate-100 text-[11px]">
                      {user.tipo_cuenta !== 'oficina' && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold uppercase tracking-widest">Rango</span>
                          <span className="font-bold text-slate-700 uppercase italic">
                            {user.grado}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold uppercase tracking-widest">Base / Oficina</span>
                        <span className="font-bold text-slate-700 flex items-center gap-1.5 uppercase">
                          <Building className="h-3.5 w-3.5 text-slate-300" />
                          {user.oficina}
                        </span>
                      </div>
                      {usuario?.rol === 'developer' && (
                        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100/60">
                          <span className="text-slate-400 font-bold uppercase tracking-widest">Preguntas Seguridad</span>
                          <span
                            className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-widest ${
                              user.preguntas_configuradas
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-red-50 text-red-700 border-red-100'
                            }`}
                          >
                            {user.preguntas_configuradas ? 'Configuradas' : 'Pendientes'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between pl-8">
                    {/* Estado */}
                    <div className="flex items-center gap-1.5">
                      {user.activo ? (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Activo</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <span className="h-2 w-2 rounded-full bg-slate-300" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Inactivo</span>
                        </div>
                      )}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/perfil-usuario/${user.id}`}
                        className="p-2 text-slate-400 hover:text-[#002147] hover:bg-white rounded-xl border border-slate-200/40 hover:border-slate-200 transition-all shadow-sm bg-white"
                        title="Ver Perfil"
                      >
                        <UserCircle className="h-4 w-4" />
                      </Link>

                      {puedoRestablecer(user) && (
                        <button
                          onClick={() => handleAbrirResetClave(user)}
                          className="p-2 text-amber-600 hover:text-white hover:bg-amber-600 rounded-xl border border-amber-200/50 hover:border-amber-600 transition-all shadow-sm bg-white"
                          title="Restaurar Contraseña"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                      )}

                      {esAdmin && (
                        <>
                          <button
                            onClick={() => handleAbrirEditar(user)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl border border-slate-200/40 hover:border-blue-100 transition-all shadow-sm bg-white"
                            title="Editar Usuario"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEliminarUsuario(user.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl border border-slate-200/40 hover:border-red-100 transition-all shadow-sm bg-white"
                            title="Eliminar Usuario"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Crear Usuario */}
        {mostrarModalCrear && (
          <div className="fixed inset-0 bg-[#002147]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-100 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-black text-[#002147] uppercase tracking-tight">Nuevo Usuario</h3>
                </div>
                <button
                  onClick={() => setMostrarModalCrear(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                      Nombre de Usuario
                    </label>
                    <input
                      type="text"
                      value={nuevoUsuario.usuario}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, usuario: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-[#002147]"
                      placeholder="ej: jgonzalez"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Key className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
                      <input
                        type="password"
                        value={nuevoUsuario.contraseña}
                        onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, contraseña: e.target.value })}
                        className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-[#002147]"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Tipo de Cuenta
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNuevoUsuario({ ...nuevoUsuario, tipo_cuenta: 'personal' })}
                      className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${
                        nuevoUsuario.tipo_cuenta === 'personal'
                          ? 'bg-[#002147] text-white border-[#002147] shadow-md shadow-blue-900/10'
                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-350 hover:text-slate-500'
                      }`}
                    >
                      Personal
                    </button>
                    <button
                      type="button"
                      onClick={() => setNuevoUsuario({ 
                        ...nuevoUsuario, 
                        tipo_cuenta: 'oficina',
                        apellido: '',
                        grado: ''
                      })}
                      className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${
                        nuevoUsuario.tipo_cuenta === 'oficina'
                          ? 'bg-[#002147] text-white border-[#002147] shadow-md shadow-blue-900/10'
                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-350 hover:text-slate-500'
                      }`}
                    >
                      Oficina / Compartida
                    </button>
                  </div>
                </div>

                <div className={nuevoUsuario.tipo_cuenta === 'oficina' ? 'grid grid-cols-1' : 'grid grid-cols-2 gap-4'}>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                      {nuevoUsuario.tipo_cuenta === 'oficina' ? 'Nombre de Oficina / Cuenta' : 'Nombres'}
                    </label>
                    <input
                      type="text"
                      value={nuevoUsuario.nombre}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-[#002147]"
                      placeholder={nuevoUsuario.tipo_cuenta === 'oficina' ? 'ej: Guardia de Prevención' : 'ej: Juan'}
                      required
                    />
                  </div>

                  {nuevoUsuario.tipo_cuenta !== 'oficina' && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        Apellidos
                      </label>
                      <input
                        type="text"
                        value={nuevoUsuario.apellido}
                        onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, apellido: e.target.value })}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-[#002147]"
                        placeholder="ej: Pérez"
                        required={nuevoUsuario.tipo_cuenta !== 'oficina'}
                      />
                    </div>
                  )}
                </div>

                <div className={nuevoUsuario.tipo_cuenta === 'oficina' ? 'grid grid-cols-1' : 'grid grid-cols-2 gap-4'}>
                  {nuevoUsuario.tipo_cuenta !== 'oficina' && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        Grado
                      </label>
                      <select
                        value={nuevoUsuario.grado}
                        onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, grado: e.target.value })}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-[#002147] appearance-none cursor-pointer"
                        required={nuevoUsuario.tipo_cuenta !== 'oficina'}
                      >
                        <option value="">Seleccione...</option>
                        {grados.map((grado) => (
                          <option key={grado} value={grado}>
                            {grado}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={nuevoUsuario.tipo_cuenta === 'oficina' ? 'w-full' : ''}>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                      Oficina
                    </label>
                    <select
                      value={nuevoUsuario.oficina}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, oficina: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-[#002147] appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Seleccione...</option>
                      {oficinas.map((oficina) => (
                        <option key={oficina} value={oficina}>
                          {oficina}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Rol de Acceso
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {roles
                      .filter((r) => r.value !== 'developer' || usuario?.rol === 'developer')
                      .map((rol) => (
                        <button
                          key={rol.value}
                          type="button"
                          onClick={() => setNuevoUsuario({ ...nuevoUsuario, rol: rol.value })}
                          className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                            nuevoUsuario.rol === rol.value
                              ? 'bg-[#002147] text-white border-[#002147] shadow-md'
                              : 'bg-white text-slate-400 border-slate-200 hover:border-blue-200 hover:text-blue-500'
                          }`}
                        >
                          {rol.label}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-10 p-1">
                <button
                  onClick={() => setMostrarModalCrear(false)}
                  className="flex-1 px-4 py-4 bg-slate-50 text-slate-500 rounded-2xl hover:bg-slate-100 transition-all font-black text-sm uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCrearUsuario}
                  className="flex-1 px-4 py-4 bg-[#002147] text-white rounded-2xl hover:bg-[#003366] transition-all font-black text-sm shadow-xl shadow-blue-900/10 uppercase tracking-widest"
                >
                  Crear Usuario
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Editar Usuario */}
        {mostrarModalEditar && usuarioEditando && (
          <div className="fixed inset-0 bg-[#002147]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-100 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                    <Edit3 className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-black text-[#002147] uppercase tracking-tight">Editar Usuario</h3>
                </div>
                <button
                  onClick={() => setMostrarModalEditar(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-black text-blue-900 uppercase">
                      {usuarioEditando.usuario}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest cursor-pointer">
                      Activo
                    </label>
                    <input
                      type="checkbox"
                      checked={editUsuario.activo}
                      onChange={(e) => setEditUsuario({ ...editUsuario, activo: e.target.checked })}
                      className="h-5 w-5 rounded-lg border-blue-200 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Tipo de Cuenta
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditUsuario({ ...editUsuario, tipo_cuenta: 'personal' })}
                      className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${
                        editUsuario.tipo_cuenta === 'personal'
                          ? 'bg-[#002147] text-white border-[#002147] shadow-md shadow-blue-900/10'
                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-350 hover:text-slate-500'
                      }`}
                    >
                      Personal
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditUsuario({ 
                        ...editUsuario, 
                        tipo_cuenta: 'oficina',
                        apellido: '',
                        grado: ''
                      })}
                      className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${
                        editUsuario.tipo_cuenta === 'oficina'
                          ? 'bg-[#002147] text-white border-[#002147] shadow-md shadow-blue-900/10'
                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-350 hover:text-slate-500'
                      }`}
                    >
                      Oficina / Compartida
                    </button>
                  </div>
                </div>

                <div className={editUsuario.tipo_cuenta === 'oficina' ? 'grid grid-cols-1' : 'grid grid-cols-2 gap-4'}>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                      {editUsuario.tipo_cuenta === 'oficina' ? 'Nombre de Oficina / Cuenta' : 'Nombres'}
                    </label>
                    <input
                      type="text"
                      value={editUsuario.nombre}
                      onChange={(e) => setEditUsuario({ ...editUsuario, nombre: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-[#002147]"
                      required
                    />
                  </div>

                  {editUsuario.tipo_cuenta !== 'oficina' && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        Apellidos
                      </label>
                      <input
                        type="text"
                        value={editUsuario.apellido}
                        onChange={(e) => setEditUsuario({ ...editUsuario, apellido: e.target.value })}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-[#002147]"
                        required={editUsuario.tipo_cuenta !== 'oficina'}
                      />
                    </div>
                  )}
                </div>

                <div className={editUsuario.tipo_cuenta === 'oficina' ? 'grid grid-cols-1' : 'grid grid-cols-2 gap-4'}>
                  {editUsuario.tipo_cuenta !== 'oficina' && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        Grado
                      </label>
                      <select
                        value={editUsuario.grado}
                        onChange={(e) => setEditUsuario({ ...editUsuario, grado: e.target.value })}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-[#002147] appearance-none cursor-pointer"
                        required={editUsuario.tipo_cuenta !== 'oficina'}
                      >
                        {grados.map((grado) => (
                          <option key={grado} value={grado}>
                            {grado}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={editUsuario.tipo_cuenta === 'oficina' ? 'w-full' : ''}>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                      Oficina
                    </label>
                    <select
                      value={editUsuario.oficina}
                      onChange={(e) => setEditUsuario({ ...editUsuario, oficina: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-[#002147] appearance-none cursor-pointer"
                      required
                    >
                      {oficinas.map((oficina) => (
                        <option key={oficina} value={oficina}>
                          {oficina}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Cambiar Contraseña
                  </label>
                  <div className="relative">
                    <Key className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
                    <input
                      type="password"
                      value={editUsuario.contraseña}
                      onChange={(e) => setEditUsuario({ ...editUsuario, contraseña: e.target.value })}
                      className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-[#002147]"
                      placeholder="Dejar en blanco para no cambiar"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Rol de Acceso
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {roles
                      .filter((r) => r.value !== 'developer' || usuario?.rol === 'developer')
                      .map((rol) => (
                        <button
                          key={rol.value}
                          type="button"
                          onClick={() => setEditUsuario({ ...editUsuario, rol: rol.value })}
                          className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                            editUsuario.rol === rol.value
                              ? 'bg-[#002147] text-white border-[#002147] shadow-md'
                              : 'bg-white text-slate-400 border-slate-200 hover:border-blue-200 hover:text-blue-500'
                          }`}
                        >
                          {rol.label}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-10 p-1">
                <button
                  onClick={() => setMostrarModalEditar(false)}
                  className="flex-1 px-4 py-4 bg-slate-50 text-slate-500 rounded-2xl hover:bg-slate-100 transition-all font-black text-sm uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleActualizarUsuario}
                  className="flex-1 px-4 py-4 bg-[#002147] text-white rounded-2xl hover:bg-[#003366] transition-all font-black text-sm shadow-xl shadow-blue-900/10 uppercase tracking-widest"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Restablecer Contraseña (Con Sugerencia y Copiado Rápido) */}
        {mostrarModalResetClave && usuarioResetClave && (
          <div className="fixed inset-0 bg-[#002147]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-md w-full border border-slate-100 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                    <Key className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-black text-[#002147] uppercase tracking-tight">Restaurar Clave</h3>
                </div>
                <button
                  onClick={() => setMostrarModalResetClave(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="p-4.5 bg-slate-50 rounded-2xl border border-slate-150 text-[11px] space-y-1.5">
                  <p className="text-slate-400 font-bold uppercase tracking-widest">
                    {usuarioResetClave.tipo_cuenta === 'oficina' ? 'Oficina / Cuenta' : 'Funcionario'}
                  </p>
                  <p className="text-sm font-black text-[#002147] uppercase leading-tight">
                    {usuarioResetClave.tipo_cuenta === 'oficina'
                      ? usuarioResetClave.nombre
                      : `${usuarioResetClave.grado || ''} ${usuarioResetClave.nombre} ${usuarioResetClave.apellido || ''}`.trim()}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    Base: {usuarioResetClave.oficina}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Nueva Contraseña Sugerida
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Key className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
                      <input
                        type="text"
                        value={nuevaClaveTemporal}
                        onChange={(e) => setNuevaClaveTemporal(e.target.value)}
                        className="w-full pl-11 pr-5 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none font-bold text-[#002147] tracking-wide"
                        placeholder="Contraseña temporal"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCopiarClave}
                      className={`px-4 bg-slate-100 border border-slate-250 hover:bg-slate-200 rounded-2xl transition-all flex items-center justify-center gap-1.5 font-bold text-xs ${
                        claveCopiada ? 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-50' : 'text-slate-600'
                      }`}
                      title="Copiar contraseña"
                    >
                      {claveCopiada ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span>{claveCopiada ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 italic ml-1">
                    * El usuario deberá cambiar obligatoriamente esta clave temporal en su próximo inicio de sesión.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setMostrarModalResetClave(false)}
                  className="flex-1 py-3.5 bg-slate-50 text-slate-500 rounded-2xl hover:bg-slate-100 transition-all font-black text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResetearClave}
                  disabled={cargandoReset || nuevaClaveTemporal.trim().length < 4}
                  className="flex-1 py-3.5 bg-[#002147] text-white rounded-2xl hover:bg-[#003366] transition-all font-black text-xs shadow-xl shadow-blue-900/10 uppercase tracking-widest disabled:opacity-50"
                >
                  {cargandoReset ? 'Procesando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
