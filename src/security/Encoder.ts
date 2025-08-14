import 'dotenv/config';
import { Buffer } from 'node:buffer';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  type BinaryLike
} from 'node:crypto';

const algorithm = 'aes-256-cbc' as const;
const iv = Buffer.alloc(16, 0);

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET não definida no .env');
  }
  return createHash('sha256').update(secret as BinaryLike).digest();
}

export function encrypt(text: string): string {
  const key = getKey();
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return encrypted.toString('base64');
}

export function decrypt(encryptedText: string): string {
  const key = getKey();
  const encrypted = Buffer.from(encryptedText, 'base64');
  const decipher = createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

export function generateSecretWithSalt(mainLength = 16, saltLength = 4): string {
  if (mainLength <= 0 || saltLength <= 0) {
    throw new Error('mainLength e saltLength devem ser positivos');
  }
  const main = randomBytes(mainLength);
  const salt = randomBytes(saltLength);
  const combined = Buffer.concat([main, salt]);
  // mantém seu comportamento: retorna hexa truncado ao tamanho principal
  return combined.toString('hex').slice(0, mainLength * 2);
}
