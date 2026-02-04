import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, TextRun } from 'docx';
import { saveAs } from 'file-saver';

export const exportToDocx = async (data: any[], fileName: string, columns: { header: string; key: string }[]) => {
    const table = new Table({
        width: {
            size: 100,
            type: WidthType.PERCENTAGE,
        },
        rows: [
            new TableRow({
                children: columns.map(col => new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: col.header, bold: true })], alignment: AlignmentType.CENTER })],
                    shading: { fill: 'E0E0E0' }
                })),
                tableHeader: true,
            }),
            ...data.map(item => new TableRow({
                children: columns.map(col => new TableCell({
                    children: [new Paragraph({ text: String(item[col.key] || '') })],
                })),
            })),
        ],
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    children: [new TextRun({ text: fileName, bold: true, size: 32 })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),
                table,
            ],
        }],
    });

    const buffer = await Packer.toBlob(doc);
    saveAs(buffer, `${fileName}.docx`);
};
