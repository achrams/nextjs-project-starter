require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// PostgreSQL pool setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test DB connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Connected to PostgreSQL database');
  release();
});

// Import routes
const productRouter = require('./routes/product');
const invoiceRouter = require('./routes/invoice');
const restockRouter = require('./routes/restock');

app.use('/api/products', productRouter);
app.use('/api/invoices', invoiceRouter);
app.use('/api/restocks', restockRouter);

// Basic route
app.get('/', (req, res) => {
  res.send('Invoice Management Backend is running');
});

// Export pool for other modules
module.exports = { app, pool };

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
