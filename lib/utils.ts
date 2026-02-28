import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatNombrePolicial(grado: string, nombre: string, apellido: string) {
    const primerNombre = nombre.trim().split(' ')[0]
    const primerApellido = apellido.trim().split(' ')[0]
    return `${grado} ${primerNombre} ${primerApellido}`.toUpperCase()
}
