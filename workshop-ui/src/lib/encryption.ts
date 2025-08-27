import crypto from 'crypto';

// Function to encrypt data
export function encrypt(text: string, key: Buffer): string {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16); // Generate a random initialization vector
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  cipher.setAAD(Buffer.from('nextjs-app', 'utf8'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV, auth tag, and encrypted data
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

// Function to decrypt data
export function decrypt(encryptedText: string, key: Buffer): string {
  const algorithm = 'aes-256-gcm';
  
  // Split the IV, auth tag, and encrypted data
  const textParts = encryptedText.split(':');
  const iv = Buffer.from(textParts[0], 'hex');
  const authTag = Buffer.from(textParts[1], 'hex');
  const encryptedData = textParts[2];
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAAD(Buffer.from('nextjs-app', 'utf8'));
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Example usage
// const key = crypto.randomBytes(32); // Generate a random 256-bit key
// const textToEncrypt = 'Hello, World!';

// const hexKey = key.toString('hex');
// console.log('Hexadecimal Key:', hexKey);

// const encrypted = encrypt(textToEncrypt, key);
// console.log('Encrypted:', encrypted);

// const decrypted = decrypt(encrypted, key);
// console.log('Decrypted:', decrypted);
