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

        // Configure database for better concurrency
        await database.execute('PRAGMA journal_mode=WAL;');
        await database.execute('PRAGMA busy_timeout=5000;');
        await database.execute('PRAGMA foreign_keys=ON;');

        for (const query of CREATE_TABLES) {
            await database.execute(query);
        }

        // Migration: Add points column if it doesn't exist (ignore error if it does)
        try {
            await database.execute('ALTER TABLE customers ADD COLUMN points INTEGER DEFAULT 0');
        } catch (e) {
            // Column likely already exists
        }

        // Migration: Add shift_id column to sales
        try {
            await database.execute('ALTER TABLE sales ADD COLUMN shift_id INTEGER REFERENCES cash_shifts(id)');
        } catch (e) {
            // Column likely already exists
        }

        // Seed default admin user if no users exist
        try {
            const users = await UserRepository.getAll();
            if (users.length === 0) {
                console.log('Seeding default admin user...');
                await UserRepository.create({
                    username: 'admin',
                    password: 'admin123', // Default password
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
