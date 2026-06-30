import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
const maxSize = 10 * 1024 * 1024;

function safeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
}

export function validateMediaFile(file: File) {
  if (!allowedTypes.has(file.type)) throw new Error('Upload must be PNG, JPG, WebP, or SVG');
  if (file.size <= 0 || file.size > maxSize) throw new Error('Upload must be between 1 byte and 10 MB');
}

function s3Config() {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  if (!bucket || !region) return null;
  return {
    bucket,
    region,
    endpoint: process.env.S3_ENDPOINT,
    publicUrl: process.env.S3_PUBLIC_URL,
  };
}

function client(config: NonNullable<ReturnType<typeof s3Config>>) {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: Boolean(config.endpoint),
    credentials: process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        }
      : undefined,
  });
}

export async function storeMedia(file: File) {
  validateMediaFile(file);
  const key = `mockups/${crypto.randomUUID()}-${safeName(file.name)}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const config = s3Config();

  if (config) {
    await client(config).send(new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: bytes,
      ContentType: file.type,
    }));
    const base = config.publicUrl
      ?? (config.endpoint
        ? `${config.endpoint.replace(/\/$/, '')}/${config.bucket}`
        : `https://${config.bucket}.s3.${config.region}.amazonaws.com`);
    return { key, url: `${base.replace(/\/$/, '')}/${key}` };
  }

  const target = path.join(process.cwd(), 'public', 'uploads', key.replace('mockups/', ''));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, bytes);
  return { key, url: `/uploads/${path.basename(target)}` };
}

export async function deleteMedia(key: string) {
  const config = s3Config();
  if (config) {
    await client(config).send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
    return;
  }
  const file = path.join(process.cwd(), 'public', 'uploads', path.basename(key));
  await fs.rm(file, { force: true });
}
