/**
 * Converts an array of objects to CSV and triggers a file download
 * @param {Array} data - Array of objects to export
 * @param {String} filename - Name of the file to download (without extension)
 */
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

export const exportToCSV = async (data, filename) => {
    if (!data || !data.length) {
        return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    const csvContent = '\uFEFF' + [
        headers.join(','),
        ...data.map(row => headers.map(fieldName => {
            const val = row[fieldName];
            // Handle strings with commas or quotes
            if (typeof val === 'string') {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        }).join(','))
    ].join('\n');

    try {
        // Try Tauri Native Save
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
        // Fallback to Browser Download
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
