/**
 * Universal Memory Tool - Tool chính của TomiNetwork
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { handleUniversalMemory } from "../memory/universal-tool.js";
import { UniversalRequest } from "../types/index.js";
import { TOOL_NAMES } from "../core/constants.js";

/**
 * Đăng ký Universal Memory Tool
 */
export function registerUniversalMemoryTool(server: McpServer) {
  server.tool(
    TOOL_NAMES.UNIVERSAL_MEMORY,
    "Universal tool để lưu trữ, truy xuất và quản lý tất cả thông tin cho AI",
    {
      action: z
        .enum([
          "store", // Lưu trữ thông tin
          "retrieve", // Truy xuất thông tin
          "search", // Tìm kiếm thông tin
          "list", // Liệt kê tất cả
          "delete", // Xóa thông tin
          "update", // Cập nhật thông tin
          "create_tool", // Tạo tool mới
          "create_api_tool", // Tạo API tool với template
          "execute_tool", // Thực thi tool
          "list_tools", // Liệt kê tools
          "delete_tool", // Xóa tool
          "clear_all", // Xóa sạch tất cả entries
          "clear_tools", // Xóa sạch tất cả tools
          "reset", // Reset toàn bộ hệ thống
        ])
        .describe("Hành động cần thực hiện"),

      // Memory operations
      key: z.string().optional().describe("Key để lưu trữ/truy xuất"),
      value: z.any().optional().describe("Giá trị cần lưu trữ"),
      type: z
        .enum(["text", "json", "list", "counter", "custom"])
        .optional()
        .describe("Loại dữ liệu"),
      description: z.string().optional().describe("Mô tả về thông tin này"),
      tags: z.array(z.string()).optional().describe("Tags để phân loại"),

      // Search operations
      query: z.string().optional().describe("Từ khóa tìm kiếm"),
      limit: z.number().optional().describe("Số lượng kết quả tối đa"),

      // Tool operations
      toolName: z.string().optional().describe("Tên tool"),
      toolId: z.string().optional().describe("ID của tool"),
      toolDescription: z.string().optional().describe("Mô tả tool"),
      toolType: z
        .enum(["storage", "retrieval", "processor", "analyzer"])
        .optional()
        .describe("Loại tool"),
      parameters: z
        .record(z.any())
        .optional()
        .describe("Parameters của tool"),
      handlerCode: z.string().optional().describe("JavaScript code để xử lý tool"),
      args: z.record(z.any()).optional().describe("Arguments để thực thi tool"),

      // API tool operations
      apiUrl: z.string().optional().describe("URL của API endpoint"),
      apiMethod: z
        .enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
        .optional()
        .describe("HTTP method"),
      apiHeaders: z
        .record(z.string())
        .optional()
        .describe("Default headers cho API"),
      apiAuth: z
        .object({
          type: z.enum(["bearer", "basic", "api-key"]),
          token: z.string().optional(),
          username: z.string().optional(),
          password: z.string().optional(),
          apiKey: z.string().optional(),
          apiKeyHeader: z.string().optional(),
        })
        .optional()
        .describe("Authentication config"),
      apiTimeout: z
        .number()
        .optional()
        .describe("Timeout cho API request (ms)"),
    },
    async (params) => {
      try {
        // Tạo request cho universal tool
        const request: UniversalRequest = {
          action: params.action,
          key: params.key,
          value: params.value,
          type: params.type,
          description: params.description,
          tags: params.tags,
          query: params.query,
          limit: params.limit,
          toolName: params.toolName,
          toolId: params.toolId,
          toolDescription: params.toolDescription,
          toolType: params.toolType,
          parameters: params.parameters,
          handlerCode: params.handlerCode,
          args: params.args,
          apiUrl: params.apiUrl,
          apiMethod: params.apiMethod,
          apiHeaders: params.apiHeaders,
          apiAuth: params.apiAuth,
          apiTimeout: params.apiTimeout,
        };

        // Gọi universal handler
        const response = await handleUniversalMemory(request);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error: (error as Error).message,
                  action: params.action,
                  timestamp: new Date().toISOString(),
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }
  );
}
