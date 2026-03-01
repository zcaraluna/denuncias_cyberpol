import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, TextRun, PageOrientation } from 'docx';
import { saveAs } from 'file-saver';

export const exportToDocx = async (data: any[], fileName: string, columns: { header: string; key: string }[]) => {
    const table = new Table({
        width: {
            size: 100,
            type: WidthType.PERCENTAGE,
        },
        rows: [
            // Encabezado
            new TableRow({
                children: columns.map(col => new TableCell({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: col.header,
                                    bold: true,
                                    font: 'Roboto',
                                    size: 20
                                })
                            ]
                        })
                    ],
                    shading: { fill: 'F2F2F2' },
                    verticalAlign: AlignmentType.CENTER,
                    margins: {
                        top: 120,
                        bottom: 120,
                        left: 100,
                        right: 100
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
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.LEFT,
                                children: [
                                    new TextRun({
                                        text: text,
                                        font: 'Roboto',
                                        size: 18
                                    })
                                ]
                            })
                        ],
                        verticalAlign: AlignmentType.CENTER,
                        margins: {
                            top: 120,
                            bottom: 120,
                            left: 100,
                            right: 100
                        }
                    });
                }),
            })),
        ],
    });

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: 'Arial', // Fallback global del documento
                    },
                },
            },
        },
        sections: [{
            properties: {
                page: {
                    size: {
                        width: 12240, // 8.5 inches (Legal width)
                        height: 20160, // 14 inches (Legal height/Oficio)
                        orientation: PageOrientation.PORTRAIT,
                    },
                },
            },
            children: [
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

    const buffer = await Packer.toBlob(doc);
    saveAs(buffer, `${fileName}.docx`);
};
