import tkinter as tk
from tkinter import ttk
from tkcalendar import DateEntry
from datetime import datetime
import os
import psycopg2
from tkinter import ttk, messagebox
import io
import tempfile
import os
from tkinter import Toplevel
from PyPDF2 import PdfReader
from reportlab.pdfgen import canvas
from pdf2image import convert_from_bytes
from PIL import Image, ImageTk
import tkinter as tk
import tempfile
import os
import platform
import webbrowser
import sys
from datetime import datetime
from tkinter import *
import requests
from tkinterweb import HtmlFrame  # Necesario para mostrar Google Maps en Tkinter
from dotenv import load_dotenv
import os
from PyQt5.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QWidget
from PyQt5.QtWebEngineWidgets import QWebEngineView
import sys
import tkinter as tk
from tkinter import ttk
from PyQt5.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QWidget, QPushButton
from PyQt5.QtWebEngineWidgets import QWebEngineView
from PyQt5.QtCore import QUrl
# Cargar variables de entorno
load_dotenv()

# Obtener la API Key de Google Maps

# Ruta del tema Azure
script_dir = os.path.dirname(os.path.abspath(__file__))
theme_path = os.path.join(script_dir, "azure.tcl")

vista_previa_ventana = None  # Variable global para la ventana de vista previa
imagenes_tk = []  # Evitar que las imágenes sean eliminadas de la memoria


API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
# ✅ Asegurar que QApplication solo se ejecuta una vez
import sys
from PyQt5.QtWidgets import QApplication

# ✅ Solo inicializar `QApplication` una vez
qt_app = QApplication.instance()
if qt_app is None:
    qt_app = QApplication(sys.argv)
class MapaSeleccion(QMainWindow):
    def __init__(self, callback):
        super().__init__()
        print("🟢 Ventana de Mapa creada correctamente")
        self.callback = callback
        self.setWindowTitle("Seleccionar Ubicación en el Mapa")
        self.setGeometry(100, 100, 800, 600)

        self.browser = QWebEngineView()
        self.load_map()

        layout = QVBoxLayout()
        layout.addWidget(self.browser)

        confirm_button = QPushButton("Confirmar Ubicación")
        confirm_button.clicked.connect(self.confirmar_ubicacion)
        layout.addWidget(confirm_button)

        central_widget = QWidget()
        central_widget.setLayout(layout)
        self.setCentralWidget(central_widget)


    def load_map(self):
        """ Carga Google Maps en QWebEngineView con doble clic para seleccionar punto """
        html_mapa = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://maps.googleapis.com/maps/api/js?key={API_KEY}&callback=initMap" async defer></script>
            <script>
                function initMap() {{
                    var defaultLocation = {{lat: -25.2865, lng: -57.6470}};
                    var map = new google.maps.Map(document.getElementById('map'), {{
                        center: defaultLocation,
                        zoom: 13
                    }});

                    var marker = new google.maps.Marker({{
                        position: defaultLocation,
                        map: map,
                        draggable: true
                    }});

                    // Evento para actualizar coordenadas cuando se arrastra el marcador
                    marker.addListener('dragend', function(event) {{
                        document.getElementById('latitud').value = event.latLng.lat();
                        document.getElementById('longitud').value = event.latLng.lng();
                    }});

                    // Evento para detectar doble clic en el mapa y colocar el marcador
                    map.addListener('dblclick', function(event) {{
                        var location = event.latLng;
                        marker.setPosition(location);  // Mover el marcador al nuevo punto
                        map.panTo(location);  // Centrar el mapa en la nueva ubicación

                        document.getElementById('latitud').value = location.lat();
                        document.getElementById('longitud').value = location.lng();
                    }});
                }}
            </script>
        </head>
        <body>
            <h3>Seleccione la ubicación en el mapa (Doble clic para marcar)</h3>
            <div id="map" style="width: 100%; height: 500px;"></div>
            <br>
            <label>Latitud:</label> <input type="text" id="latitud" readonly>
            <label>Longitud:</label> <input type="text" id="longitud" readonly>
        </body>
        </html>
        """
        self.browser.setHtml(html_mapa)

    def confirmar_ubicacion(self):
        """ Obtiene la ubicación seleccionada y la envía de vuelta """
        js_script = "document.getElementById('latitud').value + ',' + document.getElementById('longitud').value"
        
        def handle_result(ubicacion):
            """ Maneja el resultado obtenido del JavaScript """
            print(f"📌 Ubicación obtenida desde el mapa: {ubicacion}")  # 🔹 Verificar en consola

            if ubicacion and "," in ubicacion:
                lat, lng = ubicacion.split(",")
                if lat.strip() and lng.strip():  # ✅ Verificar que los valores no estén vacíos
                    self.callback(lat, lng)
                else:
                    print("⚠ Error: Coordenadas vacías")
            else:
                print("⚠ Error: No se pudo obtener coordenadas del mapa")

            self.close()

        self.browser.page().runJavaScript(js_script, handle_result)

    def recibir_ubicacion(self, ubicacion):
        """ Captura la ubicación seleccionada y la envía de vuelta """
        if ubicacion:
            lat, lng = ubicacion.split(",")
            self.callback(lat, lng)

        self.close()
        self.browser.deleteLater()
        self.browser = None
def abrir_mapa(callback=None):
    """ Abre la ventana del mapa y la muestra correctamente """
    global qt_app
    if qt_app is None:
        qt_app = QApplication(sys.argv)  # ✅ Solo inicializar `QApplication` si no está corriendo

    ventana = MapaSeleccion(callback)
    ventana.show()

    # 🔹 Forzar la ejecución del loop de Qt para asegurarnos de que la ventana aparezca
    qt_app.exec_()








def abrir_nueva_denuncia(nombre, apellido, grado, usuario_id, oficina):
    """Abre la ventana para registrar una nueva denuncia con paginación"""
    global usuario_actual  # Hacemos global el usuario para usarlo en toda la ventana

    # 🔹 Guardamos los datos del usuario como un diccionario, incluyendo la oficina
    usuario_actual = {
        "id": usuario_id,
        "nombre": nombre,
        "apellido": apellido,
        "grado": grado,
        "oficina": oficina  # ✅ Aquí se agrega la oficina
    }


    ventana = tk.Toplevel()
    ventana.title("Nueva Denuncia")
    ventana.state('normal')  # Maximiza la ventana
    # ventana.state('zoomed')  # Maximiza la ventana
    # ventana.iconbitmap("icono.ico")  # ✅ Establece el icono de la ventana principal
    ventana.resizable(True, True)
    ventana.grab_set()

    # Aplicar el tema Azure
    if "azure-light" not in ventana.tk.call("ttk::style", "theme", "names"):
        ventana.tk.call("source", theme_path)
        ventana.tk.call("set_theme", "light")

    # Crear un Notebook para las páginas
    notebook = ttk.Notebook(ventana)
    notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

# ----------- Página 1: Datos Generales y Datos del Denunciante -----------

    import requests
    from datetime import datetime
    import time

    def obtener_hora_online():
        """ Obtiene la fecha y hora actual de Paraguay desde APIs o el sistema """

        urls = {
            "TimeAPI.io": "https://timeapi.io/api/Time/current/zone?timeZone=America/Asuncion",
        }

        for nombre, url in urls.items():
            try:
                response = requests.get(url, timeout=5)  # ⏳ Límite de espera de 5 segundos
                if response.status_code == 200:
                    datos = response.json()

                    if "datetime" in datos:
                        fecha_hora = datetime.fromisoformat(datos["datetime"].split(".")[0])  # ✅ FIX
                    elif "dateTime" in datos:
                        fecha_hora = datetime.fromisoformat(datos["dateTime"].split(".")[0])  # ✅ FIX
                    else:
                        continue  # ❌ Datos inválidos, probar con la siguiente API

                    print(f"✅ Hora obtenida desde {nombre}")
                    return fecha_hora.strftime("%d/%m/%Y"), fecha_hora.strftime("%H:%M")

            except requests.RequestException as e:
                print(f"❌ Error obteniendo la hora online desde {nombre}: {e}")

        # 🔹 Intentar obtener la hora mediante NTP como último recurso
        try:
            import ntplib
            client = ntplib.NTPClient()
            respuesta = client.request('pool.ntp.org', version=3)
            fecha_hora = datetime.fromtimestamp(respuesta.tx_time)
            print("✅ Hora obtenida desde NTP (Network Time Protocol)")
            return fecha_hora.strftime("%d/%m/%Y"), fecha_hora.strftime("%H:%M")
        except Exception as e:
            print(f"⚠️ No se pudo obtener la hora desde NTP: {e}")

        # 🔹 Si todas las opciones fallan, usa la hora del sistema
        print("⚠️ No se pudo obtener la hora en línea, usando hora del sistema.")
        return datetime.now().strftime("%d/%m/%Y"), datetime.now().strftime("%H:%M")

    # ✅ Obtener la fecha y hora desde la API o el sistema
    fecha_actual, hora_actual = obtener_hora_online()
    print(f"📅 Fecha: {fecha_actual} 🕒 Hora: {hora_actual}")



    # ----------- Página 1: Datos Generales y Datos del Denunciante -----------
    page1 = ttk.Frame(notebook)
    notebook.add(page1, text="Datos del Denunciante")

    frame1 = ttk.Frame(page1, padding=15)
    frame1.pack(fill=tk.BOTH, expand=True)

    # Configurar columnas para alineación correcta
    frame1.columnconfigure(0, weight=1)
    frame1.columnconfigure(1, weight=2)

    # Etiqueta de fecha y hora de la denuncia
    ttk.Label(frame1, text="Fecha y Hora de la Denuncia:", font=("Noto Sans", 12, "bold")).grid(
        row=0, column=0, sticky="w", padx=10, pady=5
    )

    # Frame para mostrar la fecha y hora en texto sin edición
    frame_fecha_hora_denuncia = ttk.Frame(frame1)
    frame_fecha_hora_denuncia.grid(row=0, column=1, sticky="w", padx=5, pady=5)

    # Mostrar la fecha como un Label (NO EDITABLE)
    fecha_denuncia_label = ttk.Label(frame_fecha_hora_denuncia, text=fecha_actual, font=("Noto Sans", 12, "bold"), foreground="blue")
    fecha_denuncia_label.pack(side="left", padx=(0, 5))

    # Mostrar la hora como un Label (NO EDITABLE)
    hora_denuncia_label = ttk.Label(frame_fecha_hora_denuncia, text=hora_actual, font=("Noto Sans", 12, "bold"), foreground="blue")
    hora_denuncia_label.pack(side="left")



    # Datos del operador
    # Datos del Operador
    ttk.Label(frame1, text="Datos del Operador:", font=("Noto Sans", 12, "bold")).grid(row=1, column=0, columnspan=2, sticky="w", pady=2)

    ttk.Label(frame1, text="Oficina:", font=("Noto Sans", 12, "bold")).grid(row=2, column=0, sticky="w", padx=10, pady=1)
    ttk.Label(frame1, text=f"{oficina}", font=("Noto Sans", 12)).grid(row=2, column=1, sticky="w", padx=5)

    ttk.Label(frame1, text="Grado:", font=("Noto Sans", 12, "bold")).grid(row=3, column=0, sticky="w", padx=10, pady=1)
    ttk.Label(frame1, text=f"{grado}", font=("Noto Sans", 12)).grid(row=3, column=1, sticky="w", padx=5)

    # 🔹 Ajuste para mover "Datos del Denunciante" hacia abajo
    ttk.Label(frame1, text="Datos del Denunciante:", font=("Noto Sans", 12, "bold")).grid(row=5, column=0, columnspan=2, sticky="w", pady=5)  # 👈 Aumentar `pady`

    # Nombre del operador
    ttk.Label(frame1, text="Nombre:", font=("Noto Sans", 12, "bold")).grid(row=4, column=0, sticky="w", padx=10, pady=1)
    ttk.Label(frame1, text=f"{nombre} {apellido}", font=("Noto Sans", 12)).grid(row=4, column=1, sticky="w", padx=5)





    def calcular_edad(fecha_nacimiento_str):
        """Calcula la edad en base a la fecha de nacimiento ingresada."""
        try:
            fecha_nacimiento = datetime.strptime(fecha_nacimiento_str, "%d/%m/%Y")
            hoy = datetime.today()
            edad = hoy.year - fecha_nacimiento.year - ((hoy.month, hoy.day) < (fecha_nacimiento.month, fecha_nacimiento.day))
            return str(edad)
        except ValueError:
            return ""  # Si la fecha es inválida, retorna vacío

    def actualizar_edad(*args):
        """Obtiene la fecha de nacimiento, calcula la edad y la actualiza en el campo."""
        fecha_nacimiento_original = denunciante_entries["Fecha de Nacimiento:"].get().strip()
        edad_calculada = calcular_edad(fecha_nacimiento_original)  # 🔹 Calculamos la edad aquí

        # 🔹 Habilitar, actualizar y volver a bloquear el campo de edad
        denunciante_entries["Edad:"].config(state="normal")
        denunciante_entries["Edad:"].delete(0, tk.END)
        denunciante_entries["Edad:"].insert(0, edad_calculada)
        denunciante_entries["Edad:"].config(state="readonly")

    # 🟢 Crear etiquetas y entradas en el `frame1` ya existente
    # ttk.Label(frame1, text="Datos del Denunciante:", font=("Noto Sans", 12, "bold")).grid(row=4, column=0, columnspan=2, sticky="w", pady=5)

    denunciante_labels = [
        "Nombres y Apellidos:", "Cédula de Identidad:", "Domicilio:",
        "Nacionalidad:", "Estado Civil:", "Fecha de Nacimiento:", "Edad:",
        "Lugar de Nacimiento:", "Número de Teléfono:", "Profesión:"
    ]

    denunciante_entries = {}

    # 🟢 Función para validar solo números
    def validar_numeros(entrada):
        return entrada.isdigit() or entrada == ""  # Solo permite números o vacío

    vcmd = ventana.register(validar_numeros)  # Registrar validación en Tkinter

    for i, label in enumerate(denunciante_labels):
        ttk.Label(frame1, text=label, font=("Noto Sans", 12)).grid(row=i + 6, column=0, sticky="w", padx=10, pady=5)

        if label == "Edad:":
            entry = ttk.Entry(frame1, width=30, state="readonly")  # 🛑 Hacer campo readonly
        else:
            entry = ttk.Entry(frame1, width=30)

        entry.grid(row=i + 6, column=1, padx=5, pady=5, sticky="w")
        denunciante_entries[label] = entry

    # 🔹 Asociar la función `actualizar_edad` a cambios en el campo "Fecha de Nacimiento"
    denunciante_entries["Fecha de Nacimiento:"].bind("<KeyRelease>", actualizar_edad)  # 🔹 Se actualiza mientras escribe
    denunciante_entries["Fecha de Nacimiento:"].bind("<FocusOut>", actualizar_edad)  # 🔹 También al salir del campo




    # ----------- Página 2: Datos supuesto autor -----------
    page2 = ttk.Frame(notebook)
    notebook.add(page2, text="Supuesto Autor")

    # Frame contenedor
    frame2 = ttk.Frame(page2, padding=15)
    frame2.pack(fill=tk.BOTH, expand=True)

    # Configurar columnas del frame
    frame2.columnconfigure(0, weight=1)
    frame2.columnconfigure(1, weight=1)  # Para evitar que los campos se expandan demasiado

    # Pregunta: ¿El supuesto autor es conocido o desconocido?
    pregunta_label = ttk.Label(frame2, text="¿El supuesto autor es conocido o desconocido?", font=("Noto Sans", 12, "bold"))
    pregunta_label.grid(row=0, column=0, columnspan=2, sticky="n", padx=10, pady=5)

    # Variable para almacenar la selección
    tipo_autor_var = tk.StringVar(value="Desconocido")  # Por defecto, "Desconocido"

    # Frame para los botones de selección
    frame_opciones = ttk.Frame(frame2)
    frame_opciones.grid(row=1, column=0, columnspan=2, pady=5)
    frame_opciones.columnconfigure(0, weight=1)
    frame_opciones.columnconfigure(1, weight=1)

    # Radiobuttons alineados correctamente
    ttk.Radiobutton(frame_opciones, text="Conocido", variable=tipo_autor_var, value="Conocido").grid(row=0, column=0, sticky="w", padx=10)
    ttk.Radiobutton(frame_opciones, text="Desconocido", variable=tipo_autor_var, value="Desconocido").grid(row=0, column=1, sticky="w", padx=10)

    # Campos del supuesto autor (inicialmente ocultos)
    campos_autor = {}

    labels_autor = [
        "Nombres y Apellidos:", "Cédula de Identidad:", "Domicilio:", "Nacionalidad:",
        "Estado Civil:", "Edad:", "Fecha de Nacimiento:", "Lugar de Nacimiento:", "Número de Teléfono:", "Profesión:"
    ]

    fila_actual = 2  # Para controlar la fila donde se colocan los elementos

    for text in labels_autor:
        label = ttk.Label(frame2, text=text, font=("Noto Sans", 12))
        label.grid(row=fila_actual, column=0, sticky="w", padx=10, pady=5)

        entry = ttk.Entry(frame2, width=40)
        entry.grid(row=fila_actual, column=1, padx=5, pady=5, sticky="w")

        # Guardar referencias en un diccionario
        campos_autor[text] = (label, entry)
        fila_actual += 1  # Aumentar la fila

    # ------------ NUEVOS CAMPOS OPCIONALES ------------
    # Estos campos estarán visibles siempre y pueden quedar vacíos

    # Teléfono(s) involucrado(s)
    # Teléfono(s) involucrado(s)
    telefono_label = ttk.Label(frame2, text="Teléfono(s) involucrado(s):", font=("Noto Sans", 12))
    telefono_label.grid(row=fila_actual, column=0, sticky="w", padx=10, pady=5)

    telefono_entry = ttk.Entry(frame2, width=40)
    telefono_entry.grid(row=fila_actual, column=1, padx=5, pady=5, sticky="w")
    fila_actual += 1  # Aumentar la fila

    # Número de Cuenta Beneficiaria
    cuenta_num_label = ttk.Label(frame2, text="Número de Cuenta Beneficiaria:", font=("Noto Sans", 12))
    cuenta_num_label.grid(row=fila_actual, column=0, sticky="w", padx=10, pady=5)

    cuenta_num_entry = ttk.Entry(frame2, width=40)
    cuenta_num_entry.grid(row=fila_actual, column=1, padx=5, pady=5, sticky="w")
    fila_actual += 1  # Aumentar la fila

    # Nombre de Cuenta Beneficiaria
    cuenta_nom_label = ttk.Label(frame2, text="Nombre de Cuenta Beneficiaria:", font=("Noto Sans", 12))
    cuenta_nom_label.grid(row=fila_actual, column=0, sticky="w", padx=10, pady=5)

    cuenta_nom_entry = ttk.Entry(frame2, width=40)
    cuenta_nom_entry.grid(row=fila_actual, column=1, padx=5, pady=5, sticky="w")
    fila_actual += 1  # Aumentar la fila

    # Entidad Bancaria
    entidad_label = ttk.Label(frame2, text="Entidad Bancaria:", font=("Noto Sans", 12))
    entidad_label.grid(row=fila_actual, column=0, sticky="w", padx=10, pady=5)

    # Lista de bancos ordenados alfabéticamente
    bancos = sorted([
        "Banco Atlas", "Banco Continental", "Banco Familiar", "Banco Itaú",
        "Banco Nacional de Fomento", "Banco Regional", "Banco Río",
        "Banco Sudameris", "Bancop", "GNB Paraguay", "Visión Banco", "Ueno Bank"
    ])

    entidad_combobox = ttk.Combobox(frame2, values=bancos, state="readonly", width=37)
    entidad_combobox.grid(row=fila_actual, column=1, padx=5, pady=5, sticky="w")
    entidad_combobox.current(0)  # Seleccionar el primer banco por defecto

    fila_actual += 1  # Aumentar la fila



    # Función para mostrar u ocultar los campos según la selección
    def actualizar_campos_autor(*args):
        if tipo_autor_var.get() == "Conocido":
            for label, entry in campos_autor.values():
                label.grid()  # Volver a mostrar la etiqueta
                entry.grid()  # Volver a mostrar el campo
        else:
            for label, entry in campos_autor.values():
                label.grid_remove()  # Ocultar la etiqueta
                entry.grid_remove()  # Ocultar el campo

    # Vincular la función a la selección de los Radiobuttons
    tipo_autor_var.trace_add("write", actualizar_campos_autor)

    # Ejecutar al inicio para que los campos estén ocultos por defecto
    actualizar_campos_autor()


    # ---------------- PASO 3: Tipo de Denuncia, Relato y Guardado ----------------
    page3 = ttk.Frame(notebook)
    notebook.add(page3, text="Detalles y relato")

    frame3 = ttk.Frame(page3, padding=15)
    frame3.pack(fill=tk.BOTH, expand=True)

    # Configurar columnas para mejorar la alineación
    frame3.columnconfigure(0, weight=0)  # Etiqueta
    frame3.columnconfigure(1, weight=1)  # Campos
    frame3.columnconfigure(2, weight=0)  # Etiqueta hora
    frame3.columnconfigure(3, weight=0)  # Spinbox hora
    frame3.columnconfigure(4, weight=0)  # Spinbox minutos
    # -------------------------------- Fecha y Hora del Hecho --------------------------------
    ttk.Label(frame3, text="Fecha y Hora del Hecho:", font=("Noto Sans", 12, "bold")).grid(row=0, column=0, sticky="w", padx=10, pady=5)

    # Frame contenedor para Fecha y Hora (para mejor alineación)
    frame_fecha_hora = ttk.Frame(frame3)
    frame_fecha_hora.grid(row=0, column=1, columnspan=3, sticky="w", padx=5, pady=5)

    # Campo de fecha (igual al paso 1)
    fecha_hecho = DateEntry(frame_fecha_hora, width=12, background="darkblue", foreground="white", date_pattern="dd/MM/yyyy")
    fecha_hecho.pack(side="left", padx=(0, 5))

    # Etiqueta de hora al lado del campo de fecha
    ttk.Label(frame_fecha_hora, text="", font=("Noto Sans", 12, "bold")).pack(side="left", padx=(5, 5))

    # Spinbox para seleccionar hora
    hora_hecho_var = tk.StringVar()
    hora_hecho = ttk.Spinbox(frame_fecha_hora, textvariable=hora_hecho_var, from_=0, to=23, width=6, format="%02.0f", justify="left")
    hora_hecho.pack(side="left", padx=(0, 2))

    # Spinbox para seleccionar minutos
    minutos_hecho_var = tk.StringVar()
    minutos_hecho = ttk.Spinbox(frame_fecha_hora, textvariable=minutos_hecho_var, from_=0, to=59, width=6, format="%02.0f", justify="left")
    minutos_hecho.pack(side="left", padx=(2, 0))

    # Obtener la hora actual del sistema
    from datetime import datetime
    hora_actual = datetime.now().strftime("%H")
    minutos_actual = datetime.now().strftime("%M")

    hora_hecho_var.set(hora_actual)
    minutos_hecho_var.set(minutos_actual)


    # -------------------------------- Tipo de Denuncia --------------------------------
    ttk.Label(frame3, text="Tipo de Denuncia:", font=("Noto Sans", 12, "bold")).grid(row=1, column=0, sticky="w", padx=10, pady=5)

    # Lista de tipos de hecho según lo solicitado
    tipos_denuncia = [
        "Estafa", "Estafa a través de sistemas informáticos", "Acceso indebido a datos", "Pornografía infantil",
        "Clonación de tarjetas de crédito y/o débito", "Lesión a la imagen y la comunicación", "Suplantación de identidad",
        "Abuso de documento de identidad", "Difamación, Calumnia y/o Injuria", "Producción de documentos no auténticos",
        "Extravío de documentos", "Usura", "Otro (Especificar)"
    ]

    # Combobox para elegir el tipo de hecho
    tipo_denuncia_var = tk.StringVar()
    tipo_denuncia_cb = ttk.Combobox(frame3, textvariable=tipo_denuncia_var, values=tipos_denuncia, state="readonly", width=40)
    tipo_denuncia_cb.grid(row=1, column=1, padx=5, pady=5, sticky="w")
    tipo_denuncia_cb.current(0)  # Por defecto, selecciona "Estafa"

    # -------------------------------- Campo "Otro (Especificar)" (Inicialmente oculto) # -------------------------------- Campo "Otro (Especificar)" (Inicialmente oculto) --------------------------------
    label_tipo_otro = ttk.Label(frame3, text="Especifique aquí:", font=("Noto Sans", 12))
    entry_tipo_otro = ttk.Entry(frame3, width=40)

    # -------------------------------- Lugar del Hecho --------------------------------
    ttk.Label(frame3, text="Lugar del Hecho:", font=("Noto Sans", 12, "bold")).grid(row=3, column=0, sticky="w", padx=10, pady=5)

    lugar_hecho_entry = ttk.Entry(frame3, width=40)
    lugar_hecho_entry.grid(row=3, column=1, padx=5, pady=5, sticky="w")

    # 🟢 Función para mostrar/ocultar el Entry "Otro (Especificar)"
    def actualizar_entry_tipo():
        if tipo_denuncia_var.get() == "Otro (Especificar)":
            label_tipo_otro.grid(row=2, column=0, sticky="w", padx=10, pady=5)
            entry_tipo_otro.grid(row=2, column=1, padx=5, pady=5, sticky="w")
        else:
            label_tipo_otro.grid_remove()
            entry_tipo_otro.grid_remove()

    # Asociar función al cambio de selección en el Combobox
    tipo_denuncia_var.trace_add("write", lambda *args: actualizar_entry_tipo())

    # -------------------------------- Relato del Hecho --------------------------------
    ttk.Label(frame3, text="Relato del Hecho:", font=("Noto Sans", 12, "bold")).grid(row=4, column=0, sticky="w", padx=10, pady=10)

    # Campo de texto grande para el relato
    relato_text = tk.Text(frame3, width=60, height=10, wrap="word")
    relato_text.grid(row=4, column=1, padx=5, pady=5, sticky="w", columnspan=2)

    # Scrollbar para el campo de texto
    scrollbar = ttk.Scrollbar(frame3, orient="vertical", command=relato_text.yview)
    scrollbar.grid(row=4, column=3, sticky="ns")
    relato_text.config(yscrollcommand=scrollbar.set)

    # -------------------------------- Monto estimado de daño patrimonial --------------------------------

    import re

    def validate_number_input(text):
        """ Permite solo números enteros y mantiene los puntos de millares automáticamente generados """
        return text.replace(".", "").isdigit() or text == ""

    def format_currency(event=None):
        """ Formatea la entrada para que tenga separadores de miles correctamente """
        text = monto_dano_entry.get()

        # Eliminar caracteres no numéricos excepto los puntos de millares
        clean_text = re.sub(r"[^\d]", "", text)

        # Aplicar formato con separadores de miles si es un número válido
        if clean_text.isdigit():
            formatted_text = "{:,}".format(int(clean_text)).replace(",", ".")  # Formato con puntos
            monto_dano_entry.delete(0, tk.END)
            monto_dano_entry.insert(0, formatted_text)

    # Crear un comando de validación en Tkinter
    validate_cmd = frame3.register(validate_number_input)

    # -------------------------------- Monto estimado de daño patrimonial --------------------------------
    ttk.Label(frame3, text="Monto estimado de\ndaño patrimonial estimado", font=("Noto Sans", 12, "bold")).grid(
        row=5, column=0, sticky="w", padx=10, pady=(5, 2)
    )

    # Campo de entrada para el monto (permite números con separación de miles)
    monto_dano_entry = ttk.Entry(frame3, width=20, justify="right", validate="key", validatecommand=(validate_cmd, "%P"))
    monto_dano_entry.grid(row=5, column=1, padx=5, pady=(2, 5), sticky="w")
    monto_dano_entry.bind("<KeyRelease>", format_currency)  # Formatea después de la validación

    # Combobox con las monedas más utilizadas (sin símbolos raros)
    monedas = [
        "Guaraníes (PYG)",
        "Dólares (USD)",
        "Euros (EUR)",
        "Pesos Argentinos (ARS)",
        "Reales (BRL)",
    ]

    moneda_combobox = ttk.Combobox(frame3, values=monedas, state="readonly", width=25)
    moneda_combobox.grid(row=5, column=2, padx=5, pady=(2, 5), sticky="w")
    moneda_combobox.current(0)  # Selecciona Guaraníes por defecto

    # ---------------- Variable Oculta para Coordenadas ----------------
    latitud_var = tk.StringVar()
    longitud_var = tk.StringVar()

    # ---------------- Botón "Abrir Mapa" ----------------
    def abrir_mapa_debug():
        print("🟢 Botón presionado: Intentando abrir el mapa...")
        abrir_mapa(recibir_coordenadas)

    btn_mapa = ttk.Button(frame3, text="📍 Abrir Mapa", command=abrir_mapa_debug)
    btn_mapa.grid(row=3, column=2, padx=5, pady=5, sticky="w")


    def recibir_coordenadas(lat, lng):
        """ Captura la ubicación seleccionada y la almacena en variables globales """
        print(f"✅ Ubicación seleccionada: Latitud={lat}, Longitud={lng}")
        latitud_var.set(lat)
        longitud_var.set(lng)

    # ---------------- Función para Guardar la Ubicación ----------------
    def actualizar_ubicacion(lat, lng):
        """ Guarda la latitud y longitud en variables ocultas sin mostrarlas en la interfaz """
        latitud_var.set(lat)
        longitud_var.set(lng)




    # -------------------------------- Aviso Legal --------------------------------
    aviso_legal = """LA PERSONA RECURRENTE DEBE SER INFORMADA SOBRE:\nARTÍCULO 289.- “DENUNCIA FALSA”;\nARTÍCULO 242.- “TESTIMONIO FALSO”;\nARTÍCULO 243.- “DECLARACIÓN FALSA, DEL CODIGO PROCESAL PENAL”
    """
    ttk.Label(frame3, text=aviso_legal, font=("Noto Sans", 10, "italic"), wraplength=600, justify="left").grid(
        row=6, column=0, columnspan=4, padx=10, pady=10, sticky="w"
    )






    from generar_pdf import generar_pdf  # ✅ Importamos la función corregida
    from datetime import datetime
    import random
    import string
    import psycopg2
    from tkinter import messagebox, filedialog
    import os
    from datetime import datetime
    from generar_pdf import generar_pdf  # ✅ Importamos la función corregida

    def generar_hash():
        """Genera un hash aleatorio de 5 caracteres + ID de la oficina + año"""
        identificadores = {
            "Asunción": "A",
            "Ciudad del Este": "B",
            "Encarnación": "C",
            "Coronel Oviedo": "D"
        }

        id_oficina = identificadores.get(oficina, "0")  # Si no encuentra la oficina, usa "0"
        anio_actual = datetime.now().year % 100  # Solo los últimos dos dígitos del año

        hash_base = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))

        return f"{hash_base}{id_oficina}{anio_actual}"  # Ejemplo: "XKJ42_12025"

    def guardar_denuncia(vista_previa=False):
        """Guarda la denuncia en la base de datos y genera el PDF."""

        # 🟢 Generar hash único para la denuncia
        hash_denuncia = generar_hash()

        # 🟢 Obtener datos del denunciante
        nombres = denunciante_entries["Nombres y Apellidos:"].get().strip()
        cedula = denunciante_entries["Cédula de Identidad:"].get().strip()
        domicilio = denunciante_entries["Domicilio:"].get().strip()
        nacionalidad = denunciante_entries["Nacionalidad:"].get().strip()
        estado_civil = denunciante_entries["Estado Civil:"].get().strip()
        edad = ''.join(filter(str.isdigit, denunciante_entries["Edad:"].get().strip()))
        fecha_nacimiento_original = denunciante_entries["Fecha de Nacimiento:"].get().strip()
        fecha_nacimiento_original = denunciante_entries["Fecha de Nacimiento:"].get().strip()

        if not fecha_nacimiento_original:
            messagebox.showerror("Error", "Debe ingresar la fecha de nacimiento del denunciante.")
            return  # 🔹 Evita que el código continúe con un valor vacío

        fecha_nacimiento = datetime.strptime(fecha_nacimiento_original, "%d/%m/%Y").strftime("%Y-%m-%d")
        lugar_nacimiento = denunciante_entries["Lugar de Nacimiento:"].get().strip()
        telefono = denunciante_entries["Número de Teléfono:"].get().strip()
        profesion = denunciante_entries["Profesión:"].get().strip()

        # 🟢 Crear diccionario denunciante ANTES de cualquier otra operación
        denunciante = {
            "Nombres y Apellidos": nombres,
            "Cédula de Identidad": cedula,
            "Domicilio": domicilio,
            "Nacionalidad": nacionalidad,
            "Estado Civil": estado_civil,
            "Edad": edad,
            "Fecha de Nacimiento": fecha_nacimiento,
            "Lugar de Nacimiento": lugar_nacimiento,
            "Número de Teléfono": telefono,
            "Profesión": profesion
        }

        # 🟢 Obtener datos de la denuncia
        fecha_original = fecha_hecho.get()  # "DD/MM/YYYY"
        fecha = datetime.strptime(fecha_original, "%d/%m/%Y").strftime("%Y-%m-%d")  # Convertir a "YYYY-MM-DD"
        hora = f"{hora_hecho_var.get()}:{minutos_hecho_var.get()}"

        # 🔹 Mantener "OTRO" en tipo_denuncia si el usuario elige especificar
        if tipo_denuncia_var.get() == "Otro (Especificar)":
            tipo_denuncia = "OTRO"
            otro_tipo = entry_tipo_otro.get().strip()
        else:
            tipo_denuncia = tipo_denuncia_var.get()
            otro_tipo = None

        lugar_hecho = lugar_hecho_entry.get().strip() if lugar_hecho_entry else "NO ESPECIFICADO"
        relato = relato_text.get("1.0", tk.END).strip()

        # 🔵 **Crear `datos_denuncia` ANTES de continuar**
        # 🔵 **Crear `datos_denuncia` ANTES de continuar**
        datos_denuncia = {
            "fecha_denuncia": datetime.strptime(fecha_denuncia_label.cget("text"), "%d/%m/%Y").strftime("%Y-%m-%d"),
            "hora_denuncia": hora_denuncia_label.cget("text"),
            "fecha_hecho": fecha,
            "hora_hecho": hora,
            "tipo_denuncia": tipo_denuncia,
            "otro_tipo": otro_tipo,
            "lugar_hecho": lugar_hecho,
            "relato": relato,
            "orden": None,  # Se actualizará después de obtener el número de orden
            "hash": hash_denuncia,  # ✅ Añadir el hash a los datos
            "oficina": oficina,  # ✅ Agregar la oficina del operador

            # 🔹 Incluir monto estimado de daño patrimonial y moneda
            "monto_dano": monto_dano_entry.get().strip() or None,  # Guardar como texto o None si está vacío
            "moneda": moneda_combobox.get().strip() or None,  # Guardar como texto o None si está vacío

            # 🔹 Incluir coordenadas si están disponibles
            "latitud": latitud if latitud else None,
            "longitud": longitud if longitud else None
        }




        # 🟡 ✅ **Validación de datos antes de continuar**
        if not validar_datos(denunciante_entries, tipo_denuncia_var, relato_text, entry_tipo_otro, lugar_hecho_entry):
            return  # ❌ Detener la ejecución si la validación falla

        # 🟢 Obtener número de orden
        numero_orden = obtener_numero_orden(datos_denuncia["fecha_denuncia"])
        if numero_orden is None:
            return

        datos_denuncia["orden"] = numero_orden  # ✅ Actualizar orden en `datos_denuncia`


        # 🟢 Obtener datos del supuesto autor (solo si es conocido)
        # 🔹 Obtener si el supuesto autor es "Conocido" o "Desconocido"
        autor_conocido = tipo_autor_var.get()  # "Conocido" o "Desconocido"

        # 🔹 Obtener datos opcionales del supuesto autor (pueden estar vacíos)
        datos_denuncia.update({
            "telefonos_involucrados": telefono_entry.get().strip() or None,
            "numero_cuenta_beneficiaria": cuenta_num_entry.get().strip() or None,
            "nombre_cuenta_beneficiaria": cuenta_nom_entry.get().strip() or None,
        })

        # 🔹 Si el autor es conocido, capturar los datos ingresados (pueden estar incompletos)
        if autor_conocido == "Conocido":
            fecha_nacimiento_autor = campos_autor["Fecha de Nacimiento:"][1].get().strip() or None

            datos_denuncia.update({
                "autor_conocido": "Conocido",
                "nombre_autor": campos_autor["Nombres y Apellidos:"][1].get().strip() or None,
                "cedula_autor": campos_autor["Cédula de Identidad:"][1].get().strip() or None,
                "domicilio_autor": campos_autor["Domicilio:"][1].get().strip() or None,
                "nacionalidad_autor": campos_autor["Nacionalidad:"][1].get().strip() or None,
                "estado_civil_autor": campos_autor["Estado Civil:"][1].get().strip() or None,
                "edad_autor": campos_autor["Edad:"][1].get().strip() or None,
                "fecha_nacimiento_autor": (
                    datetime.strptime(fecha_nacimiento_autor, "%d/%m/%Y").strftime("%Y-%m-%d")
                    if fecha_nacimiento_autor else None  # ✅ Solo convierte si hay un valor
                ),
                "lugar_nacimiento_autor": campos_autor["Lugar de Nacimiento:"][1].get().strip() or None,
                "telefono_autor": campos_autor["Número de Teléfono:"][1].get().strip() or None,
                "profesion_autor": campos_autor["Profesión:"][1].get().strip() or None,
            })








        else:
            # 🔹 Si el autor es desconocido, almacenamos solo los datos involucrados
            datos_denuncia.update({
                "autor_conocido": "Desconocido",
                "nombre_autor": None,
                "cedula_autor": None,
                "domicilio_autor": None,
                "nacionalidad_autor": None,
                "estado_civil_autor": None,
                "edad_autor": None,
                "fecha_nacimiento_autor": None,
                "lugar_nacimiento_autor": None,
                "telefono_autor": None,
                "profesion_autor": None,
            })


        # 🔵 Conectar a la base de datos
        conn = conectar_db()
        if not conn:
            return

        cursor = conn.cursor()







        try:
            # 🔵 Buscar si el denunciante ya existe
            # Intentar obtener el denunciante por cédula
            cursor.execute("SELECT id FROM denunciantes WHERE cedula = %s", (cedula,))
            resultado = cursor.fetchone()

            if resultado:
                denunciante_id = resultado[0]  # ✅ Obtener el ID del denunciante
            else:
                # Si el denunciante no existe, insertarlo y obtener el ID
                cursor.execute("""
                    INSERT INTO denunciantes (nombres, cedula, domicilio, nacionalidad, estado_civil, edad,
                                            fecha_nacimiento, lugar_nacimiento, telefono, profesion)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (nombres, cedula, domicilio, nacionalidad, estado_civil, edad,
                    fecha_nacimiento, lugar_nacimiento, telefono, profesion))

                resultado = cursor.fetchone()
                if resultado:
                    denunciante_id = resultado[0]  # ✅ Obtener el ID correctamente
                else:
                    raise Exception("Error: No se pudo obtener el ID del denunciante.")


            # 🔵 CONFIRMAR la inserción del denunciante antes de continuar
            conn.commit()  # 🔥 Importante: Asegura que el denunciante está en la base de datos






            usuario_id = usuario_actual["id"]

            # 🔵 Obtener datos del usuario actual
            grado_usuario = usuario_actual.get("grado", "NO ESPECIFICADO")
            nombre_usuario = f"{usuario_actual.get('nombre', 'NO ESPECIFICADO')} {usuario_actual.get('apellido', '')}".strip()

            # 🟢 Agregar más datos a `datos_denuncia`
            datos_denuncia.update({
                "grado_operador": grado_usuario,
                "nombre_operador": nombre_usuario,
            })

            # 📌 **Generar el PDF en memoria**
            # 📌 **Generar el PDF en memoria**
            pdf_bytes = generar_pdf(numero_orden, denunciante, datos_denuncia, vista_previa)

            if vista_previa:
                # 🟢 **Si es vista previa, mostrar el PDF y salir sin guardar**
                mostrar_vista_previa(pdf_bytes)
                return

            # 🟢 **Insertar la denuncia en la base de datos con el PDF**
            # 🔹 Obtener el monto estimado del daño patrimonial (eliminando los puntos de millares)
            monto_dano = monto_dano_entry.get().strip().replace(".", "")  # 🔥 Eliminar separadores de miles

            # Si el campo está vacío, almacenar como NULL en la base de datos
            monto_dano = None if not monto_dano else int(monto_dano)  # Convertir a número

            # 🔹 Obtener la moneda seleccionada del ComboBox
            moneda = moneda_combobox.get().strip() or None  # Si está vacío, almacenar como NULL





            # 🔵 Buscar si el denunciante ya existe
            cursor.execute("SELECT id FROM denunciantes WHERE cedula = %s", (cedula,))
            resultado = cursor.fetchone()

            if resultado:
                denunciante_id = resultado[0]  # ✅ Si ya existe, obtenemos su ID
            else:
                # 🟢 Insertar nuevo denunciante
                cursor.execute("""
                    INSERT INTO denunciantes (nombres, cedula, domicilio, nacionalidad, estado_civil, edad,
                                            fecha_nacimiento, lugar_nacimiento, telefono, profesion)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (nombres, cedula, domicilio, nacionalidad, estado_civil, edad,
                    fecha_nacimiento, lugar_nacimiento, telefono, profesion))

                resultado = cursor.fetchone()
                if resultado:
                    denunciante_id = resultado[0]  # ✅ Obtener el ID correctamente
                else:
                    raise Exception("Error: No se pudo obtener el ID del denunciante.")
            # 🔵 Insertar la denuncia y obtener el ID generado
            cursor.execute("""
                INSERT INTO denuncias (
                    denunciante_id, fecha_denuncia, hora_denuncia, fecha_hecho, hora_hecho, tipo_denuncia, otro_tipo,
                    relato, lugar_hecho, latitud, longitud, orden, usuario_id, oficina, operador_grado,
                    operador_nombre, operador_apellido, monto_dano, moneda, hash, pdf
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                denunciante_id, datos_denuncia["fecha_denuncia"], datos_denuncia["hora_denuncia"],
                fecha, hora, tipo_denuncia, otro_tipo, relato, lugar_hecho,
                latitud, longitud,  # Agregamos las coordenadas aquí
                numero_orden, usuario_actual["id"], usuario_actual["oficina"],
                usuario_actual["grado"], usuario_actual["nombre"], usuario_actual["apellido"],
                monto_dano, moneda, hash_denuncia, psycopg2.Binary(pdf_bytes)
            ))

            resultado = cursor.fetchone()
            if resultado:
                denuncia_id = resultado[0]  # ✅ Obtener el ID correctamente
            else:
                raise Exception("Error: No se pudo obtener el ID de la denuncia.")

            # 🔵 Insertar el supuesto autor SOLO si es conocido
            # 🔵 Insertar el supuesto autor en `supuestos_autores`
            # 🔵 Insertar SIEMPRE el supuesto autor, incluso si es desconocido

            datos_denuncia["entidad_bancaria"] = entidad_combobox.get().strip() if entidad_combobox.get() else None
            print(f"📌 Entidad bancaria seleccionada: {datos_denuncia.get('entidad_bancaria')}")
            # 📌 Obtener los datos ingresados por el operador
            nombre_autor = datos_denuncia.get("nombre_autor")
            cedula_autor = datos_denuncia.get("cedula_autor")
            telefono_involucrado = datos_denuncia.get("telefonos_involucrados")
            cuenta_beneficiaria = datos_denuncia.get("numero_cuenta_beneficiaria")
            nombre_cuenta = datos_denuncia.get("nombre_cuenta_beneficiaria")

            # 📌 Verificar si al menos uno de estos campos tiene datos
            if any([nombre_autor, cedula_autor, telefono_involucrado, cuenta_beneficiaria, nombre_cuenta]):
                # ✅ Al menos un dato fue ingresado, se guarda en la base de datos
                cursor.execute("""
                    INSERT INTO supuestos_autores (
                        denuncia_id, autor_conocido, nombre_autor, cedula_autor, domicilio_autor,
                        nacionalidad_autor, estado_civil_autor, edad_autor, fecha_nacimiento_autor,
                        lugar_nacimiento_autor, telefono_autor, profesion_autor,
                        telefonos_involucrados, numero_cuenta_beneficiaria, nombre_cuenta_beneficiaria, entidad_bancaria
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    denuncia_id, autor_conocido,
                    nombre_autor if autor_conocido == "Conocido" else None,
                    cedula_autor if autor_conocido == "Conocido" else None,
                    datos_denuncia.get("domicilio_autor") if autor_conocido == "Conocido" else None,
                    datos_denuncia.get("nacionalidad_autor") if autor_conocido == "Conocido" else None,
                    datos_denuncia.get("estado_civil_autor") if autor_conocido == "Conocido" else None,
                    datos_denuncia.get("edad_autor") if autor_conocido == "Conocido" else None,
                    datos_denuncia.get("fecha_nacimiento_autor") if autor_conocido == "Conocido" else None,
                    datos_denuncia.get("lugar_nacimiento_autor") if autor_conocido == "Conocido" else None,
                    datos_denuncia.get("telefono_autor") if autor_conocido == "Conocido" else None,
                    datos_denuncia.get("profesion_autor") if autor_conocido == "Conocido" else None,
                    telefono_involucrado, cuenta_beneficiaria, nombre_cuenta,
                    datos_denuncia.get("entidad_bancaria")  # ✅ Ahora se almacena correctamente
                ))
            else:
                # ❌ No se ingresaron datos relevantes, no se guarda nada en la base de datos
                print("⚠️ No se ingresaron datos suficientes. No se guardará el supuesto autor.")






            # 🔵 Insertar la denuncia en el historial de denuncias
            cursor.execute("""
                INSERT INTO historial_denuncias (nombre_denunciante, cedula_denunciante, operador,
                                                fecha_denuncia, hora_denuncia, numero_orden, tipo_hecho, hash_denuncia)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                denunciante["Nombres y Apellidos"],
                denunciante["Cédula de Identidad"],
                f"{usuario_actual['grado']} {usuario_actual['nombre']} {usuario_actual['apellido']}",
                datos_denuncia["fecha_denuncia"],
                datos_denuncia["hora_denuncia"],
                datos_denuncia["orden"],  # 🟢 Se agrega el número de orden de la denuncia
                datos_denuncia["tipo_denuncia"],
                datos_denuncia["hash"]
            ))

            conn.commit()  # ✅ Confirmar TODOS los cambios juntos

            # 📌 **Pregunta al usuario si desea descargar el PDF**
            respuesta = messagebox.askyesno("Descargar PDF", f"Denuncia guardada con Hash: {hash_denuncia}\n¿Desea descargar el PDF ahora?")
            if respuesta:
                archivo_guardado = filedialog.asksaveasfilename(
                    defaultextension=".pdf",
                    filetypes=[("Archivos PDF", "*.pdf")],
                    initialfile=f"Denuncia_{datos_denuncia['orden']}-{datos_denuncia['fecha_denuncia'].split('-')[0]}.pdf",
                    title="Guardar denuncia como"
                )

                if archivo_guardado:
                    with open(archivo_guardado, "wb") as f:
                        f.write(pdf_bytes)
                    os.system(f"xdg-open '{archivo_guardado}'")  # 📌 Linux
                    # os.startfile(archivo_guardado)  # 📌 Windows

            # ✅ **Después de la respuesta, cerrar la ventana**
            ventana.destroy()

        except Exception as e:
            conn.rollback()
            messagebox.showerror("Error", f"No se pudo guardar la denuncia: {e}", parent=ventana)

        finally:
            cursor.close()
            conn.close()






    def mostrar_vista_previa(pdf_bytes):
        """Guarda temporalmente el PDF y lo abre con el visor predeterminado del sistema."""

        # 📌 Crear un archivo temporal
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
            temp_pdf.write(pdf_bytes)
            temp_pdf_path = temp_pdf.name  # Guardar la ruta

        # 📌 Abrir el PDF con el visor del sistema
        sistema = platform.system()

        try:
            if sistema == "Windows":
                os.startfile(temp_pdf_path)  # Windows
            elif sistema == "Darwin":  # macOS
                os.system(f"open '{temp_pdf_path}'")
            else:  # Linux
                os.system(f"xdg-open '{temp_pdf_path}'")

        except Exception:
            webbrowser.open(temp_pdf_path)  # Alternativa en caso de error





    # -------------------------------- Botón de Guardar Denuncia --------------------------------
    btn_vista_previa = ttk.Button(
        frame3, text="Vista Previa", style="TButton",
        command=lambda: guardar_denuncia(vista_previa=True)  # ✅ Enviar vista_previa=True
    )
    btn_vista_previa.grid(row=8, column=0, columnspan=4, pady=10)
    from tkinter import messagebox

    btn_guardar = ttk.Button(
        frame3, text="Finalizar", style="Accent.TButton",
        command=lambda: guardar_denuncia(vista_previa=False) if messagebox.askyesno(
            "Confirmar envío", "¿Estás seguro? ⚠ Una vez enviada la denuncia, no se puede deshacer."
        ) else None
    )
    btn_guardar.grid(row=7, column=0, columnspan=4, pady=15)




from tkinter import messagebox
from datetime import datetime

def validar_datos(denunciante_entries, tipo_denuncia_var, relato_text, entry_tipo_otro, lugar_hecho_entry):
    """ Valida que los datos requeridos sean correctos antes de guardar la denuncia. """

    # ✅ Validaciones del Paso 1 (Datos del Denunciante)
    if not all([denunciante_entries["Nombres y Apellidos:"].get().strip(),
                denunciante_entries["Cédula de Identidad:"].get().strip(),
                denunciante_entries["Domicilio:"].get().strip(),
                denunciante_entries["Nacionalidad:"].get().strip(),
                denunciante_entries["Estado Civil:"].get().strip(),
                denunciante_entries["Edad:"].get().strip(),
                denunciante_entries["Fecha de Nacimiento:"].get().strip(),
                denunciante_entries["Lugar de Nacimiento:"].get().strip(),
                denunciante_entries["Número de Teléfono:"].get().strip(),
                denunciante_entries["Profesión:"].get().strip()]):
        messagebox.showerror("Error", "Todos los campos del Paso 1 son obligatorios.")
        return False

    # ✅ Validación de edad (debe ser un número válido)
    edad = denunciante_entries["Edad:"].get().strip()
    if not edad.isdigit() or int(edad) <= 0 or int(edad) > 120:
        messagebox.showerror("Error", "La edad debe ser un número válido entre 1 y 120.")
        return False

    # ✅ Validación de fecha de nacimiento (asegurar formato correcto)
    # Convertir fecha de nacimiento de DD/MM/AAAA a YYYY-MM-DD para PostgreSQL
    fecha_nacimiento_original = denunciante_entries["Fecha de Nacimiento:"].get().strip()

    try:
        datetime.strptime(fecha_nacimiento_original, "%d/%m/%Y")  # ✅ Solo validamos el formato
    except ValueError:
        messagebox.showerror("Error", "Fecha de nacimiento inválida. Debe estar en formato DD/MM/AAAA")
        return False  # ❌ Detener la ejecución si la fecha no es válida



    # ✅ Validaciones del Paso 3 (Denuncia)
    if not tipo_denuncia_var.get().strip():
        messagebox.showerror("Error", "Debe seleccionar un tipo de denuncia.")
        return False

    if tipo_denuncia_var.get() == "Otro (Especificar)":
        if entry_tipo_otro and not entry_tipo_otro.get().strip():
            messagebox.showerror("Error", "Debe especificar el tipo de denuncia si seleccionó 'Otro'.")
            return False

    # ✅ Validación del Lugar del Hecho (Obligatorio)
    if not lugar_hecho_entry.get().strip():
        messagebox.showerror("Error", "Debe ingresar el lugar del hecho.")
        return False

    # ✅ Validación del Relato del Hecho (Obligatorio)
    if not relato_text.get("1.0", "end").strip():
        messagebox.showerror("Error", "Debe escribir el relato del hecho.")
        return False

    return True  # Si pasa todas las validaciones, devuelve True




import psycopg2
from datetime import datetime

def conectar_db():
    """Conectar a la base de datos en Render"""
    try:
        DATABASE_URL = os.getenv("DATABASE_URL")
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except psycopg2.Error as e:
        messagebox.showerror("Error", f"No se pudo conectar a la base de datos: {e}")
        return None

def obtener_numero_orden(fecha_denuncia):
    conn = conectar_db()
    if not conn:
        return None

    cursor = conn.cursor()
    try:
        año = fecha_denuncia.split("-")[0]  # Extrae el año en formato YYYY-MM-DD
        cursor.execute("""
            SELECT COALESCE(MAX(orden), 0) + 1
            FROM denuncias
            WHERE EXTRACT(YEAR FROM fecha_denuncia) = %s
        """, (año,))
        orden = cursor.fetchone()[0]
    except Exception as e:
        messagebox.showerror("Error", f"No se pudo obtener el número de orden: {e}")
        orden = None
    finally:
        cursor.close()
        conn.close()
    return orden




