import fs from 'fs/promises';
import path from 'path';
import config from '../config/app.config.js';

const uploadRoot = path.resolve(process.cwd(), config.upload.path);

function toPublicPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function getPublicBaseUrl() {
  const configuredUrl =
    process.env.PUBLIC_API_URL || process.env.API_PUBLIC_URL || process.env.APP_BASE_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  return `http://localhost:${process.env.PORT || config.port}`;
}

export async function saveUploadedFile(fileBuffer, relativePath) {
  const normalizedPath = toPublicPath(relativePath);
  const fullPath = path.resolve(uploadRoot, normalizedPath);

  if (!fullPath.startsWith(uploadRoot)) {
    throw new Error('Invalid upload path');
  }

  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, fileBuffer);

  return {
    filePath: normalizedPath,
    publicUrl: `${getPublicBaseUrl()}/uploads/${encodeURI(normalizedPath)}`,
  };
}

export async function deleteUploadedFile(relativePath) {
  if (!relativePath) {
    return;
  }

  const fullPath = path.resolve(uploadRoot, relativePath);

  if (!fullPath.startsWith(uploadRoot)) {
    throw new Error('Invalid upload path');
  }

  await fs.rm(fullPath, { force: true });
}

export function getUploadedFileUrl(relativePath) {
  return `${getPublicBaseUrl()}/uploads/${encodeURI(toPublicPath(relativePath))}`;
}

export { uploadRoot };
