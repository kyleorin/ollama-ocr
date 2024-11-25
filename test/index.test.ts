import path from 'path';
import { describe, test, expect } from 'vitest';
import { ollamaOCR, LlamaOCRError, ErrorCode } from '../dist';

describe('ollamaOCR', () => {
  const testImagesDir = path.join(__dirname, 'images');
  const invalidTypePath = path.join(__dirname, 'test.txt');
  const validImagePath = path.join(testImagesDir, 'handwriting.jpg');
  const invalidImagePath = path.join(testImagesDir, 'non-existent.jpg');

  test('should successfully process image and return text', async () => {
    const result = await ollamaOCR({ filePath: validImagePath });
    expect(result).toBeDefined();
  }, {
    timeout: 30000
  });

  test('should throw error when file does not exist', async () => {
    await expect(ollamaOCR({ filePath: invalidImagePath }))
      .rejects
      .toThrow(new LlamaOCRError(
        ErrorCode.FILE_NOT_FOUND,
        `File not found: ${invalidImagePath}`
      ));
  });

  test('should throw error for unsupported file type', async () => {
    await expect(ollamaOCR({ filePath: invalidTypePath }))
      .rejects
      .toThrow(LlamaOCRError);

    await expect(ollamaOCR({ filePath: invalidTypePath }))
      .rejects
      .toMatchObject({
        code: ErrorCode.UNSUPPORTED_FILE_TYPE
      });
  });
});
