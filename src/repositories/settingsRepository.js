import { selectQuery, executeQuery } from '../services/db';

export const SettingsRepository = {
    get: async (key) => {
        const result = await selectQuery('SELECT value FROM settings WHERE key = ?', [key]);
        return result[0]?.value || null;
    },

    getAll: async () => {
        const result = await selectQuery('SELECT key, value FROM settings');
        const settings = {};
        result.forEach(row => {
            settings[row.key] = row.value;
        });
        return settings;
    },

    set: async (key, value) => {
        const query = `
      INSERT INTO settings (key, value) 
      VALUES (?, ?) 
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `;
        return await executeQuery(query, [key, value]);
    },

    setMany: async (settingsObject) => {
        const queries = Object.entries(settingsObject).map(([key, value]) => {
            return executeQuery(`
        INSERT INTO settings (key, value) 
        VALUES (?, ?) 
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `, [key, value]);
        });
        return await Promise.all(queries);
    }
};
