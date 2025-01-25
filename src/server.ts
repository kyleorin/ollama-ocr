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

// Configure Ollama endpoint
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
process.env.OLLAMA_HOST = OLLAMA_HOST;

const uploadsDir = path.join(process.cwd(), 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

const upload = multer({ dest: uploadsDir });

// ... existing code ...
app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      ollama_host: OLLAMA_HOST,
      timestamp: new Date().toISOString()
    });
  });
  // ... existing code ...

app.post('/ocr', upload.single('file'), async (req, res) => {
  try {
    // Test Ollama connection first
    try {
      await fetch(`${OLLAMA_HOST}/api/tags`);
    } catch (error) {
      return res.status(503).json({
        error: 'Ollama server not available',
        details: error.message
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
  } catch (error) {
    console.error('OCR Error:', error);
    res.status(500).json({ 
      error: 'OCR processing failed',
      details: error.message
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Using Ollama host: ${OLLAMA_HOST}`);
});