const React = require('react');
const { Document, Page, Text, pdf, StyleSheet } = require('@react-pdf/renderer');
const fs = require('fs');

const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica' },
    mainTitle: { fontSize: 14, textAlign: 'center', marginBottom: 5 },
    subTitle: { fontSize: 12, textAlign: 'center', marginBottom: 20 },
    actaTitle: { fontSize: 14, textAlign: 'center', marginTop: 20 }
});

async function simulateRender(numeroOrden, denunciante, datosDenuncia) {
    const año = String(datosDenuncia?.fecha_denuncia || '2026').split('-')[0];
    const titulo = `ACTA DE DENUNCIA Nº ${numeroOrden || '#'}/${año}`;

    try {
        console.log("Simulating PDF generation for:", titulo);

        const doc = React.createElement(Document, { title: titulo },
            React.createElement(Page, { size: "A4", style: styles.page },
                React.createElement(Text, { style: styles.mainTitle },
                    "DIRECCIÓN CONTRA HECHOS PUNIBLES ECONÓMICOS Y FINANCIEROS"
                ),
                React.createElement(Text, { style: styles.subTitle },
                    "SALA DE DENUNCIAS"
                ),
                React.createElement(Text, { style: styles.actaTitle },
                    titulo
                )
            )
        );

        const pdfStream = pdf(doc);
        const blob = await pdfStream.toBlob();
        const arrayBuffer = await blob.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error("Simulation error:", error);
        throw error;
    }
}

async function runTest() {
    const mockDenunciante = { 'Nombres y Apellidos': 'Test User' };
    const mockDatos = { fecha_denuncia: '2026-02-03' };

    try {
        const buffer = await simulateRender(123, mockDenunciante, mockDatos);
        fs.writeFileSync('integration-test.pdf', buffer);
        console.log('Integration test PDF generated successfully: integration-test.pdf');
    } catch (e) {
        console.error('Test failed:', e);
    }
}

runTest();
