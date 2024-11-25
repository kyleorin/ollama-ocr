export interface OCRConfig {
  filePath: string;
  systemPrompt?: string;
}

export const DEFAULT_OCR_SYSTEM_PROMPT = `Act as an OCR assistant. Analyze the provided image and:
    1. Recognize all visible text in the image as accurately as possible.
    2. Maintain the original structure and formatting of the text.
    3. If any words or phrases are unclear, indicate this with [unclear] in your transcription.

    Provide only the transcription without any additional comments.`;

export const DEFAULT_MARKDOWN_SYSTEM_PROMPT = `Convert the provided image into Markdown format. Ensure that all content from the page is included, such as headers, footers, subtexts, images (with alt text if possible), tables, and any other elements.

  Requirements:
  - Output Only Markdown: Return solely the Markdown content without any additional explanations or comments.
  - No Delimiters: Do not use code fences or delimiters like \`\`\`markdown.
  - Complete Content: Do not omit any part of the page, including headers, footers, and subtext.
  `;

export const SUPPORTED_IMAGE_TYPES = [
  '.jpg',
  '.jpeg',
  '.png'
] as const;

export type SupportedImageType = typeof SUPPORTED_IMAGE_TYPES[number];

export enum ErrorCode {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  UNSUPPORTED_FILE_TYPE = 'UNSUPPORTED_FILE_TYPE',
  OLLAMA_SERVER_ERROR = 'OLLAMA_SERVER_ERROR',
  OCR_PROCESSING_ERROR = 'OCR_PROCESSING_ERROR'
}

export interface ErrorResponse {
  code: ErrorCode;
  message: string;
}
