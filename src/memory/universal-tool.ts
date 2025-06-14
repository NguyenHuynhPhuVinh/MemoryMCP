/**
 * Universal TomiNetwork Tool - Tool duy nhất để quản lý tất cả operations
 */
import {
  MemoryTool,
  UniversalRequest,
  UniversalResponse,
} from "../types/index.js";
import { HandlerOperations } from "../modules/handler-operations.js";

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
        result = await HandlerOperations.handleStore(request);
        message =
          result.message || `Đã lưu trữ thông tin với key: ${request.key}`;
        break;

      case "retrieve":
        result = await HandlerOperations.handleRetrieve(request);
        message = result
          ? `Đã truy xuất thông tin: ${request.key}`
          : `Không tìm thấy: ${request.key}`;
        break;

      case "search":
        result = HandlerOperations.handleSearch(request);
        message = `Tìm thấy ${result.totalFound} kết quả cho: ${request.query}`;
        break;

      case "list":
        result = await HandlerOperations.handleList(request);
        message = `Liệt kê ${result.pagination.total} entries (trang ${result.pagination.page}/${result.pagination.totalPages})`;
        break;

      case "delete":
        result = await HandlerOperations.handleDelete(request);
        message = result.message || `Đã xóa: ${request.key}`;
        break;

      case "update":
        result = await HandlerOperations.handleUpdate(request);
        message =
          result.message ||
          (result
            ? `Đã cập nhật: ${request.key}`
            : `Không tìm thấy để cập nhật: ${request.key}`);
        break;

      case "create_tool":
        result = await HandlerOperations.handleCreateTool(request);
        message = result.message || `Đã tạo tool: ${result.name}`;
        break;

      case "create_api_tool":
        result = await HandlerOperations.handleCreateApiTool(request);
        message = result.message || `Đã tạo API tool: ${result.name}`;
        break;

      case "execute_tool":
        result = await HandlerOperations.handleExecuteTool(request);
        message = `Đã thực thi tool thành công`;
        break;

      case "list_tools":
        result = await HandlerOperations.handleListTools(request);
        message = `Liệt kê ${result.pagination.total} tools (trang ${result.pagination.page}/${result.pagination.totalPages})`;
        break;

      case "delete_tool":
        result = await HandlerOperations.handleDeleteTool(request);
        message = result.message || `Đã xóa tool`;
        break;

      case "clear_all":
        result = await HandlerOperations.handleClearAll(request);
        message = result.message || `Đã xóa sạch ${result.cleared} entries`;
        break;

      case "clear_tools":
        result = await HandlerOperations.handleClearTools(request);
        message = result.message || `Đã xóa sạch ${result.cleared} tools`;
        break;

      case "reset":
        result = await HandlerOperations.handleReset(request);
        message =
          result.message ||
          `Đã reset hệ thống: ${result.entriesCleared} entries và ${result.toolsCleared} tools`;
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
