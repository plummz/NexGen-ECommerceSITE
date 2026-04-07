const express = require('express');
const db      = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const [users, products, orders, revenue, recentOrders, topProducts] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users WHERE role=\'customer\''),
      db.query('SELECT COUNT(*) FROM products WHERE is_active=true'),
      db.query('SELECT COUNT(*), status FROM orders GROUP BY status'),
      db.query('SELECT COALESCE(SUM(total),0) AS total FROM orders WHERE payment_status=\'paid\''),
      db.query(`
        SELECT o.id, o.status, o.total, o.created_at, u.name AS customer_name
        FROM orders o JOIN users u ON o.user_id=u.id
        ORDER BY o.created_at DESC LIMIT 5
      `),
      db.query(`
        SELECT p.id, p.name, p.image, p.sold_count, p.price, c.slug AS category
        FROM products p LEFT JOIN categories c ON p.category_id=c.id
        ORDER BY p.sold_count DESC LIMIT 5
      `),
    ]);

    const orderStats = {};
    orders.rows.forEach(r => { orderStats[r.status] = parseInt(r.count); });

    res.json({
      stats: {
        customers:  parseInt(users.rows[0].count),
        products:   parseInt(products.rows[0].count),
        orders:     Object.values(orderStats).reduce((a,b)=>a+b,0),
        revenue:    parseFloat(revenue.rows[0].total),
        orderStats,
      },
      recentOrders:  recentOrders.rows,
      topProducts:   topProducts.rows,
    });
  } catch (err) { next(err); }
});

// ── PRODUCTS ──
router.get('/products', async (req, res, next) => {
  try {
    const { page=1, limit=20, q='', cat='' } = req.query;
    const offset = (parseInt(page)-1)*parseInt(limit);
    const params = [];
    const where  = ['1=1'];
    if (q)   { params.push(`%${q}%`); where.push(`p.name ILIKE $${params.length}`); }
    if (cat) { params.push(cat);       where.push(`c.slug = $${params.length}`); }

    const { rows } = await db.query(`
      SELECT p.*, c.slug AS category, c.name AS category_name
      FROM products p LEFT JOIN categories c ON p.category_id=c.id
      WHERE ${where.join(' AND ')}
      ORDER BY p.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `, params);
    const cnt = await db.query(`SELECT COUNT(*) FROM products p LEFT JOIN categories c ON p.category_id=c.id WHERE ${where.join(' AND ')}`, params);
    res.json({ products: rows, total: parseInt(cnt.rows[0].count) });
  } catch (err) { next(err); }
});

router.post('/products', async (req, res, next) => {
  try {
    const { name, slug, category_id, price, original_price, description, image, badge, stock=100 } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'name and price required.' });
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
    const { rows } = await db.query(`
      INSERT INTO products (name, slug, category_id, price, original_price, description, image, badge, stock)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [name, finalSlug, category_id||null, price, original_price||null, description||'', image||null, badge||null, stock]);

    // Add variations if provided
    if (req.body.variations?.length) {
      for (let i=0; i<req.body.variations.length; i++) {
        await db.query(`INSERT INTO product_variations (product_id,name,sort_order) VALUES ($1,$2,$3)`,
          [rows[0].id, req.body.variations[i], i]);
      }
    }
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/products/:id', async (req, res, next) => {
  try {
    const { name, category_id, price, original_price, description, image, badge, stock, is_active } = req.body;
    const { rows } = await db.query(`
      UPDATE products SET
        name           = COALESCE($1, name),
        category_id    = COALESCE($2, category_id),
        price          = COALESCE($3, price),
        original_price = COALESCE($4, original_price),
        description    = COALESCE($5, description),
        image          = COALESCE($6, image),
        badge          = COALESCE($7, badge),
        stock          = COALESCE($8, stock),
        is_active      = COALESCE($9, is_active)
      WHERE id = $10 RETURNING *
    `, [name, category_id, price, original_price, description, image, badge, stock, is_active, req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Product not found.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/products/:id', async (req, res, next) => {
  try {
    await db.query('UPDATE products SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ message: 'Product deactivated.' });
  } catch (err) { next(err); }
});

// ── ORDERS ──
router.get('/orders', async (req, res, next) => {
  try {
    const { page=1, limit=20, status='' } = req.query;
    const offset = (parseInt(page)-1)*parseInt(limit);
    const params = [];
    let where = '1=1';
    if (status) { params.push(status); where += ` AND o.status=$${params.length}`; }

    const { rows } = await db.query(`
      SELECT o.*, u.name AS customer_name, u.email AS customer_email
      FROM orders o JOIN users u ON o.user_id=u.id
      WHERE ${where}
      ORDER BY o.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `, params);
    const cnt = await db.query(`SELECT COUNT(*) FROM orders o WHERE ${where}`, params);
    res.json({ orders: rows, total: parseInt(cnt.rows[0].count) });
  } catch (err) { next(err); }
});

router.get('/orders/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT o.*, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
      FROM orders o JOIN users u ON o.user_id=u.id
      WHERE o.id=$1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Order not found.' });
    const [items, history] = await Promise.all([
      db.query('SELECT * FROM order_items WHERE order_id=$1', [req.params.id]),
      db.query('SELECT osh.*, u.name AS updated_by_name FROM order_status_history osh LEFT JOIN users u ON osh.created_by=u.id WHERE osh.order_id=$1 ORDER BY osh.created_at', [req.params.id]),
    ]);
    res.json({ ...rows[0], items: items.rows, history: history.rows });
  } catch (err) { next(err); }
});

router.put('/orders/:id/status', async (req, res, next) => {
  try {
    const { status, note='' } = req.body;
    const valid = ['pending','confirmed','packed','shipped','delivered','cancelled','refunded'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

    await db.query('UPDATE orders SET status=$1 WHERE id=$2', [status, req.params.id]);
    if (status === 'delivered') {
      await db.query("UPDATE orders SET payment_status='paid' WHERE id=$1 AND payment_method='cod'", [req.params.id]);
    }
    await db.query(
      'INSERT INTO order_status_history (order_id,status,note,created_by) VALUES ($1,$2,$3,$4)',
      [req.params.id, status, note, req.user.id]
    );
    res.json({ message: `Order status updated to ${status}.` });
  } catch (err) { next(err); }
});

// ── USERS ──
router.get('/users', async (req, res, next) => {
  try {
    const { page=1, limit=20, q='' } = req.query;
    const offset = (parseInt(page)-1)*parseInt(limit);
    const params = q ? [`%${q}%`] : [];
    const where  = q ? `(name ILIKE $1 OR email ILIKE $1)` : '1=1';

    const { rows } = await db.query(`
      SELECT id, name, email, role, phone, is_active, created_at FROM users
      WHERE ${where} ORDER BY created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `, params);
    const cnt = await db.query(`SELECT COUNT(*) FROM users WHERE ${where}`, params);
    res.json({ users: rows, total: parseInt(cnt.rows[0].count) });
  } catch (err) { next(err); }
});

router.put('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['customer','admin'].includes(role)) return res.status(400).json({ error: 'Invalid role.' });
    await db.query('UPDATE users SET role=$1 WHERE id=$2', [role, req.params.id]);
    res.json({ message: 'Role updated.' });
  } catch (err) { next(err); }
});

router.put('/users/:id/toggle', async (req, res, next) => {
  try {
    const { rows } = await db.query('UPDATE users SET is_active=NOT is_active WHERE id=$1 RETURNING is_active', [req.params.id]);
    res.json({ is_active: rows[0].is_active });
  } catch (err) { next(err); }
});

// ── INVENTORY ──
router.get('/inventory', async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT p.id, p.name, p.stock, p.sold_count, p.is_active, c.name AS category
      FROM products p LEFT JOIN categories c ON p.category_id=c.id
      ORDER BY p.stock ASC
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

router.put('/inventory/:id', async (req, res, next) => {
  try {
    const { stock } = req.body;
    if (stock < 0) return res.status(400).json({ error: 'Stock cannot be negative.' });
    await db.query('UPDATE products SET stock=$1 WHERE id=$2', [stock, req.params.id]);
    res.json({ message: 'Stock updated.' });
  } catch (err) { next(err); }
});

module.exports = router;
