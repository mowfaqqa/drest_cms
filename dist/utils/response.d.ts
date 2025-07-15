export interface ApiResponse<T = any> {
    success: boolean;
    message?: string | undefined;
    data?: T | undefined;
    error?: string;
    timestamp: string;
}
export declare const createSuccessResponse: <T>(data?: T, message?: string) => ApiResponse<T>;
export declare const createErrorResponse: (error: string, message?: string) => ApiResponse;
//# sourceMappingURL=response.d.ts.map