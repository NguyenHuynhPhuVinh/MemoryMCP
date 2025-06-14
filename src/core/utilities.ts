/**
 * Utilities - Các hàm tiện ích cho Memory MCP
 */
import { VALIDATION, ERROR_MESSAGES } from "./constants.js";

/**
 * Validation utilities
 */
export class ValidationUtils {
  /**
   * Validate memory key
   */
  static validateKey(key: string): { valid: boolean; error?: string } {
    if (!key || typeof key !== "string") {
      return { valid: false, error: "Key phải là string không rỗng" };
    }

    if (key.length < VALIDATION.MIN_KEY_LENGTH) {
      return { valid: false, error: `Key phải có ít nhất ${VALIDATION.MIN_KEY_LENGTH} ký tự` };
    }

    if (key.length > VALIDATION.MAX_KEY_LENGTH) {
      return { valid: false, error: `Key không được vượt quá ${VALIDATION.MAX_KEY_LENGTH} ký tự` };
    }

    if (!VALIDATION.KEY_PATTERN.test(key)) {
      return { valid: false, error: "Key chỉ được chứa chữ cái, số, dấu gạch dưới, dấu chấm và dấu gạch ngang" };
    }

    return { valid: true };
  }

  /**
   * Validate tool name
   */
  static validateToolName(name: string): { valid: boolean; error?: string } {
    if (!name || typeof name !== "string") {
      return { valid: false, error: "Tool name phải là string không rỗng" };
    }

    if (name.length < VALIDATION.MIN_TOOL_NAME_LENGTH) {
      return { valid: false, error: `Tool name phải có ít nhất ${VALIDATION.MIN_TOOL_NAME_LENGTH} ký tự` };
    }

    if (name.length > VALIDATION.MAX_TOOL_NAME_LENGTH) {
      return { valid: false, error: `Tool name không được vượt quá ${VALIDATION.MAX_TOOL_NAME_LENGTH} ký tự` };
    }

    if (!VALIDATION.TOOL_NAME_PATTERN.test(name)) {
      return { valid: false, error: "Tool name chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang" };
    }

    return { valid: true };
  }

  /**
   * Validate required fields
   */
  static validateRequired(fields: Record<string, any>): { valid: boolean; error?: string } {
    for (const [fieldName, value] of Object.entries(fields)) {
      if (value === undefined || value === null || value === "") {
        return { valid: false, error: `${fieldName} là bắt buộc` };
      }
    }
    return { valid: true };
  }
}

/**
 * Format utilities
 */
export class FormatUtils {
  /**
   * Format timestamp
   */
  static formatTimestamp(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return timestamp;
    }
  }

  /**
   * Format file size
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Format duration
   */
  static formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  /**
   * Truncate text
   */
  static truncateText(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }
}

/**
 * Search utilities
 */
export class SearchUtils {
  /**
   * Normalize search query
   */
  static normalizeQuery(query: string): string {
    return query.toLowerCase().trim();
  }

  /**
   * Check if text matches query
   */
  static matchesQuery(text: string, query: string): boolean {
    if (!text || !query) return false;
    return text.toLowerCase().includes(query.toLowerCase());
  }

  /**
   * Calculate relevance score
   */
  static calculateRelevance(text: string, query: string): number {
    if (!text || !query) return 0;

    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();

    // Exact match gets highest score
    if (textLower === queryLower) return 100;

    // Starts with query gets high score
    if (textLower.startsWith(queryLower)) return 80;

    // Contains query gets medium score
    if (textLower.includes(queryLower)) return 60;

    // Word boundary match gets lower score
    const words = textLower.split(/\s+/);
    for (const word of words) {
      if (word.startsWith(queryLower)) return 40;
      if (word.includes(queryLower)) return 20;
    }

    return 0;
  }

  /**
   * Highlight matches in text
   */
  static highlightMatches(text: string, query: string): string {
    if (!text || !query) return text;

    const regex = new RegExp(`(${query})`, "gi");
    return text.replace(regex, "**$1**");
  }
}

/**
 * Error utilities
 */
export class ErrorUtils {
  /**
   * Create standardized error
   */
  static createError(message: string, code?: string): Error {
    const error = new Error(message);
    if (code) {
      (error as any).code = code;
    }
    return error;
  }

  /**
   * Handle and format error
   */
  static handleError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    return "Đã xảy ra lỗi không xác định";
  }

  /**
   * Create validation error
   */
  static createValidationError(field: string, message: string): Error {
    return this.createError(`Validation error for ${field}: ${message}`, "VALIDATION_ERROR");
  }
}

/**
 * Performance utilities
 */
export class PerformanceUtils {
  private static timers: Map<string, number> = new Map();

  /**
   * Start timer
   */
  static startTimer(name: string): void {
    this.timers.set(name, Date.now());
  }

  /**
   * End timer and get duration
   */
  static endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) return 0;

    const duration = Date.now() - startTime;
    this.timers.delete(name);
    return duration;
  }

  /**
   * Measure execution time
   */
  static async measureAsync<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await fn();
    const duration = Date.now() - startTime;
    return { result, duration };
  }

  /**
   * Measure sync execution time
   */
  static measure<T>(fn: () => T): { result: T; duration: number } {
    const startTime = Date.now();
    const result = fn();
    const duration = Date.now() - startTime;
    return { result, duration };
  }
}

/**
 * Object utilities
 */
export class ObjectUtils {
  /**
   * Deep clone object
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as any;
    if (obj instanceof Array) return obj.map(item => this.deepClone(item)) as any;
    if (typeof obj === "object") {
      const cloned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }
    return obj;
  }

  /**
   * Check if object is empty
   */
  static isEmpty(obj: any): boolean {
    if (obj === null || obj === undefined) return true;
    if (typeof obj === "string" || Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === "object") return Object.keys(obj).length === 0;
    return false;
  }

  /**
   * Get nested property safely
   */
  static getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested property safely
   */
  static setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!(key in current)) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
}
