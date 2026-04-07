const express = require('express');
const db      = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/cart
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT ci.id, ci.product_id, ci.variation_id, ci.variation, ci.quantity,
             p.name, p.image, p.stock,
             p.price + COALESCE(pv.price_modifier, 0) AS price,
             c.slug AS category
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_variations pv ON ci.variation_id = pv.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ci.user_id = $1 AND p.is_active = true
      ORDER BY ci.added_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/cart
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { product_id, variation_id, variation, quantity=1 } = req.body;
    if (!product_id) return res.status(400).json({ error: 'product_id required.' });

    // Verify product exists
    const prod = await db.query('SELECT id, stock FROM products WHERE id=$1 AND is_active=true', [product_id]);
    if (!prod.rows.length) return res.status(404).json({ error: 'Product not found.' });

    const varKey = variation || 'default';
    const { rows } = await db.query(`
      INSERT INTO cart_items (user_id, product_id, variation_id, variation, quantity)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, product_id, variation)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
      RETURNING *
    `, [req.user.id, product_id, variation_id||null, varKey, parseInt(quantity)]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/cart/:id
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return res.status(400).json({ error: 'Quantity must be at least 1.' });
    const { rows } = await db.query(
      'UPDATE cart_items SET quantity=$1 WHERE id=$2 AND user_id=$3 RETURNING *',
      [parseInt(quantity), req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Cart item not found.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/cart/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { rowCount } = await db.query(
      'DELETE FROM cart_items WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Cart item not found.' });
    res.json({ message: 'Removed from cart.' });
  } catch (err) { next(err); }
});

// DELETE /api/cart
router.delete('/', requireAuth, async (req, res, next) => {
  try {
    await db.query('DELETE FROM cart_items WHERE user_id=$1', [req.user.id]);
    res.json({ message: 'Cart cleared.' });
  } catch (err) { next(err); }
});

module.exports = router;
