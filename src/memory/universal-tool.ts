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
import { FirebaseOperations } from "../modules/firebase-operations.js";

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
        result = await handleStore(request);
        message =
          result.message || `Đã lưu trữ thông tin với key: ${request.key}`;
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
        result = handleList();
        message = `Liệt kê ${result.length} entries`;
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
        result = await handleCreateTool(request);
        message = result.message || `Đã tạo tool: ${result.name}`;
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

async function handleStore(request: UniversalRequest): Promise<any> {
  // Store locally first
  const localResult = MemoryOperations.store(request);

  // If has "public" tag, also sync to Firebase
  if (isPublic(request.tags)) {
    try {
      const backendUrl = getFirebaseBackendUrl(request);
      await FirebaseOperations.syncMemoryToFirebase(request, backendUrl);
      return {
        ...localResult,
        firebaseSync: true,
        message: `Memory đã được lưu local và sync lên Firebase`,
      };
    } catch (error) {
      return {
        ...localResult,
        firebaseSync: false,
        firebaseError: (error as Error).message,
        message: `Memory đã được lưu local nhưng lỗi sync Firebase: ${
          (error as Error).message
        }`,
      };
    }
  }

  return localResult;
}

function handleRetrieve(request: UniversalRequest): any {
  return MemoryOperations.retrieve(request);
}

function handleSearch(request: UniversalRequest): any {
  return SearchOperations.search(request);
}

function handleList(): any {
  return SearchOperations.listEntries();
}

function handleDelete(request: UniversalRequest): any {
  return MemoryOperations.delete(request);
}

function handleUpdate(request: UniversalRequest): any {
  return MemoryOperations.update(request);
}

async function handleCreateTool(request: UniversalRequest): Promise<any> {
  // Create tool locally first
  const localResult = ToolOperations.createTool(request);

  // If has "public" tag, also sync to Firebase
  if (isPublic(request.tags)) {
    try {
      const backendUrl = getFirebaseBackendUrl(request);
      await FirebaseOperations.syncToolToFirebase(
        {
          ...request,
          toolId: localResult.id,
        },
        backendUrl
      );
      return {
        ...localResult,
        firebaseSync: true,
        message: `Tool đã được tạo local và sync lên Firebase`,
      };
    } catch (error) {
      return {
        ...localResult,
        firebaseSync: false,
        firebaseError: (error as Error).message,
        message: `Tool đã được tạo local nhưng lỗi sync Firebase: ${
          (error as Error).message
        }`,
      };
    }
  }

  return localResult;
}

function handleCreateApiTool(request: UniversalRequest): any {
  return ToolOperations.createApiTool(request);
}

async function handleExecuteTool(request: UniversalRequest): Promise<any> {
  // First try to execute local tool
  const localTool = memoryCore.getTool(request.toolId!);

  if (localTool) {
    // Execute local tool
    return await ToolOperations.executeTool(request);
  } else {
    // Tool not found locally, try Firebase if toolId looks like Firebase ID
    try {
      const backendUrl = getFirebaseBackendUrl(request);
      return await FirebaseOperations.executeFirebaseTool(
        {
          ...request,
          firebaseId: request.toolId,
        },
        backendUrl
      );
    } catch (error) {
      throw new Error(
        `Tool '${
          request.toolId
        }' không tồn tại local và không thể thực thi từ Firebase: ${
          (error as Error).message
        }`
      );
    }
  }
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

// ========== FIREBASE HELPER FUNCTIONS ==========

/**
 * Check if tags contain "public"
 */
function isPublic(tags?: string[]): boolean {
  return tags ? tags.includes("public") : false;
}

/**
 * Get Firebase backend URL
 */
function getFirebaseBackendUrl(request: UniversalRequest): string {
  return request.firebaseBackendUrl || "http://localhost:3001";
}
