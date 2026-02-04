import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';

export const exportComponentToImage = async (elementId: string, fileName: string) => {
    const node = document.getElementById(elementId);
    if (!node) {
        console.error(`Element with id ${elementId} not found`);
        return;
    }

    try {
        // Pequeño retraso para asegurar que las animaciones de Recharts terminen
        await new Promise(resolve => setTimeout(resolve, 500));

        const dataUrl = await toPng(node, {
            backgroundColor: '#ffffff',
            cacheBust: true,
            pixelRatio: 2, // Mejor calidad
            style: {
                padding: '20px'
            }
        });
        saveAs(dataUrl, `${fileName}.png`);
    } catch (error) {
        console.error('Error exporting image:', error);
    }
};
