const express = require('express');
const router = express.Router();
const { pool } = require('../index');

// Get all restock records
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "Restock" ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new restock record and increase product quantity
router.post('/', async (req, res) => {
  const { user_id, product_id, qty } = req.body;
  const tanggal = new Date();

  try {
    // Insert restock record
    const restockResult = await pool.query(
      `INSERT INTO "Restock" (user_id, product_id, qty, tanggal)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id, product_id, qty, tanggal]
    );

    // Increase product quantity
    await pool.query(
      'UPDATE "Product" SET qty = qty + $1 WHERE id = $2',
      [qty, product_id]
    );

    res.status(201).json(restockResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete restock record
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query('DELETE FROM "Restock" WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Restock record not found' });
    }
    res.json({ message: 'Restock record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
