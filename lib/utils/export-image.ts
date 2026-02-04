import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';

export const exportComponentToImage = async (elementId: string, fileName: string) => {
    const node = document.getElementById(elementId);
    if (!node) {
        console.error(`Element with id ${elementId} not found`);
        return;
    }

    try {
        const dataUrl = await toPng(node, {
            backgroundColor: '#ffffff',
            style: {
                padding: '20px'
            }
        });
        saveAs(dataUrl, `${fileName}.png`);
    } catch (error) {
        console.error('Error exporting image:', error);
    }
};
