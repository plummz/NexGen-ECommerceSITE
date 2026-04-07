const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router  = express.Router();
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});
const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg','.jpeg','.png','.webp','.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  cb(null, allowed.includes(ext));
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024 },
});

// POST /api/upload/image — admin only
router.post('/image', requireAuth, requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No valid image file provided.' });
  res.json({
    url:      `/uploads/${req.file.filename}`,
    filename: req.file.filename,
  });
});

module.exports = router;
