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
app.use(express.json({ limit: '10mb' }));

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

  const fileUrl = `${'https'}://${req.get('host')}/files/${req.file.filename}`;

  res.json({
    success: true,
    filename: req.file.filename,
    url: fileUrl,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
});


// Upload endpoint for base64 JSON (for n8n compatibility)
app.post('/upload-base64', (req, res) => {
  try {
        const uploadDir = path.join(__dirname, 'uploads');
    const { data, filename } = req.body;
    
    if (!data || !filename) {
      return res.status(400).json({
        success: false,
        message: 'Missing data or filename'
      });
    }
    
    // Convert base64 to buffer
    const buffer = Buffer.from(data, 'base64');
    
    // Generate filename with timestamp if not provided
    const finalFilename = `${Date.now()}-${filename}`;
    const filePath = path.join(uploadDir, finalFilename);
    
    // Write file
    fs.writeFileSync(filePath, buffer);
    
    // Get file stats for response
    const fileStats = fs.statSync(filePath);
    const fileUrl = `${'https'}://${req.get('host')}/files/${finalFilename}`;
    
    res.json({
      success: true,
      filename: finalFilename,
      url: fileUrl,
      size: fileStats.size,
      mimetype: 'application/octet-stream'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
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
