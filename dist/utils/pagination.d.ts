export interface PaginationMeta {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
}
export declare const createPaginationMeta: (total: number, page: number, limit: number) => PaginationMeta;
//# sourceMappingURL=pagination.d.ts.map