/**
 * Universal TomiNetwork Tool - Tool duy nhất để quản lý tất cả operations
 */
import {
  MemoryTool,
  UniversalRequest,
  UniversalResponse,
} from "../types/index.js";
import { memoryCore } from "../core/memory-core.js";
import { MemoryOperations } from "../modules/memory-operations.js";
import { ToolOperations } from "../modules/tool-operations.js";
import { SearchOperations } from "../modules/search-operations.js";

/**
 * Universal Memory Tool Handler
 */
export async function handleUniversalMemory(
  request: UniversalRequest
): Promise<UniversalResponse> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    let result: any;
    let message: string;

    switch (request.action) {
      case "store":
        result = handleStore(request);
        message = `Đã lưu trữ thông tin với key: ${request.key}`;
        break;

      case "retrieve":
        result = handleRetrieve(request);
        message = result
          ? `Đã truy xuất thông tin: ${request.key}`
          : `Không tìm thấy: ${request.key}`;
        break;

      case "search":
        result = handleSearch(request);
        message = `Tìm thấy ${result.totalFound} kết quả cho: ${request.query}`;
        break;

      case "list":
        result = handleList(request);
        message = `Liệt kê ${result.total} entries`;
        break;

      case "delete":
        result = handleDelete(request);
        message = result
          ? `Đã xóa: ${request.key}`
          : `Không tìm thấy để xóa: ${request.key}`;
        break;

      case "update":
        result = handleUpdate(request);
        message = result
          ? `Đã cập nhật: ${request.key}`
          : `Không tìm thấy để cập nhật: ${request.key}`;
        break;

      case "create_tool":
        result = handleCreateTool(request);
        message = `Đã tạo tool: ${result.name}`;
        break;

      case "create_api_tool":
        result = handleCreateApiTool(request);
        message = `Đã tạo API tool: ${result.name}`;
        break;

      case "execute_tool":
        result = await handleExecuteTool(request);
        message = `Đã thực thi tool thành công`;
        break;

      case "list_tools":
        result = handleListTools();
        message = `Liệt kê ${result.length} tools`;
        break;

      case "delete_tool":
        result = handleDeleteTool(request);
        message = result ? `Đã xóa tool` : `Không tìm thấy tool để xóa`;
        break;

      case "clear_all":
        result = handleClearAll();
        message = `Đã xóa sạch ${result.cleared} entries`;
        break;

      case "clear_tools":
        result = handleClearTools();
        message = `Đã xóa sạch ${result.cleared} tools`;
        break;

      case "reset":
        result = handleReset();
        message = `Đã reset hệ thống: ${result.entriesCleared} entries và ${result.toolsCleared} tools`;
        break;

      default:
        throw new Error(`Action không hợp lệ: ${request.action}`);
    }

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      action: request.action,
      message,
      data: result,
      timestamp,
      metadata: {
        executionTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      action: request.action,
      message: `Lỗi: ${(error as Error).message}`,
      timestamp,
      metadata: {
        executionTime: Date.now() - startTime,
      },
    };
  }
}

// ========== HANDLER FUNCTIONS ==========

function handleStore(request: UniversalRequest): any {
  return MemoryOperations.store(request);
}

function handleRetrieve(request: UniversalRequest): any {
  return MemoryOperations.retrieve(request);
}

function handleSearch(request: UniversalRequest): any {
  return SearchOperations.search(request);
}

function handleList(request: UniversalRequest): any {
  return SearchOperations.listEntries();
}

function handleDelete(request: UniversalRequest): any {
  return MemoryOperations.delete(request);
}

function handleUpdate(request: UniversalRequest): any {
  return MemoryOperations.update(request);
}

function handleCreateTool(request: UniversalRequest): any {
  return ToolOperations.createTool(request);
}

function handleCreateApiTool(request: UniversalRequest): any {
  return ToolOperations.createApiTool(request);
}

async function handleExecuteTool(request: UniversalRequest): Promise<any> {
  return await ToolOperations.executeTool(request);
}

function handleListTools(): any {
  return ToolOperations.listTools();
}

function handleDeleteTool(request: UniversalRequest): any {
  return ToolOperations.deleteTool(request);
}

function handleClearAll(): any {
  return MemoryOperations.clearAll();
}

function handleClearTools(): any {
  return ToolOperations.clearAllTools();
}

function handleReset(): any {
  return memoryCore.resetAll();
}
