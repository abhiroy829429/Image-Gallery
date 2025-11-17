const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'));
    }
  },
});

/**
 * Store images in memory for the assignment.
 * Each image holds: id, filename, mimetype, size, uploadedAt, data (base64 string)
 */
const dir_name = path.resolve();
const images = [];

app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

app.get('/images', (_, res) => {
  res.json(images);
});

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please attach a JPEG or PNG image ≤ 3 MB.' });
  }

  const { originalname, mimetype, size, buffer } = req.file;

  const imageRecord = {
    id: crypto.randomUUID(),
    filename: originalname,
    mimetype,
    size,
    uploadedAt: new Date().toISOString(),
    data: buffer.toString('base64'),
  };

  images.unshift(imageRecord);

  res.status(201).json(imageRecord);
});

app.delete('/images/:id', (req, res) => {
  const { id } = req.params;
  const index = images.findIndex((img) => img.id === id);

  if (index === -1) {
    return res.status(404).json({ message: 'Image not found' });
  }

  const [deleted] = images.splice(index, 1);
  res.json({ id: deleted.id });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File exceeds 3 MB limit.' });
    }
    return res.status(400).json({ message: err.message });
  }

  if (err) {
    return res.status(400).json({ message: err.message || 'Something went wrong.' });
  }

  next();
});

if(process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(dir_name, "../frontend/dist")));
  
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(dir_name, "../frontend/dist/index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Mini Image Gallery backend running on port ${PORT}`);
});
