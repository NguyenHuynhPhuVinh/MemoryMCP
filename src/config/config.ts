/**
 * Cấu hình ứng dụng
 */

/**
 * Cấu hình môi trường
 */
export const ENV = {
  // Môi trường thực thi (development, production, test)
  NODE_ENV: process.env.NODE_ENV || "development",

  // Cổng máy chủ (nếu cần)
  PORT: process.env.PORT || 3000,

  // Cờ gỡ lỗi
  DEBUG: process.env.DEBUG === "true",
};

/**
 * Cấu hình ứng dụng
 */
import { TOMINETWORK_SERVER, LIMITS } from "../core/constants.js";

export const APP_CONFIG = {
  // Tên ứng dụng
  NAME: TOMINETWORK_SERVER.NAME,

  // Phiên bản
  VERSION: TOMINETWORK_SERVER.VERSION,

  // Mô tả
  DESCRIPTION: TOMINETWORK_SERVER.DESCRIPTION,

  // Thời gian chờ mặc định (ms)
  DEFAULT_TIMEOUT: LIMITS.DEFAULT_TIMEOUT,

  // Số lần thử lại tối đa
  MAX_RETRIES: 3,
};

/**
 * Cấu hình ghi log
 */
export const LOG_CONFIG = {
  // Cấp độ ghi log (debug, info, warn, error)
  LEVEL: process.env.LOG_LEVEL || "info",

  // Có ghi log vào tệp không
  FILE_LOGGING: process.env.FILE_LOGGING === "true",

  // Đường dẫn tệp ghi log
  LOG_FILE_PATH: process.env.LOG_FILE_PATH || "./logs/app.log",
};
