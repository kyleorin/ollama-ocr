import fs from 'fs';

export function encodeImage(imagePath: string): string {
  const imageFile = fs.readFileSync(imagePath);
  return Buffer.from(imageFile).toString('base64');
}
