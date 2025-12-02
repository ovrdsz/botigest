import { selectQuery } from './src/services/db.js';
import { initDB } from './src/services/db.js';

async function checkProducts() {
    await initDB();
    const products = await selectQuery(`
        SELECT p.id, p.name, p.code, COUNT(si.id) as sale_count 
        FROM products p 
        LEFT JOIN sale_items si ON p.id = si.product_id 
        WHERE p.category_id IS NULL 
        GROUP BY p.id
    `);
    console.log('Products without category:', JSON.stringify(products, null, 2));
}

checkProducts();
