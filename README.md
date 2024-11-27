# Ollama OCR

An OCR tool based on Ollama-supported visual models such as [Llama 3.2-Vision](https://ollama.com/library/llama3.2-vision) or [MiniCPM-V 2.6](https://ollama.com/library/minicpm-v)  accurately recognizes text in images while preserving the original formatting.

## Features

- 🚀 High accuracy text recognition using Llama 3.2-Vision/MiniCPM-V 2.6 model
- 📝 Preserves original text formatting and structure
- 🖼️ Supports multiple image formats: JPG, JPEG, PNG
- ⚡️ Customizable recognition prompts and models
- 🔍 Markdown output format option
- 💪 Robust error handling

> Accurate text recognition on macOS: [macos-vision-ocr](https://github.com/bytefer/macos-vision-ocr).

## System Requirements

- Node.js 18.0 or higher
- Local running [Ollama](https://ollama.com/) server
- [Llama 3.2-Vision](https://ollama.com/library/llama3.2-vision) model installed

## Important Notes

1. Ensure Ollama server is running before use
2. Make sure Llama 3.2-Vision model is downloaded
3. Currently supported image formats: .jpg, .jpeg, .png

## Installation

```bash
npm install ollama-ocr
# or using pnpm
pnpm add ollama-ocr
```

## Usage

### Basic Usage

```javascript
import { ollamaOCR, DEFAULT_OCR_SYSTEM_PROMPT } from "ollama-ocr";

async function runOCR() {
  const text = await ollamaOCR({
    filePath: "./test/images/handwriting.jpg",
    systemPrompt: DEFAULT_OCR_SYSTEM_PROMPT,
  });
  console.log(text);
}
```

### Markdown Output

```javascript
import { ollamaOCR, DEFAULT_MARKDOWN_SYSTEM_PROMPT } from "ollama-ocr";

async function runOCR() {
  const text = await ollamaOCR({
    filePath: "./test/images/trader-joes-receipt.jpg",
    systemPrompt: DEFAULT_MARKDOWN_SYSTEM_PROMPT,
  });
  console.log(text);
}
```

## Use MiniCPM-V 2.6 Vision Model

```javascript
async function runOCR() {
  const text = await ollamaOCR({
    model: "minicpm-v",
    filePath: "./handwriting.jpg.jpg",
    systemPrompt: DEFAULT_OCR_SYSTEM_PROMPT,
  });
  console.log(text);
}
```

## Error Handling

The tool provides comprehensive error handling:

```javascript
import { ollamaOCR, LlamaOCRError, ErrorCode } from "ollama-ocr";

async function runOCR() {
  try {
    const text = await ollamaOCR({
      filePath: "./test/images/handwriting.jpg",
    });
    console.log(text);
  } catch (error) {
    if (error instanceof LlamaOCRError) {
      switch (error.code) {
        case ErrorCode.FILE_NOT_FOUND:
          console.error("Image file not found");
          break;
        case ErrorCode.UNSUPPORTED_FILE_TYPE:
          console.error("Unsupported image format");
          break;
        case ErrorCode.OLLAMA_SERVER_ERROR:
          console.error("Ollama server connection failed");
          break;
        case ErrorCode.OCR_PROCESSING_ERROR:
          console.error("OCR processing failed");
          break;
      }
    }
  }
}
```

## License

MIT
