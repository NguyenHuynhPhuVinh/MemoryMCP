/**
 * Memory MCP - Hệ thống lưu trữ và truy xuất thông tin cho AI
 */

/**
 * Kiểu dữ liệu cho Memory Entry
 */
export interface MemoryEntry {
  id: string;
  key: string;
  value: any;
  type: "text" | "json" | "list" | "counter" | "custom";
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  accessCount: number;
  lastAccessed: string;
}

/**
 * Kiểu dữ liệu cho Memory Tool
 */
export interface MemoryTool {
  id: string;
  name: string;
  description: string;
  type: "storage" | "retrieval" | "processor" | "analyzer";
  parameters: Record<string, any>;
  handlerCode: string;
  createdAt: string;
  usageCount: number;
}

/**
 * Universal Tool Actions
 */
export type UniversalAction =
  | "store" // Lưu trữ thông tin
  | "retrieve" // Truy xuất thông tin
  | "search" // Tìm kiếm thông tin
  | "list" // Liệt kê tất cả
  | "delete" // Xóa thông tin
  | "update" // Cập nhật thông tin
  | "create_tool" // Tạo tool mới
  | "create_api_tool" // Tạo API tool với template
  | "execute_tool" // Thực thi tool
  | "list_tools" // Liệt kê tools
  | "delete_tool" // Xóa tool
  | "clear_all" // Xóa sạch tất cả entries
  | "clear_tools" // Xóa sạch tất cả tools
  | "reset"; // Reset toàn bộ hệ thống

/**
 * Universal Tool Request
 */
export interface UniversalRequest {
  action: UniversalAction;

  // For memory operations
  key?: string;
  value?: any;
  type?: "text" | "json" | "list" | "counter" | "custom";
  description?: string;
  tags?: string[];

  // For search
  query?: string;
  limit?: number;

  // For tools
  toolName?: string;
  toolId?: string;
  toolDescription?: string;
  toolType?: "storage" | "retrieval" | "processor" | "analyzer";
  parameters?: Record<string, any>;
  handlerCode?: string;
  args?: Record<string, any>;

  // For API tool creation
  apiUrl?: string;
  apiMethod?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
  apiHeaders?: Record<string, string>;
  apiAuth?: {
    type: "bearer" | "basic" | "api-key";
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
  apiTimeout?: number;
}

/**
 * Universal Tool Response
 */
export interface UniversalResponse {
  success: boolean;
  action: UniversalAction;
  message: string;
  data?: any;
  timestamp: string;
  metadata?: {
    count?: number;
    totalSize?: number;
    executionTime?: number;
  };
}
