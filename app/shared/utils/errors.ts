import { isRouteErrorResponse } from "react-router";
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

type ErrorCopy = {
  notFoundTitle: string;
  notFoundBody: string;
  statusTitle: string;
  retry: string;
  genericTitle: string;
  genericBody: string;
};

const ERROR_COPY_ZH: ErrorCopy = {
  notFoundTitle: "找不到頁面",
  notFoundBody: "您要前往的頁面不存在，請檢查網址或返回首頁。",
  statusTitle: "發生錯誤 ({status})",
  retry: "請稍後再試。",
  genericTitle: "出了點問題",
  genericBody: "發生未預期的錯誤，請稍後再試。",
};

const ERROR_COPY_EN: ErrorCopy = {
  notFoundTitle: "Page not found",
  notFoundBody: "This page does not exist. Check the URL or go back home.",
  statusTitle: "Error ({status})",
  retry: "Please try again in a moment.",
  genericTitle: "Something went wrong",
  genericBody: "An unexpected error occurred. Please try again.",
};

function errorCopyFor(locale?: string): ErrorCopy {
  return locale === "en" ? ERROR_COPY_EN : ERROR_COPY_ZH;
}

/**
 * 將 ErrorBoundary 收到的 error 正規化為標題與訊息，供 root 與 route ErrorBoundary 共用。
 * @param error - useRouteError() 回傳值
 * @param locale - optional UI locale; defaults to zh-TW copy
 * @returns title、message，若為 RouteErrorResponse 則含 statusCode
 */
export function getRouteErrorDisplay(
  error: unknown,
  locale?: string
): RouteErrorDisplay {
  const copy = errorCopyFor(locale);
  if (isRouteErrorResponse(error)) {
    const title =
      error.status === 404
        ? copy.notFoundTitle
        : copy.statusTitle.replace("{status}", String(error.status));
    const dataMessage =
      error.data &&
      typeof (error.data as { message?: unknown }).message === "string"
        ? (error.data as { message: string }).message
        : null;
    const message =
      error.status === 404
        ? copy.notFoundBody
        : (dataMessage ?? error.statusText ?? copy.retry);
    return { title, message, statusCode: error.status };
  }
  const message = error instanceof Error ? error.message : copy.genericBody;
  return { title: copy.genericTitle, message };
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
