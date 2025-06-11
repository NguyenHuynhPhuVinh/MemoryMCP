/**
 * Universal Memory Tool - Tool duy nhất để quản lý tất cả memory operations
 */
import {
  MemoryTool,
  UniversalRequest,
  UniversalResponse,
} from "../types/index.js";
import { memoryStorage } from "./storage.js";

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
        message = `Tìm thấy ${result.length} kết quả cho: ${request.query}`;
        break;

      case "list":
        result = handleList(request);
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
        result = handleListTools(request);
        message = `Liệt kê ${result.length} tools`;
        break;

      case "delete_tool":
        result = handleDeleteTool(request);
        message = result ? `Đã xóa tool` : `Không tìm thấy tool để xóa`;
        break;

      case "analyze":
        result = handleAnalyze(request);
        message = `Phân tích dữ liệu hoàn tất`;
        break;

      case "export":
        result = handleExport(request);
        message = `Xuất dữ liệu thành công`;
        break;

      case "import":
        result = handleImport(request);
        message = `Nhập dữ liệu thành công`;
        break;

      case "clear_all":
        result = handleClearAll(request);
        message = `Đã xóa sạch ${result.cleared} entries`;
        break;

      case "clear_tools":
        result = handleClearTools(request);
        message = `Đã xóa sạch ${result.cleared} tools`;
        break;

      case "reset":
        result = handleReset(request);
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
  if (!request.key || request.value === undefined) {
    throw new Error("key và value là bắt buộc cho action store");
  }

  return memoryStorage.store(
    request.key,
    request.value,
    request.type || "text",
    request.description,
    request.tags
  );
}

function handleRetrieve(request: UniversalRequest): any {
  if (!request.key) {
    throw new Error("key là bắt buộc cho action retrieve");
  }

  return memoryStorage.retrieve(request.key);
}

function handleSearch(request: UniversalRequest): any {
  if (!request.query) {
    throw new Error("query là bắt buộc cho action search");
  }

  return memoryStorage.search(request.query, request.limit || 10);
}

function handleList(request: UniversalRequest): any {
  return memoryStorage.listEntries();
}

function handleDelete(request: UniversalRequest): any {
  if (!request.key) {
    throw new Error("key là bắt buộc cho action delete");
  }

  return memoryStorage.delete(request.key);
}

function handleUpdate(request: UniversalRequest): any {
  if (!request.key || request.value === undefined) {
    throw new Error("key và value là bắt buộc cho action update");
  }

  return memoryStorage.update(
    request.key,
    request.value,
    request.description,
    request.tags
  );
}

function handleCreateTool(request: UniversalRequest): any {
  if (!request.toolName || !request.toolDescription || !request.handlerCode) {
    throw new Error(
      "toolName, toolDescription và handlerCode là bắt buộc cho action create_tool"
    );
  }

  return memoryStorage.createTool(
    request.toolName,
    request.toolDescription,
    request.toolType || ("custom" as MemoryTool["type"]),
    request.parameters || {},
    request.handlerCode
  );
}

function handleCreateApiTool(request: UniversalRequest): any {
  if (!request.toolName || !request.toolDescription || !request.apiUrl) {
    throw new Error(
      "toolName, toolDescription và apiUrl là bắt buộc cho action create_api_tool"
    );
  }

  const method = request.apiMethod || "GET";
  const headers = request.apiHeaders || {};
  const auth = request.apiAuth;
  const timeout = request.apiTimeout || 5000;

  // Tạo handler code cho API tool
  const handlerCode = `
const { ApiFetcher } = await import('../api/api.js');

// Lấy parameters từ args
const { body, params, customHeaders, customAuth } = args;

// Chuẩn bị request config
const apiRequest = {
  url: '${request.apiUrl}',
  method: '${method}',
  headers: { ${JSON.stringify(headers)}, ...customHeaders },
  timeout: ${timeout}
};

// Thêm body nếu có
if (body && ['POST', 'PUT', 'PATCH'].includes('${method}')) {
  apiRequest.body = body;
}

// Thêm query params nếu có
if (params) {
  apiRequest.params = params;
}

// Xử lý authentication
${
  auth
    ? `
const authConfig = ${JSON.stringify(auth)};
if (customAuth) {
  Object.assign(authConfig, customAuth);
}
apiRequest.auth = authConfig;
`
    : `
if (customAuth) {
  apiRequest.auth = customAuth;
}
`
}

try {
  // Thực hiện API call
  const response = await ApiFetcher.fetch(apiRequest);

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        success: true,
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        duration: response.duration,
        url: response.url,
        method: response.method
      }, null, 2)
    }]
  };
} catch (error) {
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        success: false,
        error: error.message,
        url: '${request.apiUrl}',
        method: '${method}'
      }, null, 2)
    }]
  };
}
`;

  // Tạo parameters schema cho API tool
  const parameters = {
    body: {
      type: "object",
      description: "Request body (cho POST, PUT, PATCH)",
      optional: true,
    },
    params: {
      type: "object",
      description: "Query parameters",
      optional: true,
    },
    customHeaders: {
      type: "object",
      description: "Custom headers để override",
      optional: true,
    },
    customAuth: {
      type: "object",
      description: "Custom authentication để override",
      optional: true,
    },
  };

  return memoryStorage.createTool(
    request.toolName,
    request.toolDescription,
    "processor",
    parameters,
    handlerCode
  );
}

async function handleExecuteTool(request: UniversalRequest): Promise<any> {
  if (!request.toolId && !request.toolName) {
    throw new Error("toolId hoặc toolName là bắt buộc cho action execute_tool");
  }

  let toolId = request.toolId;
  if (!toolId && request.toolName) {
    const tool = memoryStorage.getTool(request.toolName);
    if (!tool) {
      throw new Error(`Tool '${request.toolName}' không tồn tại`);
    }
    toolId = tool.id;
  }

  return await memoryStorage.executeTool(toolId!, request.args || {});
}

function handleListTools(request: UniversalRequest): any {
  return memoryStorage.listTools();
}

function handleDeleteTool(request: UniversalRequest): any {
  if (!request.toolId && !request.toolName) {
    throw new Error("toolId hoặc toolName là bắt buộc cho action delete_tool");
  }

  let toolId = request.toolId;
  if (!toolId && request.toolName) {
    const tool = memoryStorage.getTool(request.toolName);
    if (!tool) return false;
    toolId = tool.id;
  }

  return memoryStorage.deleteTool(toolId!);
}

function handleAnalyze(request: UniversalRequest): any {
  const analysisType = request.analysisType || "summary";
  return memoryStorage.analyze(analysisType);
}

function handleExport(request: UniversalRequest): any {
  const format = request.format || "json";
  const entries = memoryStorage.listEntries();
  const tools = memoryStorage.listTools();

  const data = {
    entries,
    tools,
    exportedAt: new Date().toISOString(),
    version: "1.0",
  };

  switch (format) {
    case "json":
      return data;

    case "csv":
      // Simple CSV export for entries
      const csvHeaders = "key,type,description,createdAt,accessCount\n";
      const csvRows = entries
        .map(
          (e) =>
            `"${e.key}","${e.type}","${e.description || ""}","${e.createdAt}",${
              e.accessCount
            }`
        )
        .join("\n");
      return csvHeaders + csvRows;

    case "txt":
      return entries
        .map(
          (e) =>
            `${e.key}: ${
              typeof e.value === "string" ? e.value : JSON.stringify(e.value)
            }`
        )
        .join("\n\n");

    default:
      throw new Error(`Format không hỗ trợ: ${format}`);
  }
}

function handleImport(request: UniversalRequest): any {
  if (!request.data) {
    throw new Error("data là bắt buộc cho action import");
  }

  const format = request.format || "json";
  let imported = 0;

  try {
    if (format === "json") {
      const data =
        typeof request.data === "string"
          ? JSON.parse(request.data)
          : request.data;

      if (data.entries && Array.isArray(data.entries)) {
        for (const entry of data.entries) {
          memoryStorage.store(
            entry.key,
            entry.value,
            entry.type || "text",
            entry.description,
            entry.tags
          );
          imported++;
        }
      }
    }

    return {
      imported,
      format,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Lỗi khi import: ${(error as Error).message}`);
  }
}

function handleClearAll(request: UniversalRequest): any {
  return memoryStorage.clearAllEntries();
}

function handleClearTools(request: UniversalRequest): any {
  return memoryStorage.clearAllTools();
}

function handleReset(request: UniversalRequest): any {
  return memoryStorage.resetAll();
}
