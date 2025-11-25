import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

function sanitizeFilename(name: string): string {
  return name
    .replace(/@/g, '_at_')
    .replace(/[^a-zA-Z0-9_\-\.]/g, '_');
}

export interface UploadResult {
  imageUrl: string;
  imageKey: string;
}

export async function uploadFaceImage(
  file: File | Buffer,
  personId: string,
  type: 'student' | 'teacher' | 'user'
): Promise<UploadResult> {
  try {
    const fileExtension = file instanceof File ? file.name.split('.').pop() : 'jpg';
    const safePersonId = sanitizeFilename(personId);
    const key = `${type}s/${safePersonId}-${uuidv4()}.${fileExtension}`;

    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file instanceof File ? file.type : 'image/jpeg',
    });

    await s3Client.send(command);

    const imageUrl = `${PUBLIC_URL}/${key}`;

    return {
      imageUrl,
      imageKey: key,
    };
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw new Error('Failed to upload image to storage');
  }
}

export async function uploadBase64Image(
  base64Data: string,
  personId: string,
  type: 'student' | 'teacher' | 'user'
): Promise<UploadResult> {
  try {
    if (!BUCKET_NAME || !PUBLIC_URL) {
      console.error('R2 config missing:', { BUCKET_NAME: !!BUCKET_NAME, PUBLIC_URL: !!PUBLIC_URL });
      throw new Error('R2 storage is not configured properly');
    }

    const base64Match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error('Invalid base64 image data');
    }

    const [, extension, data] = base64Match;
    const buffer = Buffer.from(data, 'base64');

    const safePersonId = sanitizeFilename(personId);
    const key = `${type}s/${safePersonId}-${uuidv4()}.${extension}`;

    console.log('Uploading to R2:', { key, bucket: BUCKET_NAME, size: buffer.length });

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: `image/${extension}`,
    });

    const result = await s3Client.send(command);
    console.log('R2 upload result:', result.$metadata.httpStatusCode);

    const imageUrl = `${PUBLIC_URL}/${key}`;

    return {
      imageUrl,
      imageKey: key,
    };
  } catch (error) {
    console.error('Error uploading base64 to R2:', error);
    throw new Error('Failed to upload image to storage');
  }
}
