const React = require('react');
const { Document, Page, Text, pdf, StyleSheet } = require('@react-pdf/renderer');

const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica' },
    text: { fontSize: 14, textAlign: 'center' }
});

async function renderDenunciaPdfIsolated(titulo) {
    try {
        console.log("[IsolatedPDF] Starting render for:", titulo);
        const doc = React.createElement(Document, { title: titulo },
            React.createElement(Page, { size: "A4", style: styles.page },
                React.createElement(Text, { style: styles.text }, titulo)
            )
        );

        const stream = pdf(doc);
        const blob = await stream.toBlob();
        const arrayBuffer = await blob.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error("[IsolatedPDF] Rendering error:", error);
        throw error;
    }
}

module.exports = { renderDenunciaPdfIsolated };
