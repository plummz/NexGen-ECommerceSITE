const express = require('express');
const db      = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/wishlist
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT w.id, w.added_at,
             p.id AS product_id, p.name, p.slug, p.price, p.original_price,
             p.image, p.badge, p.rating, p.sold_count, p.stock,
             c.slug AS category
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE w.user_id = $1 AND p.is_active = true
      ORDER BY w.added_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/wishlist
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ error: 'product_id required.' });

    const prod = await db.query('SELECT id FROM products WHERE id=$1 AND is_active=true', [product_id]);
    if (!prod.rows.length) return res.status(404).json({ error: 'Product not found.' });

    const { rows } = await db.query(`
      INSERT INTO wishlist (user_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      RETURNING *
    `, [req.user.id, product_id]);
    res.status(201).json({ wishlisted: true, item: rows[0] || null });
  } catch (err) { next(err); }
});

// DELETE /api/wishlist/:productId
router.delete('/:productId', requireAuth, async (req, res, next) => {
  try {
    await db.query('DELETE FROM wishlist WHERE user_id=$1 AND product_id=$2', [req.user.id, req.params.productId]);
    res.json({ wishlisted: false });
  } catch (err) { next(err); }
});

// GET /api/wishlist/ids — returns just product IDs for quick lookup
router.get('/ids', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT product_id FROM wishlist WHERE user_id=$1', [req.user.id]);
    res.json(rows.map(r => r.product_id));
  } catch (err) { next(err); }
});

module.exports = router;
