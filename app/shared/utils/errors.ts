import { isRouteErrorResponse } from "@remix-run/react";

/**
 * 統一的錯誤處理工具
 *
 * 提供一致的錯誤類型和處理方式
 */

/** 供 route / root ErrorBoundary 使用的顯示用資料 */
export type RouteErrorDisplay = {
  title: string;
  message: string;
  statusCode?: number;
};

/**
 * 將 ErrorBoundary 收到的 error 正規化為標題與訊息，供 root 與 route ErrorBoundary 共用。
 * @param error - useRouteError() 回傳值
 * @returns title、message，若為 RouteErrorResponse 則含 statusCode
 */
export function getRouteErrorDisplay(error: unknown): RouteErrorDisplay {
  if (isRouteErrorResponse(error)) {
    const title =
      error.status === 404 ? "找不到頁面" : `發生錯誤 (${error.status})`;
    const dataMessage =
      error.data &&
      typeof (error.data as { message?: unknown }).message === "string"
        ? (error.data as { message: string }).message
        : null;
    const message =
      error.status === 404
        ? "您要前往的頁面不存在，請檢查網址或返回首頁。"
        : (dataMessage ?? error.statusText ?? "請稍後再試。");
    return { title, message, statusCode: error.status };
  }
  const message =
    error instanceof Error ? error.message : "發生未預期的錯誤，請稍後再試。";
  return { title: "出了點問題", message };
}

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
