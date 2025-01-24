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

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

const upload = multer({ dest: uploadsDir });

app.post('/ocr', upload.single('file'), async (req, res) => {
  try {
    let imagePath;
    
    if (req.body.url) {
      // Handle URL-based images
      const response = await fetch(req.body.url);
      const buffer = await response.buffer();
      const tempPath = path.join('uploads', `${Date.now()}.jpg`);
      await fs.writeFile(tempPath, buffer);
      imagePath = tempPath;
    } else if (req.file) {
      // Handle file uploads
      imagePath = req.file.path;
    } else {
      return res.status(400).json({ error: 'No file or URL provided' });
    }

    const text = await ollamaOCR({
      filePath: imagePath,
    });

    // Cleanup temporary file if it was from URL
    if (req.body.url) {
      await fs.unlink(imagePath);
    }

    res.json({ text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3000;
const host = '0.0.0.0';

app.listen(port, host, () => {
  console.log(`Server running on ${host}:${port}`);
});