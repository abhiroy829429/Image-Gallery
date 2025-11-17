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
  console.log('Request path:', req.path);
  console.log('Request originalUrl:', req.originalUrl);
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
  const fs = require('fs');
  
  // Try multiple possible paths for the frontend dist folder
  // This handles different directory structures on various deployment platforms
  const possiblePaths = [
    path.resolve(__dirname, '../frontend/dist'),           // Local development / standard structure
    path.resolve(__dirname, '../../frontend/dist'),        // Render with backend as root
    path.resolve(process.cwd(), '../frontend/dist'),       // Alternative structure
    path.resolve(process.cwd(), 'frontend/dist'),          // If frontend is in same level
    path.resolve(process.cwd(), '../../frontend/dist'),    // Another alternative
  ];
  
  console.log('Looking for frontend dist folder...');
  console.log('Current working directory:', process.cwd());
  console.log('__dirname:', __dirname);
  
  let distPath = null;
  
  // Find the first path that actually exists
  for (const testPath of possiblePaths) {
    const indexPath = path.join(testPath, 'index.html');
    console.log(`Checking: ${testPath}`);
    if (fs.existsSync(testPath) && fs.existsSync(indexPath)) {
      distPath = testPath;
      console.log(`✓ Found frontend dist at: ${distPath}`);
      break;
    }
  }
  
  if (!distPath) {
    console.error('✗ ERROR: Could not find frontend dist folder. Tried paths:');
    possiblePaths.forEach(p => {
      const exists = fs.existsSync(p);
      console.error(`  ${exists ? '✓' : '✗'} ${p}`);
    });
    console.error('\nMake sure the frontend build completed successfully.');
    console.error('The build script should create: ../frontend/dist/index.html');
  } else {
    // Serve static assets (JS, CSS, images, etc.)
    // express.static only handles GET/HEAD by default, so POST/DELETE will pass through
    app.use(express.static(distPath, {
      maxAge: '1d', // Cache static assets for 1 day
    }));
    
    console.log('Static file serving enabled for:', distPath);
    
    // Catch-all handler: serve index.html ONLY for GET requests to non-API routes
    // POST/DELETE requests will naturally pass through since express.static doesn't handle them
    app.use((req, res, next) => {
      // Normalize the path to handle edge cases like double slashes
      const normalizedPath = req.path.replace(/\/+/g, '/');
      
      // Skip API routes - they should have been handled by route handlers above
      // Check both original path and normalized path
      const isApiRoute = req.path.startsWith('/health') || 
                         req.path.startsWith('/images') || 
                         req.path.startsWith('/upload') ||
                         normalizedPath.startsWith('/health') ||
                         normalizedPath.startsWith('/images') ||
                         normalizedPath.startsWith('/upload');
      
      if (isApiRoute) {
        // If this is a POST/DELETE/PUT to an API route that wasn't handled, log it
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          console.warn(`Unhandled ${req.method} request to API route: ${req.path} (normalized: ${normalizedPath})`);
        }
        // API route not found - return 404
        return res.status(404).json({ message: 'Not found' });
      }
      
      // Only handle GET/HEAD requests for SPA routing
      // POST/DELETE/PUT etc. will return 405 for non-API routes
      if (req.method === 'GET' || req.method === 'HEAD') {
        const indexPath = path.join(distPath, 'index.html');
        return res.sendFile(indexPath, (err) => {
          if (err) {
            console.error('Error sending index.html:', err.message);
            console.error('Attempted path:', indexPath);
            res.status(500).send('Error loading page');
          }
        });
      }
      
      // Method not allowed for non-GET requests to non-API routes
      res.status(405).json({ message: 'Method not allowed' });
    });
  }
}

app.listen(PORT, () => {
  console.log(`Mini Image Gallery backend running on port ${PORT}`);
});
