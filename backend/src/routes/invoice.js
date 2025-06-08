const express = require('express');
const router = express.Router();
const { pool } = require('../index');
const { v4: uuidv4 } = require('uuid');

// Helper function to decrease product quantities
async function decreaseProductQuantities(productIds, quantities) {
  for (let i = 0; i < productIds.length; i++) {
    const productId = productIds[i];
    const qtyToDecrease = quantities[i];
    await pool.query(
      'UPDATE "Product" SET qty = qty - $1 WHERE id = $2 AND qty >= $1',
      [qtyToDecrease, productId]
    );
  }
}

// Helper function to create penjualan record
async function createPenjualan(userId, invoiceId) {
  const nomorPenjualan = 'PJ-' + uuidv4();
  const tanggal = new Date();
  await pool.query(
    `INSERT INTO "Penjualan" (user_id, nomor_penjualan, invoice_id, tanggal)
     VALUES ($1, $2, $3, $4)`,
    [userId, nomorPenjualan, invoiceId, tanggal]
  );
}

// Get all invoices
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "Invoice" ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get invoice by id
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query('SELECT * FROM "Invoice" WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new invoice (status defaults to 'pending')
router.post('/', async (req, res) => {
  const { user_id, invoice_number, product_ids, qty, prices, total } = req.body;
  const status = 'pending';
  const tanggal = new Date();
  try {
    const result = await pool.query(
      `INSERT INTO "Invoice" (user_id, invoice_number, product_ids, qty, prices, total, status, tanggal)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [user_id, invoice_number, product_ids, qty, prices, total, status, tanggal]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update invoice status and other fields
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, user_id, invoice_number, product_ids, qty, prices, total } = req.body;

  try {
    // Get current invoice
    const currentInvoiceResult = await pool.query('SELECT * FROM "Invoice" WHERE id = $1', [id]);
    if (currentInvoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    const currentInvoice = currentInvoiceResult.rows[0];

    // Update invoice
    const updateResult = await pool.query(
      `UPDATE "Invoice" SET user_id=$1, invoice_number=$2, product_ids=$3, qty=$4, prices=$5, total=$6, status=$7
       WHERE id=$8 RETURNING *`,
      [user_id, invoice_number, product_ids, qty, prices, total, status, id]
    );
    const updatedInvoice = updateResult.rows[0];

    // If status changed to 'done' and was not 'done' before, create penjualan and decrease product qty
    if (status === 'done' && currentInvoice.status !== 'done') {
      await decreaseProductQuantities(product_ids, qty);
      await createPenjualan(user_id, id);
    }

    res.json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query('DELETE FROM "Invoice" WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
