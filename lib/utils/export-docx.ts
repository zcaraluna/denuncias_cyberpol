import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, TextRun, PageOrientation, ImageRun, BorderStyle, HeightRule } from 'docx';
import { saveAs } from 'file-saver';

const fetchImageAsBuffer = async (url: string): Promise<Uint8Array> => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
};

export const exportToDocx = async (data: any[], fileName: string, columns: { header: string; key: string; width?: number }[]) => {
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
                                    size: 16
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
                                alignment: AlignmentType.LEFT,
                                children: [
                                    new TextRun({
                                        text: text,
                                        font: 'Roboto',
                                        size: 16
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

    // Construcción del Encabezado Institucional
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
                        children: logoPolicia ? [
                            new Paragraph({
                                children: [
                                    new ImageRun({
                                        data: logoPolicia,
                                        transformation: { width: 100, height: 40 }
                                    } as any)
                                ]
                            })
                        ] : [],
                    }),
                    // Logo DCHEF (Centro)
                    new TableCell({
                        width: { size: 34, type: WidthType.PERCENTAGE },
                        children: logoDchef ? [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new ImageRun({
                                        data: logoDchef,
                                        transformation: { width: 65, height: 65 }
                                    } as any)
                                ]
                            })
                        ] : [],
                    }),
                    // Logo Gobierno
                    new TableCell({
                        width: { size: 33, type: WidthType.PERCENTAGE },
                        children: logoGobierno ? [
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [
                                    new ImageRun({
                                        data: logoGobierno,
                                        transformation: { width: 120, height: 60 }
                                    } as any)
                                ]
                            })
                        ] : [],
                    }),
                ],
            }),
        ],
    });

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: 'Arial',
                    },
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
                        top: 720, // 0.5 inch
                        bottom: 720,
                        left: 720,
                        right: 720
                    }
                },
            },
            children: [
                headerTable,
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200 },
                    children: [
                        new TextRun({
                            text: "DIRECCIÓN CONTRA HECHOS PUNIBLES ECONÓMICOS Y FINANCIEROS",
                            bold: true,
                            size: 26, // 13pt
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
                            size: 24, // 12pt
                            font: 'Roboto'
                        })
                    ],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 100 },
                    children: [
                        new TextRun({ text: "Dirección: ", bold: true, size: 20, font: 'Roboto' }),
                        new TextRun({ text: "E. V. Haedo 725 casi O'Leary", size: 20, font: 'Roboto' })
                    ],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: "Teléfono: ", bold: true, size: 20, font: 'Roboto' }),
                        new TextRun({ text: "(021) 443-159 Fax: (021) 443-126 (021) 441-111", size: 20, font: 'Roboto' })
                    ],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: "E-mail: ", bold: true, size: 20, font: 'Roboto' }),
                        new TextRun({ text: "ayudantia@delitoseconomicos.gov.py", size: 20, font: 'Roboto' })
                    ],
                }),
                new Paragraph({
                    spacing: { before: 200, after: 200 },
                    border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } }
                }),
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
                }),
                table,
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${fileName}.docx`);
};
