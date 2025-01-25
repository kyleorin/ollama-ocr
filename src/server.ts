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
// Add more basic test endpoints
app.get('/', (req, res) => {
  console.log('Root endpoint hit');
  res.json({ status: 'Server is running' });
});

// Simplify the server for testing
app.get('/ping', (req, res) => {
  console.log('Ping received at:', new Date().toISOString());
  res.json({ 
    status: 'alive',
    time: new Date().toISOString(),
    memory: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// Increase timeout for image processing
const timeoutMiddleware = (req: any, res: any, next: any) => {
  res.setTimeout(120000, () => {
    console.log('Request has timed out.');
    res.status(503).send({
      error: 'Request timeout',
      message: 'The request took too long to process'
    });
  });
  next();
};

app.use(timeoutMiddleware);

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

// Add retry logic for Ollama connection
async function waitForOllama(maxRetries = 3, delay = 10000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1} to connect to Ollama...`);
      const response = await fetch(`${OLLAMA_HOST}/api/tags`);
      if (response.ok) {
        console.log('Successfully connected to Ollama');
        return true;
      }
    } catch (error) {
      console.log(`Attempt ${i + 1} failed, waiting ${delay/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

app.post('/ocr', upload.single('file'), async (req, res) => {
  console.log('OCR request received');
  try {
    // Wait for Ollama to be available
    const isOllamaReady = await waitForOllama();
    if (!isOllamaReady) {
      return res.status(503).json({
        error: 'Ollama server not available',
        details: 'Server is starting up, please try again in a minute'
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

// Add test endpoint for image processing only
app.post('/test-image', upload.single('file'), async (req, res) => {
  console.log('Image test request received');
  try {
    let imagePath;
    
    if (req.body.url) {
      console.log('Testing URL image:', req.body.url);
      const response = await fetch(req.body.url);
      if (!response.ok) {
        return res.status(400).json({ 
          error: 'Failed to fetch image from URL',
          status: response.status,
          statusText: response.statusText
        });
      }
      const buffer = await response.buffer();
      const tempPath = path.join(uploadsDir, `${Date.now()}.jpg`);
      await fs.writeFile(tempPath, buffer);
      imagePath = tempPath;
      
      console.log('Successfully downloaded and saved image to:', imagePath);
      res.json({ 
        success: true, 
        message: 'Image processed successfully',
        path: imagePath,
        size: buffer.length
      });

      // Cleanup
      await fs.unlink(imagePath).catch(console.error);
    } else if (req.file) {
      imagePath = req.file.path;
      res.json({ 
        success: true, 
        message: 'File uploaded successfully',
        path: imagePath,
        size: (await fs.stat(imagePath)).size
      });
    } else {
      return res.status(400).json({ error: 'No file or URL provided' });
    }
  } catch (error: any) {
    console.error('Image processing error:', error);
    res.status(500).json({ 
      error: 'Image processing failed',
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