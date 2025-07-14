export interface ApiResponse<T = any> {
  success: boolean;
  message?: string | undefined;
  data?: T | undefined;
  error?: string;
  timestamp: string;
}

export const createSuccessResponse = <T>(
  data?: T,
  message?: string
): ApiResponse<T> => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString()
});

export const createErrorResponse = (
  error: string,
  message?: string
): ApiResponse => ({
  success: false,
  error,
  message,
  timestamp: new Date().toISOString()
});