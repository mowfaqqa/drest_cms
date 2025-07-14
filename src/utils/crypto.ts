import crypto from 'crypto';

export const generateRandomString = (length: number = 32): string => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

export const generateHash = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// src/utils/email.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  const maskedLocal = localPart.length > 2 
    ? localPart.slice(0, 2) + '*'.repeat(localPart.length - 2)
    : localPart;
  return `${maskedLocal}@${domain}`;
};