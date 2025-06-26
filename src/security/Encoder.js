import 'dotenv/config';
import crypto from 'crypto';

const algorith = 'aes-256-cbc';
const iv = Buffer.alloc(16,0);

function getKey() {
    const secret =  process.env.ENCRYPTION_SECRET;
    if (!secret) {
        throw new Error ('ENCRYPTION SECRET não definida no .env');
    }
    return crypto.createHash('sha256').update(secret).digest();
}

export function encrypt(text){
    const key =  getKey();
    const cipher = crypto.createCipheriv(algorith, key, iv);
    const encrypted = Buffer.concat([cipher.update(text,'utf-8'),cipher.final()]);
    return encrypted.toString('base64');
}

export function decrypt(encryptedText){
    const key =  getKey();
    const encrypted = Buffer.from(encryptedText,'base64');
    const decipher = crypto.createCipheriv(algorith,key,iv);
    const decrypted = Buffer.concat([decipher.update(encrypted),decipher.final()]);
    return decrypted.toString('utf8');
}

export function generateSecretWithSalt(mainLength = 16, saltLength = 4) {
    const main = crypto.randomBytes(mainLength);
    const salt = crypto.randomBytes(saltLength);
    const combined = Buffer.concat([main, salt]);
    return combined.toString('hex').slice(0, mainLength * 2); 
}