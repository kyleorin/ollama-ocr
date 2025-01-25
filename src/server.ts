import express from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import cors from 'cors';
import { ollamaOCR } from './index';

const app = express();
app.use(cors());
app.use(express.json());

// Add basic root endpoint for quick testing
app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Configure Ollama endpoint with more logging
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
console.log('Starting server with OLLAMA_HOST:', OLLAMA_HOST);
process.env.OLLAMA_HOST = OLLAMA_HOST;

const uploadsDir = path.join(process.cwd(), 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

const upload = multer({ dest: uploadsDir });

app.get('/health', (req, res) => {
  console.log('Health check requested');
  console.log('OLLAMA_HOST:', OLLAMA_HOST);
  res.json({ 
    status: 'ok', 
    ollama_host: OLLAMA_HOST,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

app.post('/ocr', upload.single('file'), async (req, res) => {
  console.log('OCR request received');
  try {
    // Test Ollama connection first
    console.log('Testing Ollama connection to:', OLLAMA_HOST);
    try {
      const response = await fetch(`${OLLAMA_HOST}/api/tags`);
      console.log('Ollama response:', await response.text());
    } catch (error: any) {
      console.error('Ollama connection error:', error);
      return res.status(503).json({
        error: 'Ollama server not available',
        details: error.message || 'Unknown error'
      });
    }

    let imagePath;
    
    if (req.body.url) {
      const response = await fetch(req.body.url);
      if (!response.ok) {
        return res.status(400).json({ error: 'Failed to fetch image from URL' });
      }
      const buffer = await response.buffer();
      const tempPath = path.join(uploadsDir, `${Date.now()}.jpg`);
      await fs.writeFile(tempPath, buffer);
      imagePath = tempPath;
    } else if (req.file) {
      imagePath = req.file.path;
    } else {
      return res.status(400).json({ error: 'No file or URL provided' });
    }

    const text = await ollamaOCR({
      filePath: imagePath,
    });

    if (req.body.url) {
      await fs.unlink(imagePath).catch(console.error);
    }

    res.json({ text });
  } catch (error: any) {
    console.error('OCR Error:', error);
    res.status(500).json({ 
      error: 'OCR processing failed',
      details: error.message || 'Unknown error'
    });
  }
});

// Add error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Using Ollama host: ${OLLAMA_HOST}`);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    PWD: process.cwd()
  });
});