const express = require('express');
const db      = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders — create order from cart
router.post('/', requireAuth, async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { address_id, payment_method='cod', coupon_code, notes='' } = req.body;

    await client.query('BEGIN');

    // Get cart
    const cartRes = await client.query(`
      SELECT ci.id, ci.product_id, ci.variation_id, ci.variation, ci.quantity,
             p.name, p.image, p.stock,
             p.price + COALESCE(pv.price_modifier, 0) AS price
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_variations pv ON ci.variation_id = pv.id
      WHERE ci.user_id = $1 AND p.is_active = true
    `, [req.user.id]);

    if (!cartRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    // Get address
    const addrRes = await client.query('SELECT * FROM addresses WHERE id=$1 AND user_id=$2', [address_id, req.user.id]);
    if (!addrRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Address not found.' });
    }
    const addr = addrRes.rows[0];

    // Calculate totals
    let subtotal = cartRes.rows.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
    let shipping = subtotal >= 500 ? 0 : 99;
    let discount = 0;

    // Validate coupon
    if (coupon_code) {
      const cpRes = await client.query(`
        SELECT * FROM coupons
        WHERE UPPER(code)=UPPER($1) AND is_active=true
          AND (expires_at IS NULL OR expires_at > NOW())
          AND (max_uses IS NULL OR uses < max_uses)
      `, [coupon_code]);
      const coupon = cpRes.rows[0];
      if (coupon) {
        if (subtotal >= parseFloat(coupon.min_order)) {
          if      (coupon.type === 'percent')  discount = Math.round(subtotal * coupon.discount / 100);
          else if (coupon.type === 'fixed')    discount = parseFloat(coupon.discount);
          else if (coupon.type === 'freeship') shipping = 0;
          await client.query('UPDATE coupons SET uses=uses+1 WHERE id=$1', [coupon.id]);
        }
      }
    }

    const total = Math.max(0, subtotal + shipping - discount);

    // Create order
    const orderRes = await client.query(`
      INSERT INTO orders (
        user_id, address_id,
        shipping_name, shipping_phone, shipping_line1, shipping_city, shipping_province, shipping_zip,
        subtotal, shipping_fee, discount, total,
        payment_method, coupon_code, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *
    `, [
      req.user.id, address_id,
      addr.full_name, addr.phone, addr.line1, addr.city, addr.province, addr.zip,
      subtotal, shipping, discount, total,
      payment_method, coupon_code || null, notes,
    ]);
    const order = orderRes.rows[0];

    // Insert order items
    for (const item of cartRes.rows) {
      await client.query(`
        INSERT INTO order_items (order_id, product_id, name, image, variation, quantity, price, subtotal)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `, [order.id, item.product_id, item.name, item.image, item.variation, item.quantity,
          item.price, parseFloat(item.price) * item.quantity]);

      // Decrement stock
      await client.query(
        'UPDATE products SET stock = GREATEST(stock - $1, 0), sold_count = sold_count + $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    // Order status history
    await client.query(
      'INSERT INTO order_status_history (order_id, status, note) VALUES ($1, $2, $3)',
      [order.id, 'pending', 'Order placed.']
    );

    // Clear cart
    await client.query('DELETE FROM cart_items WHERE user_id=$1', [req.user.id]);

    await client.query('COMMIT');

    // Return full order with items
    const items = await db.query('SELECT * FROM order_items WHERE order_id=$1', [order.id]);
    res.status(201).json({ ...order, items: items.rows });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// GET /api/orders — user's orders
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { page=1, limit=10, status } = req.query;
    const offset = (parseInt(page)-1) * parseInt(limit);
    const params = [req.user.id];
    let where = 'user_id = $1';
    if (status) { params.push(status); where += ` AND status = $${params.length}`; }

    const { rows } = await db.query(`
      SELECT o.*,
        (SELECT json_agg(oi) FROM order_items oi WHERE oi.order_id = o.id) AS items
      FROM orders o
      WHERE ${where}
      ORDER BY o.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `, params);
    const countRes = await db.query(`SELECT COUNT(*) FROM orders WHERE ${where}`, params);
    res.json({ orders: rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) { next(err); }
});

// GET /api/orders/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM orders WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Order not found.' });
    const order = rows[0];
    const [items, history] = await Promise.all([
      db.query('SELECT * FROM order_items WHERE order_id=$1', [order.id]),
      db.query('SELECT * FROM order_status_history WHERE order_id=$1 ORDER BY created_at ASC', [order.id]),
    ]);
    order.items   = items.rows;
    order.history = history.rows;
    res.json(order);
  } catch (err) { next(err); }
});

// POST /api/orders/:id/cancel
router.post('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM orders WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Order not found.' });
    if (!['pending','confirmed'].includes(rows[0].status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage.' });
    }
    await db.query("UPDATE orders SET status='cancelled' WHERE id=$1", [req.params.id]);
    await db.query("INSERT INTO order_status_history (order_id, status, note) VALUES ($1,'cancelled','Cancelled by customer.')", [req.params.id]);
    res.json({ message: 'Order cancelled.' });
  } catch (err) { next(err); }
});

module.exports = router;
