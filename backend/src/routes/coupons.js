const express = require('express');
const db      = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/coupons/validate
router.post('/validate', requireAuth, async (req, res, next) => {
  try {
    const { code, subtotal=0, category } = req.body;
    if (!code) return res.status(400).json({ error: 'Coupon code required.' });

    const { rows } = await db.query(`
      SELECT * FROM coupons
      WHERE UPPER(code) = UPPER($1)
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (max_uses IS NULL OR uses < max_uses)
    `, [code]);

    if (!rows.length) return res.status(400).json({ valid:false, error: 'Invalid or expired coupon.' });

    const coupon = rows[0];
    const sub = parseFloat(subtotal);

    if (sub < parseFloat(coupon.min_order)) {
      return res.status(400).json({
        valid: false,
        error: `Minimum order of ₱${Number(coupon.min_order).toLocaleString()} required.`,
      });
    }
    if (coupon.category && category && coupon.category !== category) {
      return res.status(400).json({ valid: false, error: `This coupon only applies to ${coupon.category} items.` });
    }

    let discount = 0;
    let freeship = false;
    if      (coupon.type === 'percent')  discount = Math.round(sub * coupon.discount / 100);
    else if (coupon.type === 'fixed')    discount = parseFloat(coupon.discount);
    else if (coupon.type === 'freeship') freeship = true;

    res.json({
      valid: true,
      code:  coupon.code,
      type:  coupon.type,
      discount,
      freeship,
      description: coupon.type === 'percent'
        ? `${coupon.discount}% off your order`
        : coupon.type === 'fixed'
          ? `₱${coupon.discount} off your order`
          : 'Free shipping on this order',
    });
  } catch (err) { next(err); }
});

// GET /api/coupons — public list of active coupons
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT code, type, discount, min_order, category, expires_at
      FROM coupons
      WHERE is_active=true AND (expires_at IS NULL OR expires_at > NOW())
        AND (max_uses IS NULL OR uses < max_uses)
      ORDER BY discount DESC
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
