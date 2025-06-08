const fs = require('fs');
const path = require('path');
const { pool } = require('./index');

async function initDB() {
  try {
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await pool.query(schema);
    console.log('Database schema created successfully');
  } catch (error) {
    console.error('Error creating database schema:', error);
  } finally {
    pool.end();
  }
}

initDB();
