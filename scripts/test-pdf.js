const React = require('react');
const { Document, Page, Text, renderToBuffer, StyleSheet } = require('@react-pdf/renderer');
const fs = require('fs');

const styles = StyleSheet.create({
    page: { padding: 40 },
    text: { fontSize: 12 }
});

async function test() {
    console.log('Starting PDF generation test...');
    try {
        const buffer = await renderToBuffer(
            React.createElement(Document, {},
                React.createElement(Page, { size: 'A4', style: styles.page },
                    React.createElement(Text, { style: styles.text }, 'Hola Mundo PDF')
                )
            )
        );
        fs.writeFileSync('test.pdf', buffer);
        console.log('PDF generated successfully: test.pdf');
    } catch (error) {
        console.error('Error in PDF generation:', error);
    }
}

test();
