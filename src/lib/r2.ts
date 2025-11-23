import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const accountId = process.env.R2_ACCOUNT_ID || '';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
const bucketName = process.env.R2_BUCKET_NAME || '';
const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '');
const publicUrl = process.env.R2_PUBLIC_URL;

function validateR2Config() {
  if (!accountId) {
    throw new Error('R2_ACCOUNT_ID is not defined in environment variables');
  }
  if (!accessKeyId) {
    throw new Error('R2_ACCESS_KEY_ID is not defined in environment variables');
  }
  if (!secretAccessKey) {
    throw new Error('R2_SECRET_ACCESS_KEY is not defined in environment variables');
  }
  if (!bucketName) {
    throw new Error('R2_BUCKET_NAME is not defined in environment variables');
  }
}

let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  validateR2Config();

  if (!r2Client) {
    r2Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return r2Client;
}

export async function uploadImage(
  file: Buffer | Uint8Array,
  key: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  try {
    const client = getR2Client();
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await client.send(command);
    return key;
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw new Error('Failed to upload image to R2 Storage');
  }
}

export async function deleteImage(key: string): Promise<void> {
  try {
    const client = getR2Client();
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await client.send(command);
  } catch (error) {
    console.error('Error deleting from R2:', error);
    throw new Error('Failed to delete image from R2 Storage');
  }
}

export async function getSignedImageUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const url = await getSignedUrl(client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
}

export function getPublicImageUrl(key: string): string {
  if (publicUrl) {
    return `${publicUrl}/${key}`;
  }
  return `${endpoint}/${bucketName}/${key}`;
}

export function generateFaceImageKey(personId: string, extension: string = 'jpg'): string {
  const timestamp = Date.now();
  return `faces/${personId}-${timestamp}.${extension}`;
}

export function base64ToBuffer(base64String: string): Buffer {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

export function extractContentType(base64String: string): string {
  const match = base64String.match(/^data:(image\/\w+);base64,/);
  return match ? match[1] : 'image/jpeg';
}
