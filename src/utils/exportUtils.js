/**
 * Convierte un array de objetos a CSV y activa la descarga del archivo
 * @param {Array} data - Array de objetos a exportar
 * @param {String} filename - Nombre del archivo a descargar (sin extensión)
 */
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

export const exportToCSV = async (data, filename) => {
    if (!data || !data.length) {
        return;
    }

    // Obtener encabezados del primer objeto
    const headers = Object.keys(data[0]);
    const csvContent = '\uFEFF' + [
        headers.join(','),
        ...data.map(row => headers.map(fieldName => {
            const val = row[fieldName];
            // Manejar strings con comas o comillas
            if (typeof val === 'string') {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        }).join(','))
    ].join('\n');

    try {
        // Intentar guardado nativo de Tauri
        const path = await save({
            defaultPath: `${filename}_${new Date().toISOString().split('T')[0]}.csv`,
            filters: [{
                name: 'CSV',
                extensions: ['csv']
            }]
        });

        if (path) {
            await writeTextFile(path, csvContent);
        }
    } catch (error) {
        console.warn("Tauri export failed or not available, falling back to browser download:", error);
        // Fallback a descarga del navegador
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
