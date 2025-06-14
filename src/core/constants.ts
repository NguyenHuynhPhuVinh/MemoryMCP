/**
 * TomiNetwork Constants - Tập trung tất cả các hằng số của ứng dụng
 */

// ========== TOMINETWORK CONSTANTS ==========

/**
 * Đường dẫn lưu trữ dữ liệu
 */
export const STORAGE_PATHS = {
  DATA_DIR: "tominetwork-data",
  MEMORY_FILE: "memory.json",
  TOOLS_FILE: "tools.json",
  SEARCH_INDEX_FILE: "search-index.json",
} as const;

/**
 * Các loại memory entry
 */
export const MEMORY_ENTRY_TYPES = {
  TEXT: "text",
  JSON: "json",
  LIST: "list",
  COUNTER: "counter",
  CUSTOM: "custom",
} as const;

/**
 * Các loại memory tool
 */
export const MEMORY_TOOL_TYPES = {
  STORAGE: "storage",
  RETRIEVAL: "retrieval",
  PROCESSOR: "processor",
  ANALYZER: "analyzer",
} as const;

/**
 * Universal actions
 */
export const UNIVERSAL_ACTIONS = {
  // Memory operations
  STORE: "store",
  RETRIEVE: "retrieve",
  SEARCH: "search",
  LIST: "list",
  DELETE: "delete",
  UPDATE: "update",
  CLEAR_ALL: "clear_all",
  RESET: "reset",

  // Tool operations
  CREATE_TOOL: "create_tool",
  CREATE_API_TOOL: "create_api_tool",
  EXECUTE_TOOL: "execute_tool",
  LIST_TOOLS: "list_tools",
  DELETE_TOOL: "delete_tool",
  CLEAR_TOOLS: "clear_tools",
} as const;

// ========== API CONSTANTS ==========

/**
 * HTTP methods hỗ trợ
 */
export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
  HEAD: "HEAD",
  OPTIONS: "OPTIONS",
} as const;

/**
 * Authentication types
 */
export const AUTH_TYPES = {
  BEARER: "bearer",
  BASIC: "basic",
  API_KEY: "api-key",
} as const;

/**
 * Default API settings
 */
export const API_DEFAULTS = {
  TIMEOUT: 5000,
  HEADERS: {
    "Content-Type": "application/json",
    "User-Agent": "MemoryMCP-APITool",
  },
} as const;

// ========== MCP CONSTANTS ==========

/**
 * TomiNetwork Server info
 */
export const TOMINETWORK_SERVER = {
  NAME: "TomiNetwork",
  VERSION: "2.0.0",
  DESCRIPTION: "Hệ thống quản lý thông tin và công cụ thông minh cho AI",
} as const;

/**
 * Tool names
 */
export const TOOL_NAMES = {
  UNIVERSAL_MEMORY: "TomiNetwork",
  INTRODUCTION: "introduction_TomiNetwork",
  GET_EXAMPLES: "getMemoryToolExamples_TomiNetwork",
} as const;

// ========== ERROR MESSAGES ==========

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  // Memory errors
  KEY_REQUIRED: "key là bắt buộc",
  VALUE_REQUIRED: "value là bắt buộc",
  QUERY_REQUIRED: "query là bắt buộc",

  // Tool errors
  TOOL_NAME_REQUIRED: "toolName là bắt buộc",
  TOOL_DESCRIPTION_REQUIRED: "toolDescription là bắt buộc",
  HANDLER_CODE_REQUIRED: "handlerCode là bắt buộc",
  TOOL_NOT_FOUND: "Tool không tồn tại",
  TOOL_ID_OR_NAME_REQUIRED: "toolId hoặc toolName là bắt buộc",

  // API errors
  API_URL_REQUIRED: "apiUrl là bắt buộc",

  // General errors
  INVALID_ACTION: "Action không hợp lệ",
  EXECUTION_ERROR: "Lỗi khi thực thi",
} as const;

// ========== SUCCESS MESSAGES ==========

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  // Memory operations
  STORED: "Đã lưu trữ thông tin",
  RETRIEVED: "Đã truy xuất thông tin",
  UPDATED: "Đã cập nhật thông tin",
  DELETED: "Đã xóa thông tin",
  SEARCH_COMPLETED: "Tìm kiếm hoàn tất",
  LIST_COMPLETED: "Liệt kê hoàn tất",

  // Tool operations
  TOOL_CREATED: "Đã tạo tool",
  TOOL_EXECUTED: "Đã thực thi tool thành công",
  TOOL_DELETED: "Đã xóa tool",

  // Cleanup operations
  ENTRIES_CLEARED: "Đã xóa sạch entries",
  TOOLS_CLEARED: "Đã xóa sạch tools",
  SYSTEM_RESET: "Đã reset hệ thống",
} as const;

// ========== LIMITS ==========

/**
 * Default limits
 */
export const LIMITS = {
  DEFAULT_SEARCH_LIMIT: 10,
  MAX_SEARCH_LIMIT: 100,
  DEFAULT_TIMEOUT: 5000,
  MAX_TIMEOUT: 30000,
} as const;

// ========== VALIDATION PATTERNS ==========

/**
 * Validation patterns
 */
export const VALIDATION = {
  KEY_PATTERN: /^[a-zA-Z0-9_.-]+$/,
  TOOL_NAME_PATTERN: /^[a-zA-Z0-9_-]+$/,
  MIN_KEY_LENGTH: 1,
  MAX_KEY_LENGTH: 100,
  MIN_TOOL_NAME_LENGTH: 1,
  MAX_TOOL_NAME_LENGTH: 50,
} as const;
