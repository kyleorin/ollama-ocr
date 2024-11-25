import { existsSync } from 'fs';
import { extname } from 'path';
import ollama from 'ollama';
import { encodeImage } from './util';
import { DEFAULT_OCR_SYSTEM_PROMPT, OCRConfig, ErrorCode, SUPPORTED_IMAGE_TYPES } from './config';
export { DEFAULT_OCR_SYSTEM_PROMPT, DEFAULT_MARKDOWN_SYSTEM_PROMPT, SUPPORTED_IMAGE_TYPES, ErrorCode } from './config';

export interface LlamaOCRConfig extends OCRConfig {
    model?: string;
}

export class LlamaOCRError extends Error {
    constructor(public readonly code: ErrorCode, message: string) {
        super(message);
        this.name = 'LlamaOCRError';
    }
}

export async function ollamaOCR({
    filePath,
    model = 'llama3.2-vision',
    systemPrompt = DEFAULT_OCR_SYSTEM_PROMPT,
}: LlamaOCRConfig): Promise<string> {
    // Check if file exists
    if (!existsSync(filePath)) {
        throw new LlamaOCRError(
            ErrorCode.FILE_NOT_FOUND,
            `File not found: ${filePath}`
        );
    }

    // Check file type
    const fileExt = extname(filePath).toLowerCase();
    if (!SUPPORTED_IMAGE_TYPES.includes(fileExt as any)) {
        throw new LlamaOCRError(
            ErrorCode.UNSUPPORTED_FILE_TYPE,
            `Unsupported file type: ${fileExt}. Supported types: ${SUPPORTED_IMAGE_TYPES.join(', ')}`
        );
    }

    try {
        const base64Image = encodeImage(filePath);
        const response = await ollama.chat({
            model,
            messages: [
                {
                    role: 'user',
                    content: systemPrompt,
                    images: [base64Image],
                },
            ],
        });

        return response.message.content;
    } catch (error) {
        if ((error as any)?.cause?.code === 'ECONNREFUSED') {
            throw new LlamaOCRError(
                ErrorCode.OLLAMA_SERVER_ERROR,
                'Failed to connect to Ollama server. Please ensure the server is running.'
            );
        }
        throw new LlamaOCRError(
            ErrorCode.OCR_PROCESSING_ERROR,
            `OCR processing failed: ${(error as Error).message}`
        );
    }
}
