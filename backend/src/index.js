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
const images = [];

// CORS configuration - allow all origins for production
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

app.get('/images', (_, res) => {
  res.json(images);
});

app.post('/upload', upload.single('image'), (req, res) => {
  console.log('POST /upload - Request received');
  console.log('File:', req.file ? 'Present' : 'Missing');
  
  if (!req.file) {
    console.log('No file in request');
    return res.status(400).json({ message: 'Please attach a JPEG or PNG image ≤ 3 MB.' });
  }

  const { originalname, mimetype, size, buffer } = req.file;
  console.log(`Processing file: ${originalname}, type: ${mimetype}, size: ${size} bytes`);

  const imageRecord = {
    id: crypto.randomUUID(),
    filename: originalname,
    mimetype,
    size,
    uploadedAt: new Date().toISOString(),
    data: buffer.toString('base64'),
  };

  images.unshift(imageRecord);
  console.log(`Image uploaded successfully. Total images: ${images.length}`);

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

// Serve static files and handle SPA routing in production
// IMPORTANT: This must come AFTER all API routes
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  
  // Serve static assets (JS, CSS, images, etc.)
  app.use(express.static(distPath));
  
  // Catch-all handler: serve index.html for all non-API routes
  // API routes are already defined above, so they will match first
  app.get('*', (req, res) => {
    // Only serve index.html for non-API routes
    const isApiRoute = req.path.startsWith('/health') || 
                       req.path.startsWith('/images') || 
                       req.path.startsWith('/upload');
    
    if (!isApiRoute) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    // This shouldn't happen if API routes are defined correctly above
    res.status(404).json({ message: 'Not found' });
  });
}

app.listen(PORT, () => {
  console.log(`Mini Image Gallery backend running on port ${PORT}`);
});
