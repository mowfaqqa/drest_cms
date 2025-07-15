"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskEmail = exports.validateEmail = exports.generateSecureToken = exports.generateHash = exports.generateRandomString = void 0;
const crypto_1 = __importDefault(require("crypto"));
const generateRandomString = (length = 32) => {
    return crypto_1.default.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
};
exports.generateRandomString = generateRandomString;
const generateHash = (data) => {
    return crypto_1.default.createHash('sha256').update(data).digest('hex');
};
exports.generateHash = generateHash;
const generateSecureToken = () => {
    return crypto_1.default.randomBytes(32).toString('hex');
};
exports.generateSecureToken = generateSecureToken;
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
const maskEmail = (email) => {
    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart.length > 2
        ? localPart.slice(0, 2) + '*'.repeat(localPart.length - 2)
        : localPart;
    return `${maskedLocal}@${domain}`;
};
exports.maskEmail = maskEmail;
//# sourceMappingURL=crypto.js.map