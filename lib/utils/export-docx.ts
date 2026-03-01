import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, TextRun, PageOrientation, ImageRun, BorderStyle, HeightRule } from 'docx';
import { saveAs } from 'file-saver';

const fetchImageAsBuffer = async (url: string): Promise<Uint8Array> => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
};

export interface DocxMetadata {
    numeroNota: string;
    destinatarioGrado: string;
    destinatarioNombre: string;
    destinatarioCargo: string;
    remitenteGrado: string;
    remitenteNombre: string;
    remitenteCargo: string;
    fechaDesde: string;
    fechaHasta: string;
    oficina?: string;
}

export const exportToDocx = async (
    data: any[],
    fileName: string,
    columns: { header: string; key: string; width?: number }[],
    metadata?: DocxMetadata
) => {
    // Cargar logos
    let logoPolicia: Uint8Array | undefined;
    let logoDchef: Uint8Array | undefined;
    let logoGobierno: Uint8Array | undefined;

    try {
        const [policia, dchef, gobierno] = await Promise.all([
            fetchImageAsBuffer('/policianacional.png'),
            fetchImageAsBuffer('/dchef.png'),
            fetchImageAsBuffer('/gobiernonacional.jpg')
        ]);
        logoPolicia = policia;
        logoDchef = dchef;
        logoGobierno = gobierno;
    } catch (e) {
        console.error('Error cargando logos para DOCX:', e);
    }

    // Preparar Tabla de Datos (La tabla principal)
    const table = new Table({
        width: {
            size: 100,
            type: WidthType.PERCENTAGE,
        },
        rows: [
            // Encabezado de la tabla
            new TableRow({
                children: columns.map(col => new TableCell({
                    width: col.width ? { size: col.width, type: WidthType.PERCENTAGE } : undefined,
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: col.header,
                                    bold: true,
                                    font: 'Roboto',
                                    size: 18 // 9pt
                                })
                            ]
                        })
                    ],
                    shading: { fill: 'F2F2F2' },
                    verticalAlign: AlignmentType.CENTER,
                    margins: {
                        top: 100,
                        bottom: 100,
                        left: 50,
                        right: 50
                    }
                })),
                tableHeader: true,
            }),
            // Datos
            ...data.map(item => new TableRow({
                children: columns.map(col => {
                    const value = item[col.key];
                    const text = (value === undefined || value === null || String(value).trim() === '') ? '-------' : String(value);

                    return new TableCell({
                        width: col.width ? { size: col.width, type: WidthType.PERCENTAGE } : undefined,
                        children: [
                            new Paragraph({
                                alignment: col.key === 'num' ? AlignmentType.CENTER : AlignmentType.LEFT,
                                children: [
                                    new TextRun({
                                        text: text,
                                        font: 'Roboto',
                                        size: 18 // 9pt
                                    })
                                ]
                            })
                        ],
                        verticalAlign: AlignmentType.CENTER,
                        margins: {
                            top: 100,
                            bottom: 100,
                            left: 50,
                            right: 50
                        }
                    });
                }),
            })),
        ],
    });

    // Construcción del Encabezado Institucional (Logos)
    const headerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
        },
        rows: [
            new TableRow({
                children: [
                    // Logo Policía
                    new TableCell({
                        width: { size: 33, type: WidthType.PERCENTAGE },
                        children: [
                            new Paragraph({
                                children: logoPolicia ? [
                                    new ImageRun({
                                        data: logoPolicia,
                                        transformation: { width: 100, height: 40 }
                                    } as any)
                                ] : [new TextRun("")]
                            })
                        ],
                    }),
                    // Logo DCHEF (Centro)
                    new TableCell({
                        width: { size: 34, type: WidthType.PERCENTAGE },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: logoDchef ? [
                                    new ImageRun({
                                        data: logoDchef,
                                        transformation: { width: 65, height: 65 }
                                    } as any)
                                ] : [new TextRun("")]
                            })
                        ],
                    }),
                    // Logo Gobierno
                    new TableCell({
                        width: { size: 33, type: WidthType.PERCENTAGE },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: logoGobierno ? [
                                    new ImageRun({
                                        data: logoGobierno,
                                        transformation: { width: 120, height: 60 }
                                    } as any)
                                ] : [new TextRun("")]
                            })
                        ],
                    }),
                ],
            }),
        ],
    });

    // Lógica de Fecha para la nota
    const fechaActual = new Date();
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const dia = fechaActual.getDate().toString().padStart(2, '0');
    const mes = meses[fechaActual.getMonth()];
    const anio = fechaActual.getFullYear();
    const oficina = metadata?.oficina || "Asunción";
    const fechaNotaStr = `${oficina}, ${dia} de ${mes} del ${anio}`;

    // Cuerpo del documento (Secciones)
    const children: any[] = [
        headerTable,
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200 }, // Mantenido para separación visual de logos
            children: [
                new TextRun({
                    text: "DIRECCIÓN CONTRA HECHOS PUNIBLES ECONÓMICOS Y FINANCIEROS",
                    bold: true,
                    size: 22, // 11pt
                    font: 'Roboto'
                })
            ],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({
                    text: "OFICINA DE GUARDIA",
                    bold: true,
                    size: 20, // 10pt
                    font: 'Roboto'
                })
            ],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100 },
            children: [
                new TextRun({ text: "Dirección: ", bold: true, size: 14, font: 'Roboto' }),
                new TextRun({ text: "E. V. Haedo 725 casi O'Leary | ", size: 14, font: 'Roboto' }),
                new TextRun({ text: "Teléfono: ", bold: true, size: 14, font: 'Roboto' }),
                new TextRun({ text: "(021) 443-159 Fax: (021) 443-126 (021) 441-111 | ", size: 14, font: 'Roboto' }),
                new TextRun({ text: "E-mail: ", bold: true, size: 14, font: 'Roboto' }),
                new TextRun({ text: "ayudantia@delitoseconomicos.gov.py", size: 14, font: 'Roboto' }) // 7pt
            ],
        }),
        new Paragraph({
            spacing: { before: 200, after: 200 },
            border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } },
            children: [new TextRun("")]
        }),
    ];

    // Si hay metadatos, construir el formato de Nota de Elevación
    if (metadata) {
        children.push(
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 200, after: 400 },
                children: [
                    new TextRun({
                        text: fechaNotaStr,
                        font: 'Roboto',
                        size: 22
                    })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { after: 100 },
                children: [
                    new TextRun({
                        text: `DCHPEF/OG/NV/Nº ${metadata.numeroNota}/${anio}`,
                        bold: true,
                        font: 'Roboto',
                        size: 22
                    })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                    new TextRun({ text: metadata.destinatarioGrado, bold: true, font: 'Roboto', size: 22 })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                    new TextRun({ text: `${metadata.destinatarioNombre}, ${metadata.destinatarioCargo}`, bold: true, font: 'Roboto', size: 22 })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { after: 400 },
                children: [
                    new TextRun({ text: "D.C.H.P.E.F.", bold: true, font: 'Roboto', size: 22 })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                indent: { firstLine: 850 }, // Aprox 1.5 cm en primera línea
                spacing: { line: 276, after: 300 }, // Interlineado 1.15
                children: [
                    new TextRun({
                        text: `Tengo el honor de dirigirme a esa superioridad, a objeto de elevar resumen de denuncias recepcionadas en la Sala de Denuncias de esta Direccion, correspondiente al grupo de guardia del dia ${metadata.fechaDesde} desde las 07:00 horas hasata el dia ${metadata.fechaHasta} a las 07:00 horas, todas las actas fueron remitidas a los Departamentos correspondientes cuyos datos se detallan a continuacion:`,
                        font: 'Roboto',
                        size: 22
                    })
                ]
            })
        );
    } else {
        // Formato antiguo por si acaso
        children.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
                children: [
                    new TextRun({
                        text: fileName.toUpperCase(),
                        bold: true,
                        size: 28,
                        font: 'Roboto'
                    })
                ],
            })
        );
    }

    // Añadir Tabla
    children.push(table);

    // Añadir Cierre y Firmas si hay metadatos
    if (metadata) {
        children.push(
            new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { left: 850 },
                spacing: { before: 200, after: 600 },
                children: [
                    new TextRun({
                        text: "Respetuosamente.-",
                        font: 'Roboto',
                        size: 22
                    })
                ]
            }),
            // Firma del Remitente (Centrado, pero alineado a la izquierda. Usamos indent left para llegar a esa zona central)
            new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { left: 5500 }, // Aproximación visual al centro alineado a la izquierda
                children: [
                    new TextRun({ text: metadata.remitenteNombre.toUpperCase(), font: 'Roboto', size: 22, bold: true })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { left: 5500 },
                children: [
                    new TextRun({ text: metadata.remitenteGrado, font: 'Roboto', size: 22 })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { left: 5500 },
                spacing: { after: 300 },
                children: [
                    new TextRun({ text: `${metadata.remitenteCargo} - D.C.H.P.E.F.`, font: 'Roboto', size: 22 })
                ]
            }),
            // Fecha de nuevo alineada a la derecha
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 300 },
                children: [
                    new TextRun({
                        text: fechaNotaStr,
                        font: 'Roboto',
                        size: 22
                    })
                ]
            }),
            // Párrafo de Elevación
            new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { after: 600 },
                children: [
                    new TextRun({
                        text: "Elevo a la División de Talento Humano, para su conocimiento y fines pertinentes.",
                        font: 'Roboto',
                        size: 22
                    })
                ]
            }),
            // Firma del Destinatario (Misma configuración, adaptado a su cargo)
            new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { left: 5500 },
                children: [
                    new TextRun({ text: metadata.destinatarioNombre.toUpperCase(), font: 'Roboto', size: 22, bold: true })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { left: 5500 },
                children: [
                    new TextRun({ text: metadata.destinatarioGrado, font: 'Roboto', size: 22 })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { left: 5500 },
                children: [
                    new TextRun({ text: `${metadata.destinatarioCargo} - D.C.H.P.E.F.`, font: 'Roboto', size: 22 })
                ]
            })
        );
    }

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: 'Arial',
                    },
                    paragraph: {
                        spacing: {
                            before: 0,
                            after: 0
                        }
                    }
                },
            },
        },
        sections: [{
            properties: {
                page: {
                    size: {
                        width: 12240, // 8.5 inches
                        height: 20160, // 14 inches
                        orientation: PageOrientation.PORTRAIT,
                    },
                    margin: {
                        top: 720,
                        bottom: 720,
                        left: 1417, // 2.5 cm
                        right: 720
                    }
                },
            },
            children: children,
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${fileName}.docx`);
};
