import Database from '@tauri-apps/plugin-sql';
import { CREATE_TABLES } from './queries';
import { UserRepository } from '../repositories/userRepository';

const DB_NAME = 'botigest.db';
let db = null;

export const getDb = async () => {
    if (db) return db;
    try {
        db = await Database.load(`sqlite:${DB_NAME}`);
        return db;
    } catch (error) {
        console.error('Failed to load database:', error);
        throw error;
    }
};

export const initDB = async () => {
    try {
        const database = await getDb();

        // Configurar base de datos para mejor concurrencia
        await database.execute('PRAGMA journal_mode=WAL;');
        await database.execute('PRAGMA busy_timeout=5000;');
        await database.execute('PRAGMA foreign_keys=ON;');

        for (const query of CREATE_TABLES) {
            await database.execute(query);
        }

        // Migración: Agregar columna points si no existe
        try {
            await database.execute('ALTER TABLE customers ADD COLUMN points INTEGER DEFAULT 0');
        } catch (e) {
            // La columna probablemente ya existe
        }

        // Migración: Agregar columna shift_id a sales
        try {
            await database.execute('ALTER TABLE sales ADD COLUMN shift_id INTEGER REFERENCES cash_shifts(id)');
        } catch (e) {
            // La columna probablemente ya existe
        }

        // Crear usuario admin por defecto si no existe ninguno
        try {
            const users = await UserRepository.getAll();
            if (users.length === 0) {
                console.log('Seeding default admin user...');
                await UserRepository.create({
                    username: 'admin',
                    password: 'admin123', // Contraseña por defecto
                    role: 'admin'
                });
                console.log('Default admin user created');
            }
        } catch (error) {
            console.error('Error seeding users:', error);
        }

        console.log('Database initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        return false;
    }
};

export const executeQuery = async (query, params = []) => {
    const database = await getDb();
    return await database.execute(query, params);
};

export const selectQuery = async (query, params = []) => {
    const database = await getDb();
    return await database.select(query, params);
};
