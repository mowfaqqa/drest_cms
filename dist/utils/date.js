"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDateInRange = exports.addDays = exports.formatDate = void 0;
const formatDate = (date, format = 'short') => {
    switch (format) {
        case 'short':
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        case 'long':
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        case 'iso':
            return date.toISOString();
        default:
            return date.toLocaleDateString();
    }
};
exports.formatDate = formatDate;
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};
exports.addDays = addDays;
const isDateInRange = (date, startDate, endDate) => {
    return date >= startDate && date <= endDate;
};
exports.isDateInRange = isDateInRange;
//# sourceMappingURL=date.js.map