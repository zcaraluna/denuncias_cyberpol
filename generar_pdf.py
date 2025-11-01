from reportlab.lib.pagesizes import legal  # Tamaño Oficiofrom reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.utils import simpleSplit
import os
from reportlab.pdfgen import canvas
from nueva_denuncia import conectar_db
from reportlab.platypus import Paragraph, SimpleDocTemplate
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.lib.styles import ParagraphStyle
from io import BytesIO
from datetime import datetime
from tkinter import messagebox

# Obtener los estilos de ReportLab
styles = getSampleStyleSheet()

def generar_pdf(numero_orden, denunciante, datos_denuncia, vista_previa=False):
    """Genera el documento PDF en memoria y devuelve sus bytes."""

    # 📌 Diccionario con datos de cada oficina (solo cambia dirección, teléfono, fax y email)
    datos_oficinas = {
        "Asunción": {
            "direccion": "E. V. Haedo 725 casi O’Leary",
            "telefono": "(021) 443-159",
            "fax": "(021) 443-126 (021) 441-111",
            "email": "ayudantia@delitoseconomicos.gov.py"
        },
        "Ciudad del Este": {
            "direccion": "Av. San Blas y Monseñor Rodríguez",
            "telefono": "(061) 500-000",
            "fax": "(061) 500-111",
            "email": "cde@delitoseconomicos.gov.py"
        },
        "Encarnación": {
            "direccion": "Mcal. Estigarribia y Carlos A. López",
            "telefono": "(071) 300-000",
            "fax": "(071) 300-111",
            "email": "encarnacion@delitoseconomicos.gov.py"
        },
        # 🔹 Agregar más oficinas según sea necesario...
    }


    # 🔎 Depuración: Verificar valores de tipo_denuncia y otro_tipo

    # año = datos_denuncia["fecha_denuncia"].split("-")[0]
    # Crear un buffer en memoria para almacenar el PDF
    buffer = BytesIO()

    # Crear el PDF en el buffer en lugar de un archivo físico
    c = canvas.Canvas(buffer, pagesize=legal)
    width, height = legal  # Obtener dimensiones de la hoja

    # 📌 Rutas de los logos
    logo_izq = "policianacional.png"
    logo_centro = "dchef.png"
    logo_der = "gobiernonacional.jpg"

    # 📌 Tamaños individuales para cada logo
    logo_izq_size = (150, 150)   # Tamaño para "policianacional.png"
    logo_centro_size = (70, 70) # Tamaño para "dchef.png"
    logo_der_size = (150, 150)     # Tamaño para "gobiernonacional.jpg"

    # 🟢 Insertar los logos con sus tamaños individuales
    c.drawImage(logo_izq, 30, height - 115, width=logo_izq_size[0], height=logo_izq_size[1], preserveAspectRatio=True, mask="auto")

    c.drawImage(logo_centro, (width / 2) - (logo_centro_size[0] / 2), height - 75, width=logo_centro_size[0], height=logo_centro_size[1], preserveAspectRatio=True, mask="auto")

    c.drawImage(logo_der, width - 170, height - 120, width=logo_der_size[0], height=logo_der_size[1], preserveAspectRatio=True, mask="auto")

    # 📌 Texto del encabezado
    y_texto = height - 100  # Ajuste de altura para que el texto esté debajo de los logos

    # 🔵 Primera línea (Negrita)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width / 2, y_texto, "DIRECCIÓN CONTRA HECHOS PUNIBLES ECONÓMICOS Y FINANCIEROS")

    # 🔵 Segunda línea (Negrita)
    y_texto -= 13  # Espacio entre líneas
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(width / 2, y_texto, "SALA DE DENUNCIAS")
    # 📌 Obtener la oficina del operador desde los datos de la denuncia
    oficina_actual = datos_denuncia["oficina"]

    # 📌 Obtener los datos de la oficina actual (si no encuentra, usa Asunción por defecto)
    datos = datos_oficinas.get(oficina_actual, datos_oficinas["Asunción"])


    # 🔵 Tercera línea (Dirección, Teléfono y Fax) - Centrados
    y_texto -= 13
    c.setFont("Helvetica", 10)
    c.drawCentredString(width / 2, y_texto, f"Dirección: {datos['direccion']}")

    y_texto -= 13
    c.setFont("Helvetica", 10)
    c.drawCentredString(width / 2, y_texto, f"Teléfono: {datos['telefono']}   Fax: {datos['fax']}")

    # 🔵 Cuarta línea (Email) - Centrado
    y_texto -= 13
    c.setFont("Helvetica", 10)
    c.drawCentredString(width / 2, y_texto, f"E-mail: {datos['email']}")



    # 🔵 Línea separadora debajo del encabezado
    y_texto -= 7  # Ajusta la posición de la línea
    c.setStrokeColor(colors.black)  # Color negro
    c.setLineWidth(1)  # Grosor de la línea
    c.line(50, y_texto, width - 50, y_texto)  # Dibuja la línea de extremo a extremo

    # 🔵 Espacio antes del título
    y_texto -= 20  # Baja un poco más después del encabezado


    # 📌 Si es vista previa, se ofusca el número de denuncia
    if vista_previa:
        titulo = "ACTA DE DENUNCIA Nº XXXX/AAAA"
    else:
        año = datos_denuncia["fecha_denuncia"].split("-")[0]  # ✅ Extrae el año correctamente
        titulo = f"ACTA DE DENUNCIA Nº {numero_orden}/{año}"
    c.setFont("Helvetica-Bold", 14)  # Fuente más grande
    c.drawCentredString(width / 2, y_texto, titulo)  # Centrar en la página


    # 🔹 Espacio antes del aviso legal
    y_texto -= 40  # Ajustar para que el texto quede justo debajo del título

    # 🔹 Configurar estilo del aviso legal
    style_aviso = styles["Normal"]
    style_aviso.alignment = TA_JUSTIFY  # Justificado
    style_aviso.fontSize = 8  # Tamaño de fuente más pequeño que el cuerpo
    style_aviso.leading = 15  # Espaciado entre líneas

    # 🔹 Aviso legal debajo del título (en cursiva y dentro de un recuadro)
    aviso_legal = """LA PRESENTE ACTA SE REALIZA CONFORME A LOS SIGUIENTES: ARTÍCULO 284. “DENUNCIA”,
    ARTÍCULO 285. “FORMA Y CONTENIDO”, ARTÍCULO 289. “DENUNCIA ANTE LA POLICÍA” DE LA LEY 1286/98 "CODIGO PROCESAL PENAL"."""

    # 🔹 Ajustar posición debajo del título
    y_texto -= 2  # Espacio entre título y aviso

    # 🔹 Dibujar el rectángulo
    c.setStrokeColor(colors.black)  # Color del borde
    c.setFillColor(colors.white)  # Fondo blanco
    c.rect(50, y_texto - 2, width - 100, 40, stroke=1, fill=1)  # Dibujar rectángulo

    # 🔹 Configurar fuente en cursiva
    c.setFont("Helvetica-Oblique", 11)
    c.setFillColor(colors.black)  # Texto en negro

    # 🔹 Dibujar el texto dentro del recuadro
    parrafo_aviso = Paragraph(aviso_legal, styles["Italic"])  # 🟢 Aplicamos el estilo cursiva
    w_aviso, h_aviso = parrafo_aviso.wrap(width - 110, height)  # Ajustar al ancho
    parrafo_aviso.drawOn(c, 55, y_texto)  # Dibujar texto dentro del rectángulo

    # 🔹 Ajustar la posición para el siguiente contenido
    y_texto -= 30  # Espacio después del aviso

    # 🔹 Configurar el estilo del texto
    style_cuerpo = styles["Normal"]
    style_cuerpo.alignment = TA_JUSTIFY  # Justificado
    style_cuerpo.fontSize = 12  # Tamaño de fuente
    style_cuerpo.leading = 15  # Espaciado entre líneas
    # 📌 POSICIÓN FIJA DEL PRIMER PÁRRAFO
    y_fijo_parrafo_1 = 780

    # 📌 TEXTO DEL PRIMER PÁRRAFO
    texto_cuerpo = (
        f"En la Sala de Denuncias de la Dirección Contra Hechos Punibles Económicos y Financieros, "
        f"Oficina <b>{datos_denuncia['oficina'].upper()}</b>, en fecha <b>{datetime.strptime(datos_denuncia['fecha_denuncia'], '%Y-%m-%d').strftime('%d/%m/%Y')}</b> "
        f"siendo las <b>{datos_denuncia['hora_denuncia'].upper()}</b>, "
        f"ante mí <b>{datos_denuncia['grado_operador'].upper()} {datos_denuncia['nombre_operador'].upper()}</b>, "
        f"concurre <b>{denunciante['Nombres y Apellidos'].upper()}</b>, con número de documento <b>{denunciante['Cédula de Identidad'].upper()}</b>, "
        f"con domicilio en <b>{denunciante['Domicilio'].upper()}</b>, de nacionalidad <b>{denunciante['Nacionalidad'].upper()}</b>, "
        f"estado civil <b>{denunciante['Estado Civil'].upper()}</b>, <b>{denunciante['Edad'].upper()}</b> años de edad, "
        f"fecha de nacimiento <b>{datetime.strptime(denunciante['Fecha de Nacimiento'], '%Y-%m-%d').strftime('%d/%m/%Y')}</b>, "
        f"en <b>{denunciante['Lugar de Nacimiento'].upper()}</b>, "
        f"número de teléfono <b>{denunciante['Número de Teléfono'].upper()}</b>, de profesión <b>{denunciante['Profesión'].upper()}</b>, "
        f"y expone cuanto sigue:"

    )

    # 📌 Convertir en `Paragraph`
    parrafo = Paragraph(texto_cuerpo, style_cuerpo)

    # 🔹 Primero calculamos la altura del párrafo ANTES de dibujarlo
    w, h = parrafo.wrap(width - 100, height)

    # 🔹 Ajustamos la posición para que SIEMPRE EMPIECE EN `y_fijo_parrafo_1`
    parrafo.drawOn(c, 50, y_fijo_parrafo_1 - h)  # 📌 Fijo arriba, expande hacia abajo

    # 🔹 Definir la posición FIJA del segundo párrafo (NO SE MOVERÁ)
    y_fijo_parrafo_2 = y_fijo_parrafo_1 - h - 5  # 📌 Ajustamos según el diseño

    # 🟢 SEGUNDO PÁRRAFO (Texto Base)
    texto_cuerpo_2 = (
        f"Que por la presente viene a realizar una denuncia sobre un supuesto hecho de <b>{datos_denuncia['tipo_denuncia'].upper()}</b>"
    )

    # 🟢 Si el tipo de denuncia es "Otro", agregar el motivo especificado en paréntesis
    # 🟢 Si el tipo de denuncia es "OTRO", agregar el motivo especificado en paréntesis
    if datos_denuncia["tipo_denuncia"].upper() == "OTRO" and datos_denuncia.get("otro_tipo"):
        texto_cuerpo_2 = texto_cuerpo_2.replace("OTRO", f"OTRO ({datos_denuncia['otro_tipo'].upper()})")

    texto_cuerpo_2 += (
        f", ocurrido en fecha <b>{datetime.strptime(datos_denuncia['fecha_hecho'], '%Y-%m-%d').strftime('%d/%m/%Y')}</b> "
        f"siendo las <b>{datos_denuncia['hora_hecho'].upper()}</b> aproximadamente, "
        f"en la dirección <b>{datos_denuncia['lugar_hecho'].upper()}</b>, "
    )

    # 🔵 Determinar si el supuesto autor es conocido o desconocido
    if datos_denuncia.get("nombre_autor"):  # ✅ Verificamos "nombre_autor" en lugar de "nombres"
        texto_cuerpo_2 += f"sindicando como supuesto autor a <b>{datos_denuncia['nombre_autor'].upper()}</b>"

        # 🟢 Agregar solo los datos disponibles del supuesto autor
        detalles_autor = []
        if datos_denuncia.get("cedula_autor"):
            detalles_autor.append(f"con número de documento <b>{datos_denuncia['cedula_autor'].upper()}</b>")
        if datos_denuncia.get("domicilio_autor"):
            detalles_autor.append(f"con domicilio en <b>{datos_denuncia['domicilio_autor'].upper()}</b>")
        if datos_denuncia.get("nacionalidad_autor"):
            detalles_autor.append(f"de nacionalidad <b>{datos_denuncia['nacionalidad_autor'].upper()}</b>")
        if datos_denuncia.get("estado_civil_autor"):
            detalles_autor.append(f"estado civil <b>{datos_denuncia['estado_civil_autor'].upper()}</b>")
        if datos_denuncia.get("edad_autor"):
            detalles_autor.append(f"edad <b>{datos_denuncia['edad_autor']}</b> años")
        if datos_denuncia.get("fecha_nacimiento_autor"):
            fecha_nacimiento_autor = datetime.strptime(datos_denuncia["fecha_nacimiento_autor"], "%Y-%m-%d").strftime("%d/%m/%Y")
            detalles_autor.append(f"nacido en fecha <b>{fecha_nacimiento_autor}</b>")

        if datos_denuncia.get("lugar_nacimiento_autor"):
            detalles_autor.append(f"en <b>{datos_denuncia['lugar_nacimiento_autor'].upper()}</b>")
        if datos_denuncia.get("telefono_autor"):
            detalles_autor.append(f"número de teléfono <b>{datos_denuncia['telefono_autor'].upper()}</b>")
        if datos_denuncia.get("profesion_autor"):
            detalles_autor.append(f"de profesión <b>{datos_denuncia['profesion_autor'].upper()}</b>")

        # 🟢 Agregar los detalles del autor si existen
        if detalles_autor:
            texto_cuerpo_2 += ", " + ", ".join(detalles_autor) + "."
    else:
        texto_cuerpo_2 += "siendo el supuesto autor una persona <b>DESCONOCIDA</b> por la persona denunciante."


    # 🟢 Convertir el segundo párrafo en un `Paragraph`
    parrafo_2 = Paragraph(texto_cuerpo_2, style_cuerpo)

    # 🔵 Primero calculamos la altura del segundo párrafo
    w2, h2 = parrafo_2.wrap(width - 100, height)

    # 🔵 Dibujar el segundo párrafo en la posición FIJA, expandiendo hacia abajo
    parrafo_2.drawOn(c, 50, y_fijo_parrafo_2 - h2)  # 📌 Fijo arriba, expande hacia abajo

    # 🔹 Ajustar `y_texto` para el siguiente contenido
    y_texto = y_fijo_parrafo_2 - h2 - 5  # 🔹 Se reduce para lo que venga después




    from reportlab.platypus import Frame, PageBreak

    def agregar_encabezado(c, width, height, datos):
        """Dibuja el encabezado en cada nueva página con datos dinámicos de oficina y devuelve la nueva posición de y_texto."""
        # 📌 Obtener la oficina del operador desde los datos de la denuncia
        oficina_actual = datos_denuncia.get("oficina", "Asunción")  # Asegurar un valor por defecto

        # 📌 Obtener los datos de la oficina actual (si no encuentra, usa Asunción por defecto)
        datos = datos_oficinas.get(oficina_actual, datos_oficinas["Asunción"])

        # 🔹 Asegurarse de que datos no es None
        if datos is None:
            print(f"⚠ ERROR: No se encontraron datos para la oficina '{oficina_actual}', usando Asunción.")
            datos = datos_oficinas["Asunción"]
        # 📌 Rutas de los logos
        logo_izq = "policianacional.png"
        logo_centro = "dchef.png"
        logo_der = "gobiernonacional.jpg"

        # 📌 Tamaños individuales para cada logo
        logo_izq_size = (150, 150)
        logo_centro_size = (70, 70)
        logo_der_size = (150, 150)

        # 🔵 Dibujar logos en la nueva página
        c.drawImage(logo_izq, 30, height - 115, width=logo_izq_size[0], height=logo_izq_size[1], preserveAspectRatio=True, mask="auto")
        c.drawImage(logo_centro, (width / 2) - (logo_centro_size[0] / 2), height - 75, width=logo_centro_size[0], height=logo_centro_size[1], preserveAspectRatio=True, mask="auto")
        c.drawImage(logo_der, width - 170, height - 120, width=logo_der_size[0], height=logo_der_size[1], preserveAspectRatio=True, mask="auto")

        # 🔵 Primera línea (Negrita)
        y_texto = height - 100  # 🔄 Ajuste más grande para evitar solapamientos
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(width / 2, y_texto, "DIRECCIÓN CONTRA HECHOS PUNIBLES ECONÓMICOS Y FINANCIEROS")

        # 🔵 Segunda línea (Negrita)
        y_texto -= 15
        c.setFont("Helvetica-Bold", 12)
        c.drawCentredString(width / 2, y_texto, "SALA DE DENUNCIAS")

        # 🔵 Datos de contacto
        y_texto -= 15
        c.setFont("Helvetica", 10)
        c.drawCentredString(width / 2, y_texto, f"Dirección: {datos['direccion']}")

        y_texto -= 13
        c.drawCentredString(width / 2, y_texto, f"Teléfono: {datos['telefono']}   Fax: {datos['fax']}")

        y_texto -= 13
        c.drawCentredString(width / 2, y_texto, f"E-mail: {datos['email']}")

        # 🔵 Línea separadora
        y_texto -= 10
        c.setStrokeColor(colors.black)
        c.setLineWidth(1)
        c.line(50, y_texto, width - 50, y_texto)

        return y_texto - 10  # 🔄 Ajuste extra para evitar solapamientos



    def verificar_espacio(c, y_actual, altura_requerida, width, height, datos):
        """
        Si el texto no cabe en la página, genera una nueva página con encabezado
        y devuelve la nueva posición `y_texto`.
        """
        if y_actual - altura_requerida < 50:  # 🔹 Si el texto no cabe...
            c.showPage()  # 🔄 Generar nueva página
            return agregar_encabezado(c, width, height, datos)  # ✅ Ahora actualiza y_texto correctamente
        return y_actual  # Si hay espacio, continuar normalmente


    from reportlab.lib.utils import simpleSplit

    def agregar_relato(c, texto_relato, style_relato, width, height, y_inicial, datos):
        """
        Agrega el relato al PDF, dividiéndolo en fragmentos que caben en cada página
        y manteniendo el formato justificado.
        """
        # 📌 Dividir el texto en líneas que caben en el ancho disponible
        lineas = simpleSplit(texto_relato, style_relato.fontName, style_relato.fontSize, width - 100)
        y_actual = y_inicial  # Posición inicial en la página

        for linea in lineas:
            # Crear un Paragraph para la línea actual
            parrafo_linea = Paragraph(linea, style_relato)
            _, h_linea = parrafo_linea.wrap(width - 100, height)

            # 📌 Verificar si hay espacio antes de dibujar la línea
            if y_actual - h_linea < 30:  # 🔹 Se ajusta un margen mayor
                c.showPage()  # 🔄 Nueva página
                y_actual = agregar_encabezado(c, width, height, datos) + 5  # 🔄 Mayor reserva de espacio

            # Dibujar la línea en la página actual
            parrafo_linea.drawOn(c, 50, y_actual - h_linea)
            y_actual -= h_linea  # Ajustar la posición para la siguiente línea

        return y_actual  # 🔹 Retornar la nueva posición de Y


    # 📌 **TEXTO DEL RELATO**
    # 📌 TEXTO DEL RELATO
    texto_relato = (
        f"De acuerdo a los hechos que se describen a continuación: \n"
        f"{datos_denuncia['relato']}\n"
        f"NO HABIENDO NADA MÁS QUE AGREGAR SE DA POR TERMINADA EL ACTA, PREVIA LECTURA Y RATIFICACIÓN DE SU CONTENIDO, "
        f"FIRMANDO AL PIE EL DENUNCIANTE Y EL INTERVINIENTE, EN 3 (TRES) COPIAS DEL MISMO TENOR Y EFECTO. "
        f"LA PERSONA RECURRENTE ES INFORMADA SOBRE: ARTÍCULO 289.- 'DENUNCIA FALSA'; "
        f"ARTÍCULO 242.- 'TESTIMONIO FALSO'; "
        f"ARTÍCULO 243.- 'DECLARACIÓN FALSA'."
    )


    # 📌 **Estilos del Relato**
    style_relato = ParagraphStyle(
        'Relato',
        fontName='Helvetica-Oblique',  # 🔹 Fuente cursiva
        fontSize=12,
        leading=15,
        alignment=TA_JUSTIFY  # 🔹 Texto justificado
    )

    # 📌 **Agregar el relato**
    y_texto = agregar_relato(c, texto_relato, style_relato, width, height, y_texto, datos_denuncia)


    import qrcode  # Generar el código QR
    from reportlab.lib.utils import ImageReader
    from reportlab.pdfbase.pdfmetrics import stringWidth
    import os  # Necesario para verificar la existencia del archivo QR

    def agregar_firmas_y_qr(c, width, height, y_texto, datos_denuncia, denunciante):
        """
        Agrega las firmas del interviniente y del denunciante, con el código QR en el centro.
        Se asegura que los nombres y títulos estén centrados bajo las líneas de firma.
        """
        margen_x = 80  # 🔹 Margen izquierdo ajustado
        espacio_firma = 150  # 🔹 Ancho para cada firma
        espacio_qr = 100  # 🔹 Tamaño del QR
        espacio_firmas = 100  # 🔹 Espacio total necesario para firmas y QR

        # 📌 Verificar si hay suficiente espacio en la página actual
        if y_texto - espacio_firmas < 120:
            c.showPage()  # 🔄 Generar nueva página
            agregar_encabezado(c, width, height, datos)
            y_texto = height - 150  # 🔄 Reiniciar la posición en la nueva página

        # 📌 Coordenadas de la firma del interviniente (lado izquierdo)
        x_firma_interviniente = margen_x
        y_firma = y_texto - 150  # 🔹 Espacio suficiente para las firmas

        # 📌 Coordenadas del código QR (centro)
        x_qr = (width / 2) - (espacio_qr / 2)
        y_qr = y_firma - 10  # 🔹 Ajuste independiente del QR

        # 📌 Coordenadas de la firma del denunciante (lado derecho)
        x_firma_denunciante = width - margen_x - espacio_firma

        # 🟢 Generar el código QR
        # 🟢 Generar contenido para el código QR
        if vista_previa:
            datos_qr = "Denuncia en proceso de creación"
            hash_qr = "XXXXXXXX"
        else:
            # Verificar si la denuncia tiene coordenadas antes de agregar el enlace
            if datos_denuncia['latitud'] and datos_denuncia['longitud']:
                google_maps_link = f"https://www.google.com/maps?q={datos_denuncia['latitud']},{datos_denuncia['longitud']}"
                ubicacion_text = f"Ubicación: {google_maps_link}\n"
            else:
                ubicacion_text = ""

            datos_qr = (
                f"Denuncia N°: {datos_denuncia['orden']}\n"
                f"Fecha Denuncia: {datos_denuncia['fecha_denuncia']}\n"
                f"Hora Denuncia: {datos_denuncia['hora_denuncia']}\n"
                f"Denunciante: {denunciante['Nombres y Apellidos']}\n"
                f"Doc.: {denunciante['Cédula de Identidad']}\n"
                f"Interviniente: {datos_denuncia['grado_operador']} {datos_denuncia['nombre_operador']}\n"
                f"{ubicacion_text}"
                f"Hash: {datos_denuncia['hash']}"
            )

            hash_qr = datos_denuncia["hash"]

        # 🟢 Generar el código QR
        qr = qrcode.make(datos_qr)

        # 📌 Convertir el QR en una imagen de bytes para ReportLab
        qr_buffer = BytesIO()
        qr.save(qr_buffer, format="PNG")
        qr_buffer.seek(0)
        qr_image = ImageReader(qr_buffer)

        # 📌 Dibujar el Hash encima del Código QR
        c.setFont("Helvetica-Bold", 8)  # Fuente en negrita y tamaño 10
        c.drawCentredString(x_qr + (espacio_qr / 2), y_qr + espacio_qr + 5, hash_qr)  # Centrado sobre el QR


        # 🟢 Dibujar el QR en el PDF directamente desde la memoria
        c.drawImage(qr_image, x_qr, y_qr, width=espacio_qr, height=espacio_qr)

        # 🟢 Dibujar línea para la firma del interviniente
        c.line(x_firma_interviniente, y_firma + 40, x_firma_interviniente + espacio_firma, y_firma + 40)

        # 🟢 Centrar el texto del interviniente
        nombre_interviniente = datos_denuncia["nombre_operador"].upper()
        grado_interviniente = datos_denuncia["grado_operador"].upper()
        ancho_nombre = stringWidth(nombre_interviniente, "Helvetica", 10)
        ancho_grado = stringWidth(grado_interviniente, "Helvetica", 10)

        c.setFont("Helvetica", 10)
        c.drawString(x_firma_interviniente + (espacio_firma - ancho_nombre) / 2, y_firma + 25, nombre_interviniente)
        c.drawString(x_firma_interviniente + (espacio_firma - ancho_grado) / 2, y_firma + 10, grado_interviniente)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x_firma_interviniente + (espacio_firma - stringWidth("INTERVINIENTE", "Helvetica-Bold", 10)) / 2, y_firma - 5, "INTERVINIENTE")

        # 🟢 Dibujar línea para la firma del denunciante
        c.line(x_firma_denunciante, y_firma + 40, x_firma_denunciante + espacio_firma, y_firma + 40)

        # 🟢 Centrar el texto del denunciante
        nombre_denunciante = denunciante["Nombres y Apellidos"].upper()
        doc_denunciante = f"NUMERO DE DOC.: {denunciante['Cédula de Identidad']}"
        ancho_nombre_d = stringWidth(nombre_denunciante, "Helvetica", 10)
        ancho_doc_d = stringWidth(doc_denunciante, "Helvetica", 10)

        c.setFont("Helvetica", 10)
        c.drawString(x_firma_denunciante + (espacio_firma - ancho_nombre_d) / 2, y_firma + 25, nombre_denunciante)
        c.drawString(x_firma_denunciante + (espacio_firma - ancho_doc_d) / 2, y_firma + 10, doc_denunciante)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x_firma_denunciante + (espacio_firma - stringWidth("DENUNCIANTE", "Helvetica-Bold", 10)) / 2, y_firma - 5, "DENUNCIANTE")

        return y_firma - 50  # 🔹 Retornar nueva posición Y para el siguiente contenido

    # 📌 Llamar a la función después del relato
    y_texto = agregar_firmas_y_qr(c, width, height, y_texto, datos_denuncia, denunciante)


    c.save()

    # Obtener los bytes del PDF generado en memoria
    pdf_bytes = buffer.getvalue()
    buffer.close()

    return pdf_bytes  # 📌 Devolvemos los bytes del PDF e
