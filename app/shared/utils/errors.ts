/**
 * 統一的錯誤處理工具
 * 
 * 提供一致的錯誤類型和處理方式
 */

/**
 * 應用程式錯誤類型
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * 資源未找到錯誤
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

/**
 * 驗證錯誤
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

/**
 * 創建資源未找到錯誤的輔助函數
 */
export function notFound(resource: string, id: string): NotFoundError {
  return new NotFoundError(resource, id);
}

/**
 * 創建驗證錯誤的輔助函數
 */
export function validationError(message: string): ValidationError {
  return new ValidationError(message);
}

