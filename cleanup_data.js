import { executeQuery, selectQuery } from './src/services/db.js';
import { initDB } from './src/services/db.js';

async function cleanupData() {
    await initDB();

    console.log('Starting cleanup...');

    // 1. Get IDs of products without category
    const products = await selectQuery(`SELECT id, name FROM products WHERE category_id IS NULL`);

    if (products.length === 0) {
        console.log('No uncategorized products found.');
        return;
    }

    const ids = products.map(p => p.id).join(',');
    console.log(`Found ${products.length} products to delete:`, products.map(p => p.name));

    // 2. Delete sale_items associated with these products
    console.log('Deleting associated sale items...');
    await executeQuery(`DELETE FROM sale_items WHERE product_id IN (${ids})`);

    // 3. Delete the products
    console.log('Deleting products...');
    await executeQuery(`DELETE FROM products WHERE id IN (${ids})`);

    console.log('Cleanup complete.');
}

cleanupData();
