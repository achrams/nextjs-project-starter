const express = require('express');
const router = express.Router();
const { pool } = require('../index');

// Get all products
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "Product" ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get product by id
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query('SELECT * FROM "Product" WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new product
router.post('/', async (req, res) => {
  const { name, type, category, image_url, product_code, price, qty } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO "Product" (name, type, category, image_url, product_code, price, qty)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, type, category, image_url, product_code, price, qty]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, type, category, image_url, product_code, price, qty } = req.body;
  try {
    const result = await pool.query(
      `UPDATE "Product" SET name=$1, type=$2, category=$3, image_url=$4, product_code=$5, price=$6, qty=$7
       WHERE id=$8 RETURNING *`,
      [name, type, category, image_url, product_code, price, qty, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query('DELETE FROM "Product" WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
