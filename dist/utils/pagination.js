"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaginationMeta = void 0;
const createPaginationMeta = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    return {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null
    };
};
exports.createPaginationMeta = createPaginationMeta;
//# sourceMappingURL=pagination.js.map