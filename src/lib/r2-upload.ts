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

export interface UploadResult {
  imageUrl: string;
  imageKey: string;
}

export async function uploadFaceImage(
  file: File | Buffer,
  personId: string,
  type: 'student' | 'teacher'
): Promise<UploadResult> {
  try {
    const fileExtension = file instanceof File ? file.name.split('.').pop() : 'jpg';
    const key = `${type}s/${personId}-${uuidv4()}.${fileExtension}`;

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
  type: 'student' | 'teacher'
): Promise<UploadResult> {
  try {
    const base64Match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error('Invalid base64 image data');
    }

    const [, extension, data] = base64Match;
    const buffer = Buffer.from(data, 'base64');

    const key = `${type}s/${personId}-${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: `image/${extension}`,
    });

    await s3Client.send(command);

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
