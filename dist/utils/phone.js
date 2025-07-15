"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidSenegalPhone = exports.formatSenegalPhone = void 0;
const formatSenegalPhone = (phone) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('221')) {
        return `+${digits}`;
    }
    else if (digits.startsWith('77') || digits.startsWith('78') || digits.startsWith('70') || digits.startsWith('76')) {
        return `+221${digits}`;
    }
    else if (digits.startsWith('33')) {
        return `+221${digits}`;
    }
    return phone;
};
exports.formatSenegalPhone = formatSenegalPhone;
const isValidSenegalPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('221')) {
        const localNumber = cleaned.slice(3);
        return (localNumber.startsWith('77') ||
            localNumber.startsWith('78') ||
            localNumber.startsWith('70') ||
            localNumber.startsWith('76') ||
            localNumber.startsWith('33')) &&
            localNumber.length === 9;
    }
    return (cleaned.startsWith('77') ||
        cleaned.startsWith('78') ||
        cleaned.startsWith('70') ||
        cleaned.startsWith('76') ||
        cleaned.startsWith('33')) &&
        cleaned.length === 9;
};
exports.isValidSenegalPhone = isValidSenegalPhone;
//# sourceMappingURL=phone.js.map