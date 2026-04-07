const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db       = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/register
router.post('/register', [
  body('name').trim().isLength({ min:2, max:100 }).withMessage('Name must be 2–100 characters.'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address.'),
  body('password').isLength({ min:6 }).withMessage('Password must be at least 6 characters.'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email already registered.' });

    const hash   = await bcrypt.hash(password, 12);
    const avatar = name.trim()[0].toUpperCase();
    const { rows } = await db.query(`
      INSERT INTO users (name, email, password_hash, avatar)
      VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, avatar, created_at
    `, [name.trim(), email, hash, avatar]);

    const user  = rows[0];
    const token = signToken(user.id);
    res.status(201).json({ token, user });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid credentials.' });

    const { email, password } = req.body;
    const { rows } = await db.query(
      'SELECT id, name, email, role, avatar, password_hash, is_active FROM users WHERE email = $1',
      [email]
    );
    const user = rows[0];
    if (!user || !user.is_active) return res.status(401).json({ error: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

    delete user.password_hash;
    const token = signToken(user.id);
    res.json({ token, user });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT id, name, email, role, phone, avatar, created_at FROM users WHERE id = $1
    `, [req.user.id]);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, [
  body('name').optional().trim().isLength({ min:2, max:100 }),
  body('phone').optional().trim().isLength({ max:30 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, phone } = req.body;
    const { rows } = await db.query(`
      UPDATE users SET
        name  = COALESCE($1, name),
        phone = COALESCE($2, phone),
        avatar= COALESCE(SUBSTRING($1,1,1), avatar)
      WHERE id = $3
      RETURNING id, name, email, role, phone, avatar
    `, [name || null, phone || null, req.user.id]);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/auth/password
router.put('/password', requireAuth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min:6 }).withMessage('New password must be at least 6 characters.'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { currentPassword, newPassword } = req.body;
    const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) return res.status(400).json({ error: 'Current password is incorrect.' });

    const hash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ message: 'Password updated successfully.' });
  } catch (err) { next(err); }
});

// GET /api/auth/addresses
router.get('/addresses', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, id DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/auth/addresses
router.post('/addresses', requireAuth, [
  body('full_name').trim().notEmpty(),
  body('phone').trim().notEmpty(),
  body('line1').trim().notEmpty(),
  body('city').trim().notEmpty(),
  body('province').trim().notEmpty(),
  body('zip').trim().notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { label='Home', full_name, phone, line1, line2='', city, province, zip, is_default=false } = req.body;

    if (is_default) {
      await db.query('UPDATE addresses SET is_default=false WHERE user_id=$1', [req.user.id]);
    }
    const { rows: existing } = await db.query('SELECT COUNT(*) FROM addresses WHERE user_id=$1', [req.user.id]);
    const makeDefault = parseInt(existing[0].count) === 0 ? true : is_default;

    const { rows } = await db.query(`
      INSERT INTO addresses (user_id, label, full_name, phone, line1, line2, city, province, zip, is_default)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [req.user.id, label, full_name, phone, line1, line2, city, province, zip, makeDefault]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/auth/addresses/:id
router.put('/addresses/:id', requireAuth, async (req, res, next) => {
  try {
    const { label, full_name, phone, line1, line2, city, province, zip, is_default } = req.body;
    if (is_default) {
      await db.query('UPDATE addresses SET is_default=false WHERE user_id=$1', [req.user.id]);
    }
    const { rows } = await db.query(`
      UPDATE addresses SET
        label=$1, full_name=$2, phone=$3, line1=$4, line2=$5,
        city=$6, province=$7, zip=$8, is_default=COALESCE($9,is_default)
      WHERE id=$10 AND user_id=$11 RETURNING *
    `, [label, full_name, phone, line1, line2||'', city, province, zip, is_default, req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Address not found.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/auth/addresses/:id
router.delete('/addresses/:id', requireAuth, async (req, res, next) => {
  try {
    const { rowCount } = await db.query(
      'DELETE FROM addresses WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Address not found.' });
    res.json({ message: 'Address deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
