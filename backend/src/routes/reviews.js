const express = require('express');
const { body, validationResult } = require('express-validator');
const db      = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/reviews
router.post('/', requireAuth, [
  body('product_id').isInt({ min:1 }),
  body('rating').isInt({ min:1, max:5 }),
  body('body').optional().trim().isLength({ max:2000 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { product_id, order_id, rating, body: reviewBody='' } = req.body;

    // Only allow review if user purchased the product
    if (order_id) {
      const bought = await db.query(`
        SELECT 1 FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.id=$1 AND o.user_id=$2 AND oi.product_id=$3 AND o.status='delivered'
      `, [order_id, req.user.id, product_id]);
      if (!bought.rows.length) {
        return res.status(403).json({ error: 'You can only review products you have purchased and received.' });
      }
    }

    const { rows } = await db.query(`
      INSERT INTO reviews (user_id, product_id, order_id, rating, body)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, product_id, order_id)
      DO UPDATE SET rating=$4, body=$5, updated_at=NOW()
      RETURNING *
    `, [req.user.id, product_id, order_id||null, rating, reviewBody]);

    // Recalculate product average rating
    await db.query(`
      UPDATE products SET rating = (
        SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE product_id=$1
      ) WHERE id=$1
    `, [product_id]);

    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/reviews/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM reviews WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Review not found.' });
    const productId = rows[0].product_id;
    await db.query('DELETE FROM reviews WHERE id=$1', [req.params.id]);
    await db.query(`
      UPDATE products SET rating = COALESCE((
        SELECT ROUND(AVG(rating)::numeric,1) FROM reviews WHERE product_id=$1
      ), 0) WHERE id=$1
    `, [productId]);
    res.json({ message: 'Review deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
