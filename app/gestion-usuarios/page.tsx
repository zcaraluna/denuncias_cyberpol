'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Usuario {
  id: number
  usuario: string
  nombre: string
  apellido: string
  grado: string
  oficina: string
  rol: string
  activo: boolean
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
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false)
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null)

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
    const usuarioStr = sessionStorage.getItem('usuario')
    if (!usuarioStr) {
      router.push('/')
      return
    }

    try {
      const usuarioData = JSON.parse(usuarioStr)
      setUsuario(usuarioData)
      
      // Solo superadmin y admin pueden acceder a esta página
      if (usuarioData.rol !== 'superadmin' && usuarioData.rol !== 'admin') {
        router.push('/inicio')
        return
      }
      
      cargarUsuarios()
    } catch (error) {
      router.push('/')
    }
  }, [router])

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

  const handleAbrirEditar = (user: Usuario) => {
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← Volver al Inicio
            </Link>
            <h1 className="text-xl font-bold text-gray-800">Gestión de Usuarios</h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{usuario.grado} {usuario.nombre} {usuario.apellido}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">Administre los usuarios del sistema</p>
          <button
            onClick={() => setMostrarModalCrear(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
          >
            + Crear Usuario
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre Completo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Oficina
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No hay usuarios
                    </td>
                  </tr>
                ) : (
                  usuarios.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.usuario}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.nombre} {user.apellido}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.grado}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.oficina}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-${
                            getRolColor(user.rol)
                          }-100 text-${getRolColor(user.rol)}-800`}
                        >
                          {roles.find(r => r.value === user.rol)?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.activo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/perfil-usuario/${user.id}`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Ver Perfil
                        </Link>
                        <button
                          onClick={() => handleAbrirEditar(user)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminarUsuario(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal de Crear Usuario */}
      {mostrarModalCrear && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Crear Nuevo Usuario</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Usuario *
                </label>
                <input
                  type="text"
                  value={nuevoUsuario.usuario}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, usuario: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={nuevoUsuario.contraseña}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, contraseña: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={nuevoUsuario.nombre}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={nuevoUsuario.apellido}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, apellido: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grado *
                </label>
                <select
                  value={nuevoUsuario.grado}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, grado: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccione...</option>
                  {grados.map((grado) => (
                    <option key={grado} value={grado}>
                      {grado}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Oficina *
                </label>
                <select
                  value={nuevoUsuario.oficina}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, oficina: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol *
                </label>
                <select
                  value={nuevoUsuario.rol}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {roles.map((rol) => (
                    <option key={rol.value} value={rol.value}>
                      {rol.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setMostrarModalCrear(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearUsuario}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Usuario */}
      {mostrarModalEditar && usuarioEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Editar Usuario</h3>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Usuario:</strong> {usuarioEditando.usuario}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={editUsuario.nombre}
                    onChange={(e) => setEditUsuario({ ...editUsuario, nombre: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={editUsuario.apellido}
                    onChange={(e) => setEditUsuario({ ...editUsuario, apellido: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grado *
                </label>
                <select
                  value={editUsuario.grado}
                  onChange={(e) => setEditUsuario({ ...editUsuario, grado: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccione...</option>
                  {grados.map((grado) => (
                    <option key={grado} value={grado}>
                      {grado}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Oficina *
                </label>
                <select
                  value={editUsuario.oficina}
                  onChange={(e) => setEditUsuario({ ...editUsuario, oficina: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol *
                </label>
                <select
                  value={editUsuario.rol}
                  onChange={(e) => setEditUsuario({ ...editUsuario, rol: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {roles.map((rol) => (
                    <option key={rol.value} value={rol.value}>
                      {rol.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña (dejar en blanco para no cambiar)
                </label>
                <input
                  type="password"
                  value={editUsuario.contraseña}
                  onChange={(e) => setEditUsuario({ ...editUsuario, contraseña: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editUsuario.activo}
                  onChange={(e) => setEditUsuario({ ...editUsuario, activo: e.target.checked })}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="block text-sm font-medium text-gray-700">
                  Usuario Activo
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setMostrarModalEditar(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleActualizarUsuario}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

