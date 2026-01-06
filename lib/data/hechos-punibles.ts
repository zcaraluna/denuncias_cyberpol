// Mapeo de hechos punibles específicos a sus capítulos correspondientes
// El formato del capítulo debe coincidir exactamente con los tipos existentes en la aplicación

export interface HechoPunible {
  nombre: string // Nombre del artículo específico (ej: "Robo", "Homicidio doloso")
  capitulo: string // Capítulo correspondiente (ej: "HECHO PUNIBLE CONTRA LA PROPIEDAD")
}

export const hechosPunibles: HechoPunible[] = [
  // CAPÍTULO I: HECHOS PUNIBLES CONTRA LA VIDA
  { nombre: 'Homicidio doloso', capitulo: 'HECHO PUNIBLE CONTRA LA VIDA' },
  { nombre: 'Homicidio motivado por súplica de la víctima', capitulo: 'HECHO PUNIBLE CONTRA LA VIDA' },
  { nombre: 'Homicidio culposo', capitulo: 'HECHO PUNIBLE CONTRA LA VIDA' },
  { nombre: 'Suicidio', capitulo: 'HECHO PUNIBLE CONTRA LA VIDA' },
  { nombre: 'Muerte indirecta por estado de necesidad en el parto', capitulo: 'HECHO PUNIBLE CONTRA LA VIDA' },

  // CAPÍTULO II: HECHOS PUNIBLES CONTRA LA INTEGRIDAD FÍSICA
  { nombre: 'Maltrato físico', capitulo: 'HECHO PUNIBLE CONTRA INTEGRIDAD FÍSICA' },
  { nombre: 'Lesión', capitulo: 'HECHO PUNIBLE CONTRA INTEGRIDAD FÍSICA' },
  { nombre: 'Lesión grave', capitulo: 'HECHO PUNIBLE CONTRA INTEGRIDAD FÍSICA' },
  { nombre: 'Lesión culposa', capitulo: 'HECHO PUNIBLE CONTRA INTEGRIDAD FÍSICA' },
  { nombre: 'Lesión en el ejercicio de funciones públicas', capitulo: 'HECHO PUNIBLE CONTRA INTEGRIDAD FÍSICA' },
  { nombre: 'Omisión de auxilio', capitulo: 'HECHO PUNIBLE CONTRA INTEGRIDAD FÍSICA' },
  { nombre: 'Abandono', capitulo: 'HECHO PUNIBLE CONTRA INTEGRIDAD FÍSICA' },
  { nombre: 'Exposición a peligro', capitulo: 'HECHO PUNIBLE CONTRA INTEGRIDAD FÍSICA' },

  // CAPÍTULO III: HECHOS PUNIBLES CONTRA LA LIBERTAD
  { nombre: 'Coacción', capitulo: 'HECHO PUNIBLE CONTRA LIBERTAD' },
  { nombre: 'Coacción grave', capitulo: 'HECHO PUNIBLE CONTRA LIBERTAD' },
  { nombre: 'Privación de libertad', capitulo: 'HECHO PUNIBLE CONTRA LIBERTAD' },
  { nombre: 'Toma de rehenes', capitulo: 'HECHO PUNIBLE CONTRA LIBERTAD' },
  { nombre: 'Trata de personas', capitulo: 'HECHO PUNIBLE CONTRA LIBERTAD' },
  { nombre: 'Secuestro', capitulo: 'HECHO PUNIBLE CONTRA LIBERTAD' },
  { nombre: 'Sometimiento a servidumbre o esclavitud', capitulo: 'HECHO PUNIBLE CONTRA LIBERTAD' },

  // CAPÍTULO IV: HECHOS PUNIBLES CONTRA LA AUTONOMÍA SEXUAL
  { nombre: 'Coacción sexual y violación', capitulo: 'HECHO PUNIBLE CONTRA LA AUTONOMÍA SEXUAL' },
  { nombre: 'Trata de personas con fines de explotación sexual', capitulo: 'HECHO PUNIBLE CONTRA LA AUTONOMÍA SEXUAL' },
  { nombre: 'Abuso sexual en personas indefensas', capitulo: 'HECHO PUNIBLE CONTRA LA AUTONOMÍA SEXUAL' },
  { nombre: 'Abuso sexual en personas dependientes', capitulo: 'HECHO PUNIBLE CONTRA LA AUTONOMÍA SEXUAL' },
  { nombre: 'Abuso sexual en instituciones', capitulo: 'HECHO PUNIBLE CONTRA LA AUTONOMÍA SEXUAL' },
  { nombre: 'Acoso sexual', capitulo: 'HECHO PUNIBLE CONTRA LA AUTONOMÍA SEXUAL' },
  { nombre: 'Abuso sexual en niños', capitulo: 'HECHO PUNIBLE CONTRA MENORES' },
  { nombre: 'Pornografía infantil', capitulo: 'HECHO PUNIBLE CONTRA MENORES' },
  { nombre: 'Exhibicionismo', capitulo: 'HECHO PUNIBLE CONTRA LA AUTONOMÍA SEXUAL' },
  { nombre: 'Estupro', capitulo: 'HECHO PUNIBLE CONTRA MENORES' },
  { nombre: 'Actos homosexuales con menores', capitulo: 'HECHO PUNIBLE CONTRA MENORES' },
  { nombre: 'Proxenetismo', capitulo: 'HECHO PUNIBLE CONTRA LA AUTONOMÍA SEXUAL' },

  // CAPÍTULO V: HECHOS PUNIBLES CONTRA EL ÁMBITO DE VIDA Y LA INTIMIDAD
  { nombre: 'Violación de domicilio', capitulo: 'HECHO PUNIBLE CONTRA EL ÁMBITO DE VIDA Y LA INTIMIDAD DE LA PERSONA' },
  { nombre: 'Violación de la intimidad', capitulo: 'HECHO PUNIBLE CONTRA EL ÁMBITO DE VIDA Y LA INTIMIDAD DE LA PERSONA' },
  { nombre: 'Lesión de la comunicación y la imagen', capitulo: 'HECHO PUNIBLE CONTRA EL ÁMBITO DE VIDA Y LA INTIMIDAD DE LA PERSONA' },
  { nombre: 'Violación del secreto de la comunicación', capitulo: 'HECHO PUNIBLE CONTRA EL ÁMBITO DE VIDA Y LA INTIMIDAD DE LA PERSONA' },
  { nombre: 'Revelación de secretos de carácter privado', capitulo: 'HECHO PUNIBLE CONTRA EL ÁMBITO DE VIDA Y LA INTIMIDAD DE LA PERSONA' },
  { nombre: 'Revelación de secretos de carácter privado por profesionales y funcionarios', capitulo: 'HECHO PUNIBLE CONTRA EL ÁMBITO DE VIDA Y LA INTIMIDAD DE LA PERSONA' },
  { nombre: 'Revelación de secretos industriales o comerciales', capitulo: 'HECHO PUNIBLE CONTRA EL ÁMBITO DE VIDA Y LA INTIMIDAD DE LA PERSONA' },

  // CAPÍTULO VI: HECHOS PUNIBLES CONTRA EL HONOR
  { nombre: 'Injuria', capitulo: 'HECHO PUNIBLE CONTRA EL HONOR Y LA REPUTACIÓN' },
  { nombre: 'Calumnia', capitulo: 'HECHO PUNIBLE CONTRA EL HONOR Y LA REPUTACIÓN' },
  { nombre: 'Difamación', capitulo: 'HECHO PUNIBLE CONTRA EL HONOR Y LA REPUTACIÓN' },
  { nombre: 'Denigración de la memoria de un muerto', capitulo: 'HECHO PUNIBLE CONTRA LA PAZ DE LOS DIFUNTOS' },

  // CAPÍTULO VII: HECHOS PUNIBLES CONTRA EL ESTADO CIVIL Y LA FAMILIA
  { nombre: 'Alteración del estado civil', capitulo: 'HECHO PUNIBLE CONTRA EL ESTADO CIVIL, EL MATRIMONIO Y LA VIDA' },
  { nombre: 'Bigamia', capitulo: 'HECHO PUNIBLE CONTRA EL ESTADO CIVIL, EL MATRIMONIO Y LA VIDA' },
  { nombre: 'Matrimonio aparente', capitulo: 'HECHO PUNIBLE CONTRA EL ESTADO CIVIL, EL MATRIMONIO Y LA VIDA' },

  // CAPÍTULO I: HECHOS PUNIBLES CONTRA LA PROPIEDAD
  { nombre: 'Daño', capitulo: 'HECHO PUNIBLE CONTRA LA PROPIEDAD' },
  { nombre: 'Daño a cosas que sirven a la comunidad', capitulo: 'HECHO PUNIBLE CONTRA LA PROPIEDAD' },
  { nombre: 'Daño con fines de estafa de seguro', capitulo: 'HECHO PUNIBLE CONTRA LA PROPIEDAD' },
  { nombre: 'Apropiación', capitulo: 'HECHO PUNIBLE CONTRA LA PROPIEDAD' },
  { nombre: 'Hurto', capitulo: 'HECHO PUNIBLE CONTRA LA PROPIEDAD' },
  { nombre: 'Hurto agravado', capitulo: 'HECHO PUNIBLE CONTRA LA PROPIEDAD' },
  { nombre: 'Robo', capitulo: 'HECHO PUNIBLE CONTRA LA PROPIEDAD' },
  { nombre: 'Robo agravado', capitulo: 'HECHO PUNIBLE CONTRA LA PROPIEDAD' },
  { nombre: 'Hurto y robo con resultado de muerte', capitulo: 'HECHO PUNIBLE CONTRA LA PROPIEDAD' },

  // CAPÍTULO II: HECHOS PUNIBLES CONTRA OTROS DERECHOS PATRIMONIALES
  { nombre: 'Conducta conducente a la quiebra', capitulo: 'HECHO PUNIBLE CONTRA OTROS DERECHOS PATRIMONIALES' },
  { nombre: 'Conducta indebida en situaciones de crisis', capitulo: 'HECHO PUNIBLE CONTRA OTROS DERECHOS PATRIMONIALES' },
  { nombre: 'Favorecimiento de acreedores', capitulo: 'HECHO PUNIBLE CONTRA OTROS DERECHOS PATRIMONIALES' },
  { nombre: 'Favorecimiento de deudores', capitulo: 'HECHO PUNIBLE CONTRA OTROS DERECHOS PATRIMONIALES' },
  { nombre: 'Extorsión', capitulo: 'HECHO PUNIBLE CONTRA OTROS DERECHOS PATRIMONIALES' },
  { nombre: 'Extorsión grave y chantaje', capitulo: 'HECHO PUNIBLE CONTRA OTROS DERECHOS PATRIMONIALES' },
  { nombre: 'Estafa', capitulo: 'HECHO PUNIBLE CONTRA OTROS DERECHOS PATRIMONIALES' },
  { nombre: 'Estafa mediante sistemas informáticos', capitulo: 'HECHO PUNIBLE CONTRA OTROS DERECHOS PATRIMONIALES' },
  { nombre: 'Aprovechamiento de la insolvencia', capitulo: 'HECHO PUNIBLE CONTRA OTROS DERECHOS PATRIMONIALES' },
  { nombre: 'Fraude previo a la quiebra', capitulo: 'HECHO PUNIBLE CONTRA OTROS DERECHOS PATRIMONIALES' },
  { nombre: 'Lesión de confianza', capitulo: 'HECHO PUNIBLE CONTRA OTROS DERECHOS PATRIMONIALES' },
  { nombre: 'Usura', capitulo: 'HECHO PUNIBLE CONTRA OTROS DERECHOS PATRIMONIALES' },
  { nombre: 'Evasión de impuestos', capitulo: 'HECHO PUNIBLE CONTRA EL ERARIO' },

  // CAPÍTULO III: HECHOS PUNIBLES CONTRA LA RESTITUCIÓN DE BIENES
  { nombre: 'Reducción', capitulo: 'HECHO PUNIBLE CONTRA LA RESTITUCIÓN DE BIENES' },
  { nombre: 'Lavado de dinero', capitulo: 'HECHO PUNIBLE CONTRA LA RESTITUCIÓN DE BIENES' },

  // CAPÍTULO I: HECHOS PUNIBLES CONTRA LA SEGURIDAD COLECTIVA
  { nombre: 'Ensuciamiento y alteración de las aguas', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LAS PERSONAS FRENTE A RIESGOS COLECTIVOS' },
  { nombre: 'Contaminación del aire', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LAS PERSONAS FRENTE A RIESGOS COLECTIVOS' },
  { nombre: 'Manejo de residuos peligrosos', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LAS PERSONAS FRENTE A RIESGOS COLECTIVOS' },
  { nombre: 'Procesamiento ilícito de desechos', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LAS PERSONAS FRENTE A RIESGOS COLECTIVOS' },
  { nombre: 'Ingreso de residuos peligrosos', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LAS PERSONAS FRENTE A RIESGOS COLECTIVOS' },
  { nombre: 'Maltrato de suelos', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LAS PERSONAS FRENTE A RIESGOS COLECTIVOS' },
  { nombre: 'Incendio', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LAS PERSONAS FRENTE A RIESGOS COLECTIVOS' },
  { nombre: 'Explosión', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LAS PERSONAS FRENTE A RIESGOS COLECTIVOS' },
  { nombre: 'Inundación', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LAS PERSONAS FRENTE A RIESGOS COLECTIVOS' },
  { nombre: 'Derrumbe de construcciones', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LAS PERSONAS FRENTE A RIESGOS COLECTIVOS' },
  { nombre: 'Perturbación de servicios públicos', capitulo: 'HECHO PUNIBLE CONTRA EL FUNCIONAMIENTO DE INSTALACIONES IMPRESCINDIBLES' },
  { nombre: 'Producción de riesgos comunes', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LAS PERSONAS FRENTE A RIESGOS COLECTIVOS' },
  { nombre: 'Fabricación ilícita de explosivos', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LAS PERSONAS FRENTE A RIESGOS COLECTIVOS' },
  { nombre: 'Tenencia ilícita de explosivos', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LAS PERSONAS FRENTE A RIESGOS COLECTIVOS' },
  { nombre: 'Exposición a radiaciones ionizantes', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LAS PERSONAS FRENTE A RIESGOS COLECTIVOS' },
  { nombre: 'Empleo de elementos radiactivos', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LAS PERSONAS FRENTE A RIESGOS COLECTIVOS' },

  // CAPÍTULO II: HECHOS PUNIBLES CONTRA LA SEGURIDAD DE LAS PERSONAS EN EL TRÁNSITO
  { nombre: 'Intervenciones peligrosas en el tránsito terrestre', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LAS PERSONAS EN EL TRANSITO' },
  { nombre: 'Intervenciones peligrosas en el tránsito aéreo, naval y ferroviario', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LAS PERSONAS EN EL TRANSITO' },
  { nombre: 'Peligrosidad del tránsito', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LAS PERSONAS EN EL TRANSITO' },
  { nombre: 'Exposición al peligro del tránsito terrestre', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LAS PERSONAS EN EL TRANSITO' },

  // CAPÍTULO III: HECHOS PUNIBLES CONTRA EL ORDEN PÚBLICO
  // Nota: Este capítulo no existe en la lista actual, mapeando al más cercano
  { nombre: 'Amenaza de hechos punibles', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LA CONVIVENCIA DE LAS PERSONAS' },
  { nombre: 'Apología de un hecho punible', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LA CONVIVENCIA DE LAS PERSONAS' },
  { nombre: 'Asociación criminal', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LA CONVIVENCIA DE LAS PERSONAS' },
  { nombre: 'Asociación de grupos de delincuencia organizada', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LA CONVIVENCIA DE LAS PERSONAS' },
  { nombre: 'Perturbación de la paz pública', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LA CONVIVENCIA DE LAS PERSONAS' },

  // CAPÍTULO IV: HECHOS PUNIBLES CONTRA LA CONVIVENCIA
  { nombre: 'Incumplimiento del deber alimentario', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LA CONVIVENCIA DE LAS PERSONAS' },
  { nombre: 'Incumplimiento del deber de cuidado y educación', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LA CONVIVENCIA DE LAS PERSONAS' },
  { nombre: 'Maltrato infantil', capitulo: 'HECHO PUNIBLE CONTRA MENORES' },
  { nombre: 'Infracción del deber de manutención de ancianos y personas con discapacidad', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LA CONVIVENCIA DE LAS PERSONAS' },
  { nombre: 'Perturbación del descanso público', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LA CONVIVENCIA DE LAS PERSONAS' },
  { nombre: 'Incumplimiento de normas sanitarias', capitulo: 'HECHO PUNIBLE CONTRA LA SEGURIDAD DE LA CONVIVENCIA DE LAS PERSONAS' },

  // CAPÍTULO I: HECHOS PUNIBLES CONTRA LA FE PÚBLICA (DOCUMENTOS)
  { nombre: 'Producción de documentos no auténticos', capitulo: 'HECHO PUNIBLE CONTRA LA PRUEBA DOCUMENTAL' },
  { nombre: 'Uso de documentos no auténticos', capitulo: 'HECHO PUNIBLE CONTRA LA PRUEBA DOCUMENTAL' },
  { nombre: 'Producción mediata de documentos públicos de contenido falso', capitulo: 'HECHO PUNIBLE CONTRA LA PRUEBA DOCUMENTAL' },
  { nombre: 'Producción inmediata de documentos públicos de contenido falso por funcionarios', capitulo: 'HECHO PUNIBLE CONTRA LA PRUEBA DOCUMENTAL' },
  { nombre: 'Uso de documentos públicos de contenido falso', capitulo: 'HECHO PUNIBLE CONTRA LA PRUEBA DOCUMENTAL' },
  { nombre: 'Destrucción o alteración de documentos', capitulo: 'HECHO PUNIBLE CONTRA LA PRUEBA DOCUMENTAL' },
  { nombre: 'Falsificación de marcas y señales', capitulo: 'HECHO PUNIBLE CONTRA LA PRUEBA DOCUMENTAL' },
  { nombre: 'Uso de marcas y señales falsas', capitulo: 'HECHO PUNIBLE CONTRA LA PRUEBA DOCUMENTAL' },
  { nombre: 'Abuso de documentos de identidad', capitulo: 'HECHO PUNIBLE CONTRA LA PRUEBA DOCUMENTAL' },
  { nombre: 'Producción de certificados de salud de contenido falso', capitulo: 'HECHO PUNIBLE CONTRA LA PRUEBA DOCUMENTAL' },

  // CAPÍTULO II: HECHOS PUNIBLE CONTRA MONEDAS Y VALORES
  { nombre: 'Falsificación de moneda', capitulo: 'HECHO PUNIBLE CONTRA LA AUTENTICIDAD DE MONEDAS Y VALORES' },
  { nombre: 'Circulación de moneda no auténtica', capitulo: 'HECHO PUNIBLE CONTRA LA AUTENTICIDAD DE MONEDAS Y VALORES' },
  { nombre: 'Falsificación de valores', capitulo: 'HECHO PUNIBLE CONTRA LA AUTENTICIDAD DE MONEDAS Y VALORES' },
  { nombre: 'Preparación de la falsificación', capitulo: 'HECHO PUNIBLE CONTRA LA AUTENTICIDAD DE MONEDAS Y VALORES' },

  // CAPÍTULO I: HECHOS PUNIBLE CONTRA LA EXISTENCIA DEL ESTADO Y EL ORDEN CONSTITUCIONAL
  { nombre: 'Atentado contra la existencia del Estado', capitulo: 'HECHO PUNIBLE CONTRA LA EXISTENCIA DEL ESTADO' },
  { nombre: 'Traición a la Patria', capitulo: 'HECHO PUNIBLE CONTRA LA EXISTENCIA DEL ESTADO' },
  { nombre: 'Atentado contra el Orden Constitucional', capitulo: 'HECHO PUNIBLE CONTRA LA CONSTITUCIONALIDAD DEL ESTADO Y EL SISTEMA ELECTORAL' },
  { nombre: 'Sabotaje', capitulo: 'HECHO PUNIBLE CONTRA LA EXISTENCIA DEL ESTADO' },

  // CAPÍTULO II: HECHOS PUNIBLE CONTRA EL PROCESO ELECTORAL
  { nombre: 'Falseamiento de las elecciones', capitulo: 'HECHO PUNIBLE CONTRA LA CONSTITUCIONALIDAD DEL ESTADO Y EL SISTEMA ELECTORAL' },
  { nombre: 'Coacción al elector', capitulo: 'HECHO PUNIBLE CONTRA LA CONSTITUCIONALIDAD DEL ESTADO Y EL SISTEMA ELECTORAL' },
  { nombre: 'Soborno electoral', capitulo: 'HECHO PUNIBLE CONTRA LA CONSTITUCIONALIDAD DEL ESTADO Y EL SISTEMA ELECTORAL' },
  { nombre: 'Retención de documentos de identidad del elector', capitulo: 'HECHO PUNIBLE CONTRA LA CONSTITUCIONALIDAD DEL ESTADO Y EL SISTEMA ELECTORAL' },

  // CAPÍTULO I: HECHOS PUNIBLE CONTRA ADMINISTRACIÓN DE JUSTICIA
  { nombre: 'Testimonio falso', capitulo: 'HECHO PUNIBLE CONTRA LA PRUEBA TESTIMONIAL' },
  { nombre: 'Falso juramento', capitulo: 'HECHO PUNIBLE CONTRA LA PRUEBA TESTIMONIAL' },
  { nombre: 'Denuncia falsa', capitulo: 'HECHO PUNIBLE CONTRA LA ADMINISTRACIÓN DE LA JUSTICIA' },
  { nombre: 'Simulación de un hecho punible', capitulo: 'HECHO PUNIBLE CONTRA LA ADMINISTRACIÓN DE LA JUSTICIA' },
  { nombre: 'Frustración de la persecución y ejecución penal', capitulo: 'HECHO PUNIBLE CONTRA LA ADMINISTRACIÓN DE LA JUSTICIA' },
  { nombre: 'Prevaricato', capitulo: 'HECHO PUNIBLE CONTRA LA ADMINISTRACIÓN DE LA JUSTICIA' },

  // CAPÍTULO II: HECHOS PUNIBLE CONTRA LA FUNCIÓN PÚBLICA (CORRUPCIÓN)
  { nombre: 'Cohecho pasivo', capitulo: 'HECHO PUNIBLE CONTRA EL EJERCICIO DE FUNCIONES PUBLICAS' },
  { nombre: 'Cohecho pasivo agravado', capitulo: 'HECHO PUNIBLE CONTRA EL EJERCICIO DE FUNCIONES PUBLICAS' },
  { nombre: 'Soborno (Cohecho activo)', capitulo: 'HECHO PUNIBLE CONTRA EL EJERCICIO DE FUNCIONES PUBLICAS' },
  { nombre: 'Soborno agravado', capitulo: 'HECHO PUNIBLE CONTRA EL EJERCICIO DE FUNCIONES PUBLICAS' },
  { nombre: 'Exacción', capitulo: 'HECHO PUNIBLE CONTRA EL EJERCICIO DE FUNCIONES PUBLICAS' },
  { nombre: 'Enriquecimiento ilícito', capitulo: 'HECHO PUNIBLE CONTRA EL EJERCICIO DE FUNCIONES PUBLICAS' },
]

// Función para obtener el capítulo correspondiente a un hecho punible específico
export function obtenerCapitulo(hechoPunibleEspecifico: string): string | null {
  const hecho = hechosPunibles.find(
    (h) => h.nombre.toLowerCase().trim() === hechoPunibleEspecifico.toLowerCase().trim()
  )
  return hecho?.capitulo || null
}

// Función para obtener todos los nombres de hechos punibles específicos
export function obtenerHechosPuniblesEspecificos(): string[] {
  return hechosPunibles.map((h) => h.nombre)
}

