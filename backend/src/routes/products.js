const express = require('express');
const db      = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/products — list with search, filter, pagination
router.get('/', async (req, res, next) => {
  try {
    const {
      q        = '',
      cat      = '',
      min_price,
      max_price,
      badge,
      sort     = 'popular',
      page     = 1,
      limit    = 20,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const where  = ['p.is_active = true'];

    if (q) {
      params.push(`%${q}%`);
      where.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
    }
    if (cat) {
      params.push(cat);
      where.push(`c.slug = $${params.length}`);
    }
    if (min_price) { params.push(parseFloat(min_price)); where.push(`p.price >= $${params.length}`); }
    if (max_price) { params.push(parseFloat(max_price)); where.push(`p.price <= $${params.length}`); }
    if (badge)     { params.push(badge); where.push(`p.badge = $${params.length}`); }

    const orderMap = {
      popular:   'p.sold_count DESC',
      newest:    'p.created_at DESC',
      price_asc: 'p.price ASC',
      price_desc:'p.price DESC',
      rating:    'p.rating DESC',
    };
    const orderBy = orderMap[sort] || orderMap.popular;

    const sql = `
      SELECT p.id, p.name, p.slug, p.price, p.original_price, p.image,
             p.badge, p.rating, p.sold_count, p.stock,
             c.slug AS category, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${where.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;
    const countSql = `
      SELECT COUNT(*) FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${where.join(' AND ')}
    `;

    const [data, count] = await Promise.all([
      db.query(sql, params),
      db.query(countSql, params),
    ]);

    res.json({
      products: data.rows,
      total:    parseInt(count.rows[0].count),
      page:     parseInt(page),
      pages:    Math.ceil(parseInt(count.rows[0].count) / parseInt(limit)),
    });
  } catch (err) { next(err); }
});

// GET /api/products/categories
router.get('/categories', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM categories ORDER BY sort_order');
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/products/featured
router.get('/featured', async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT p.id, p.name, p.slug, p.price, p.original_price, p.image,
             p.badge, p.rating, p.sold_count, p.stock,
             c.slug AS category
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true AND p.badge IS NOT NULL
      ORDER BY p.sold_count DESC
      LIMIT 8
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT p.*, c.slug AS category, c.name AS category_name, c.icon AS category_icon
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1 AND p.is_active = true
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Product not found.' });

    const product = rows[0];

    const [vars, imgs] = await Promise.all([
      db.query('SELECT * FROM product_variations WHERE product_id=$1 ORDER BY sort_order', [product.id]),
      db.query('SELECT * FROM product_images WHERE product_id=$1 ORDER BY sort_order',     [product.id]),
    ]);
    product.variations = vars.rows;
    product.images     = imgs.rows;

    // Rating breakdown
    const ratingBreakdown = await db.query(`
      SELECT rating, COUNT(*) as count
      FROM reviews WHERE product_id=$1
      GROUP BY rating ORDER BY rating DESC
    `, [product.id]);
    product.rating_breakdown = ratingBreakdown.rows;

    res.json(product);
  } catch (err) { next(err); }
});

// GET /api/products/:id/reviews
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const { page=1, limit=10 } = req.query;
    const offset = (parseInt(page)-1) * parseInt(limit);
    const { rows } = await db.query(`
      SELECT r.id, r.rating, r.body, r.created_at,
             u.name AS user_name, u.avatar AS user_avatar
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.params.id, parseInt(limit), offset]);
    const countRes = await db.query('SELECT COUNT(*) FROM reviews WHERE product_id=$1', [req.params.id]);
    res.json({ reviews: rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) { next(err); }
});

// GET /api/products/:id/related
router.get('/:id/related', async (req, res, next) => {
  try {
    const product = await db.query('SELECT category_id FROM products WHERE id=$1', [req.params.id]);
    if (!product.rows.length) return res.status(404).json({ error: 'Product not found.' });
    const { rows } = await db.query(`
      SELECT p.id, p.name, p.slug, p.price, p.original_price, p.image, p.badge, p.rating, p.sold_count,
             c.slug AS category
      FROM products p LEFT JOIN categories c ON p.category_id=c.id
      WHERE p.category_id=$1 AND p.id != $2 AND p.is_active=true
      ORDER BY p.sold_count DESC LIMIT 6
    `, [product.rows[0].category_id, req.params.id]);
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
