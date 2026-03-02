'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
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
  Search,
  MoreVertical,
  Key
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

const oficinas = [
  'Asunción',
  'Ciudad del Este',
  'Encarnación',
  'Coronel Oviedo',
  'Pedro Juan Caballero',
  'Villarrica',
  'San Lorenzo'
]

const roles = [
  { value: 'operador', label: 'Operador', color: 'blue' },
  { value: 'supervisor', label: 'Supervisor', color: 'green' },
  { value: 'admin', label: 'Admin', color: 'orange' },
  { value: 'superadmin', label: 'Superadmin', color: 'red' }
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

  // Estados para formulario de creación
  const [nuevoUsuario, setNuevoUsuario] = useState({
    usuario: '',
    contraseña: '',
    nombre: '',
    apellido: '',
    grado: '',
    oficina: '',
    rol: 'operador'
  })

  // Estados para formulario de edición
  const [editUsuario, setEditUsuario] = useState({
    nombre: '',
    apellido: '',
    grado: '',
    oficina: '',
    rol: 'operador',
    activo: true,
    contraseña: ''
  })

  useEffect(() => {
    if (usuarioAuth) {
      setUsuario(usuarioAuth)

      // Solo superadmin y admin pueden acceder a esta página
      if (usuarioAuth.rol !== 'superadmin' && usuarioAuth.rol !== 'admin') {
        router.push('/dashboard')
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
        rol: 'operador'
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
      nombre: user.nombre,
      apellido: user.apellido,
      grado: user.grado,
      oficina: user.oficina,
      rol: user.rol,
      activo: user.activo,
      contraseña: ''
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

      alert('Usuario actualizado exitosamente')
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

    // No permitir eliminar al propio usuario
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

  const handleLogout = () => {
    sessionStorage.removeItem('usuario')
    router.push('/')
  }

  const getRolColor = (rol: string) => {
    const rolObj = roles.find(r => r.value === rol)
    return rolObj ? rolObj.color : 'gray'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  if (!usuario) {
    return null
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto mb-8">
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 md:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 z-0 opacity-50"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className="p-4 bg-[#002147] rounded-2xl shadow-lg shadow-blue-900/10 shrink-0">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-[#002147] leading-tight">Gestión de Usuarios</h1>
                  <p className="text-slate-500 font-medium mt-1">
                    Administre las cuentas, roles y accesos de los funcionarios de la institución.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setMostrarModalCrear(true)}
                className="group flex items-center justify-center gap-2 px-6 py-3.5 bg-[#002147] text-white rounded-2xl hover:bg-[#003366] transition-all shadow-lg shadow-blue-900/10 font-black text-sm"
              >
                <UserPlus className="h-4 w-4" />
                NUEVO USUARIO
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="bg-slate-50/50 text-left border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Funcionario</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Grado / Rango</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Oficina</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol de Sistema</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {usuarios.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-medium">
                        No se encontraron usuarios registrados
                      </td>
                    </tr>
                  ) : (
                    usuarios.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-[#002147] font-black text-xs border border-slate-200">
                              {user.nombre?.[0] || '?'}{user.apellido?.[0] || ''}
                            </div>
                            <div>
                              <p className="text-sm font-black text-[#002147]">{user.nombre} {user.apellido}</p>
                              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">{user.usuario}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-bold text-slate-600 uppercase italic">{user.grado}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-slate-300" />
                            <span className="text-xs font-bold text-slate-600">{user.oficina}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border flex items-center w-fit gap-1.5 ${user.rol === 'superadmin' ? 'bg-red-50 text-red-700 border-red-100' :
                            user.rol === 'admin' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                              user.rol === 'supervisor' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                            <Shield className="h-2.5 w-2.5" />
                            {roles.find(r => r.value === user.rol)?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {user.activo ? (
                              <div className="flex items-center gap-1.5 text-emerald-600">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Activo</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <XCircle className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Inactivo</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/perfil-usuario/${user.id}`}
                              className="p-2 text-slate-400 hover:text-[#002147] hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all shadow-sm group-hover:bg-white"
                              title="Ver Perfil"
                            >
                              <UserCircle className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleAbrirEditar(user)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl border border-transparent hover:border-blue-100 transition-all shadow-sm group-hover:bg-white"
                              title="Editar Usuario"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEliminarUsuario(user.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl border border-transparent hover:border-red-100 transition-all shadow-sm group-hover:bg-white font-black"
                              title="Eliminar Usuario"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
                <button onClick={() => setMostrarModalCrear(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre de Usuario</label>
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
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contraseña</label>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombres</label>
                    <input
                      type="text"
                      value={nuevoUsuario.nombre}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-[#002147]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Apellidos</label>
                    <input
                      type="text"
                      value={nuevoUsuario.apellido}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, apellido: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-[#002147]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Grado</label>
                    <select
                      value={nuevoUsuario.grado}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, grado: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-[#002147] appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Seleccione...</option>
                      {grados.map((grado) => (
                        <option key={grado} value={grado}>{grado}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Oficina</label>
                    <select
                      value={nuevoUsuario.oficina}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, oficina: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-[#002147] appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Seleccione...</option>
                      {oficinas.map((oficina) => (
                        <option key={oficina} value={oficina}>{oficina}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Rol de Acceso</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {roles.map((rol) => (
                      <button
                        key={rol.value}
                        type="button"
                        onClick={() => setNuevoUsuario({ ...nuevoUsuario, rol: rol.value })}
                        className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${nuevoUsuario.rol === rol.value
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
                <button onClick={() => setMostrarModalEditar(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-black text-blue-900 uppercase">{usuarioEditando.usuario}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest cursor-pointer">Activo</label>
                    <input
                      type="checkbox"
                      checked={editUsuario.activo}
                      onChange={(e) => setEditUsuario({ ...editUsuario, activo: e.target.checked })}
                      className="h-5 w-5 rounded-lg border-blue-200 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombres</label>
                    <input
                      type="text"
                      value={editUsuario.nombre}
                      onChange={(e) => setEditUsuario({ ...editUsuario, nombre: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-[#002147]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Apellidos</label>
                    <input
                      type="text"
                      value={editUsuario.apellido}
                      onChange={(e) => setEditUsuario({ ...editUsuario, apellido: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-[#002147]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Grado</label>
                    <select
                      value={editUsuario.grado}
                      onChange={(e) => setEditUsuario({ ...editUsuario, grado: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-[#002147] appearance-none cursor-pointer"
                      required
                    >
                      {grados.map((grado) => (
                        <option key={grado} value={grado}>{grado}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Oficina</label>
                    <select
                      value={editUsuario.oficina}
                      onChange={(e) => setEditUsuario({ ...editUsuario, oficina: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-[#002147] appearance-none cursor-pointer"
                      required
                    >
                      {oficinas.map((oficina) => (
                        <option key={oficina} value={oficina}>{oficina}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Cambiar Contraseña</label>
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
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Rol de Acceso</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {roles.map((rol) => (
                      <button
                        key={rol.value}
                        type="button"
                        onClick={() => setEditUsuario({ ...editUsuario, rol: rol.value })}
                        className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${editUsuario.rol === rol.value
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
      </div>
    </MainLayout>
  )
}

