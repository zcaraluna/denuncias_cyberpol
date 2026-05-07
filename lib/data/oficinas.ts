export interface OficinaHeaderConfig {
  sala: string
  direccion: string
  telefono?: string
  email?: string
}

const normalizeOffice = (oficina: string) =>
  (oficina || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()

const OFFICE_CONFIG: Record<string, { hashCode: string; header: OficinaHeaderConfig }> = {
  ASUNCION: {
    hashCode: 'A',
    header: {
      sala: 'SALA DE DENUNCIAS - ASUNCIÓN',
      direccion: "E. V. Haedo 725 casi O'Leary",
      telefono: '(021) 443-159 Fax: (021) 443-126 (021) 441-111',
      email: 'ayudantia@delitoseconomicos.gov.py',
    },
  },
  CIUDAD_DEL_ESTE: {
    hashCode: 'CE',
    header: {
      sala: 'SALA DE DENUNCIAS - CIUDAD DEL ESTE',
      direccion: 'Avenida Pampa Grande c/ Avenida Julio Cesar Riquelme, Barrio Ciudad Nueva - Ciudad del Este',
      telefono: '061 571 837 y 0992 982 301',
      email: 'regional.cde@delitoseconomicos.gov.py',
    },
  },
  ENCARNACION: {
    hashCode: 'EN',
    header: {
      sala: 'SALA DE DENUNCIAS - ENCARNACIÓN',
      direccion: 'Próceres de Mayo c/ Rómulo Fernández, Barrio Buena Vista, Encarnación',
      telefono: '071 203 377',
      email: 'itapua@delitoseconomicos.gov.py',
    },
  },
  LOMA_PYTA: {
    hashCode: 'A2',
    header: {
      sala: 'SALA DE DENUNCIAS - LOMA PYTÃ',
      direccion: `Ruta PY03 "Gral. Elizardo Aquino" entre León Cadogan y Cnel. Juan Porta O'Higgins, Barrio Loma Pytã - Asunción.`,
    },
  },
  PEDRO_JUAN_CABALLERO: {
    hashCode: 'PJ',
    header: {
      sala: 'SALA DE DENUNCIAS - PEDRO JUAN CABALLERO',
      direccion: 'Pykasu esq. Urutaú Num. 9028, Barrio Jardin Aurora - Ciudad de Pedro Juan Caballero.',
      email: 'regional.pjc@delitoseconomicos.gov.py',
    },
  },
}

const OFFICE_ALIASES: Record<string, keyof typeof OFFICE_CONFIG> = {
  ASUNCION: 'ASUNCION',
  'CIUDAD DEL ESTE': 'CIUDAD_DEL_ESTE',
  ENCARNACION: 'ENCARNACION',
  'LOMA PYTA': 'LOMA_PYTA',
  'LOMA PYTA - ASUNCION': 'LOMA_PYTA',
  'PEDRO JUAN CABALLERO': 'PEDRO_JUAN_CABALLERO',
}

export function getOfficeHashCode(oficina: string): string {
  const key = OFFICE_ALIASES[normalizeOffice(oficina)] ?? 'ASUNCION'
  return OFFICE_CONFIG[key].hashCode
}

export function getOfficeHeaderConfig(oficina: string): OficinaHeaderConfig {
  const key = OFFICE_ALIASES[normalizeOffice(oficina)] ?? 'ASUNCION'
  return OFFICE_CONFIG[key].header
}
