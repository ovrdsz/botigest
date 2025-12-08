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

        // Migración: Agregar columna closed_by_user_id a cash_shifts
        try {
            await database.execute('ALTER TABLE cash_shifts ADD COLUMN closed_by_user_id INTEGER REFERENCES users(id)');
        } catch (e) {
            // La columna probablemente ya existe
        }

        // Crear tabla de tickets si no existe (esto normalmente se maneja en CREATE_TABLES, pero por si acaso la DB ya existe)
        await database.execute(`
            CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                title TEXT,
                description TEXT,
                payload TEXT,
                attachment_path TEXT,
                created_by INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                resolved_by INTEGER,
                resolved_at DATETIME,
                FOREIGN KEY (created_by) REFERENCES users (id),
                FOREIGN KEY (resolved_by) REFERENCES users (id)
            )
        `);

        // Trigger: Prevenir stock negativo
        try {
            await database.execute(`
                CREATE TRIGGER IF NOT EXISTS prevent_negative_stock
                BEFORE UPDATE ON products
                FOR EACH ROW
                WHEN NEW.stock < 0
                BEGIN
                    SELECT RAISE(ABORT, 'El stock no puede ser negativo');
                END;
            `);
        } catch (e) {
            console.error('Error creating trigger:', e);
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
