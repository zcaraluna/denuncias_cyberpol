import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatNombrePolicial(grado?: string | null, nombre?: string | null, apellido?: string | null) {
    const cleanNombre = (nombre || '').trim()
    const cleanApellido = (apellido || '').trim()
    const cleanGrado = (grado || '').trim()

    if (!cleanApellido && !cleanGrado) {
        return cleanNombre.toUpperCase()
    }

    const primerNombre = cleanNombre.split(' ')[0] || ''
    const primerApellido = cleanApellido.split(' ')[0] || ''
    
    return `${cleanGrado} ${primerNombre} ${primerApellido}`.trim().replace(/\s+/g, ' ').toUpperCase()
}
