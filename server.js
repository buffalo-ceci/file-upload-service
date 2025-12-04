const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname}`;
    cb(null, filename);
  }
});

const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());

// Static file serving
app.use('/files', express.static(uploadsDir));

// Upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/files/${req.file.filename}`;

  res.json({
    success: true,
    filename: req.file.filename,
    url: fileUrl,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'File Upload Service',
    endpoints: {
      upload: 'POST /upload',
      download: 'GET /files/:filename',
      health: 'GET /health'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
