/**
 * Examples Tool - Tool cung cấp examples về cách tạo TomiNetwork tools
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL_NAMES } from "../core/constants.js";

/**
 * Đăng ký Examples Tool
 */
export function registerExamplesTool(server: McpServer) {
  server.tool(
    TOOL_NAMES.GET_EXAMPLES,
    "Lấy examples về cách tạo TomiNetwork tools đúng cách",
    {},
    async () => {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                title: "🛠️ TomiNetwork Tool Creation Examples",
                description:
                  "Examples về cách tạo tools đúng cách cho TomiNetwork",

                examples: {
                  notekeeper: {
                    name: "notekeeper",
                    description: "Tool quản lý ghi chú cá nhân",
                    type: "storage",
                    createdWith: "create_tool",
                    parameters: {
                      action: {
                        type: "string",
                        enum: ["add", "get", "list", "delete"],
                        description: "Hành động cần thực hiện",
                      },
                      title: {
                        type: "string",
                        description: "Tiêu đề ghi chú (cho action add)",
                        optional: true,
                      },
                      content: {
                        type: "string",
                        description: "Nội dung ghi chú (cho action add)",
                        optional: true,
                      },
                      id: {
                        type: "string",
                        description: "ID ghi chú (cho action get/delete)",
                        optional: true,
                      },
                    },
                    handlerCode: `
// TomiNetwork Dynamic Tool Handler - Notekeeper
const { action, title, content, id } = args;

try {
  switch (action) {
    case 'add':
      const noteId = generateId();
      const note = { id: noteId, title, content, createdAt: new Date().toISOString() };
      storage.store(\`note_\${noteId}\`, note, 'json', \`Note: \${title}\`, ['note']);
      return { 
        content: [{ 
          type: "text", 
          text: JSON.stringify({ 
            success: true, 
            noteId, 
            message: "Ghi chú đã được lưu thành công" 
          }, null, 2) 
        }] 
      };
      
    case 'get':
      const retrieved = storage.retrieve(\`note_\${id}\`);
      return { 
        content: [{ 
          type: "text", 
          text: JSON.stringify(
            retrieved ? retrieved.value : { error: "Không tìm thấy ghi chú" }, 
            null, 2
          ) 
        }] 
      };
      
    case 'list':
      const notes = storage.search('note').map(e => e.value);
      return { 
        content: [{ 
          type: "text", 
          text: JSON.stringify({ 
            notes, 
            count: notes.length,
            message: \`Tìm thấy \${notes.length} ghi chú\`
          }, null, 2) 
        }] 
      };
      
    case 'delete':
      const deleted = storage.delete(\`note_\${id}\`);
      return { 
        content: [{ 
          type: "text", 
          text: JSON.stringify({ 
            success: deleted, 
            message: deleted ? "Đã xóa ghi chú" : "Không tìm thấy ghi chú để xóa" 
          }, null, 2) 
        }] 
      };
      
    default:
      return { 
        content: [{ 
          type: "text", 
          text: JSON.stringify({ 
            error: "Action không hợp lệ. Các action hỗ trợ: add, get, list, delete" 
          }, null, 2) 
        }] 
      };
  }
} catch (error) {
  return { 
    content: [{ 
      type: "text", 
      text: JSON.stringify({ 
        error: "Lỗi khi thực thi tool: " + error.message 
      }, null, 2) 
    }] 
  };
}
`,
                    usage: {
                      action: "execute_tool",
                      toolName: "notekeeper",
                      args: {
                        action: "add",
                        title: "Meeting Notes",
                        content: "Discuss project timeline and deliverables",
                      },
                    },
                  },

                  taskTracker: {
                    name: "taskTracker",
                    description: "Tool quản lý công việc và theo dõi tiến độ",
                    type: "processor",
                    createdWith: "create_tool",
                    parameters: {
                      action: {
                        type: "string",
                        enum: ["add", "complete", "list", "stats"],
                        description: "Hành động cần thực hiện",
                      },
                      task: {
                        type: "string",
                        description: "Mô tả công việc (cho action add)",
                        optional: true,
                      },
                      priority: {
                        type: "string",
                        enum: ["high", "medium", "low"],
                        description: "Độ ưu tiên (cho action add)",
                        optional: true,
                      },
                      id: {
                        type: "string",
                        description: "ID task (cho action complete)",
                        optional: true,
                      },
                    },
                    usage: {
                      action: "execute_tool",
                      toolName: "taskTracker",
                      args: {
                        action: "add",
                        task: "Review code changes",
                        priority: "high",
                      },
                    },
                  },

                  weatherAPI: {
                    name: "weatherAPI",
                    description:
                      "Tool lấy thông tin thời tiết từ OpenWeatherMap API",
                    type: "processor",
                    createdWith: "create_api_tool",
                    apiConfig: {
                      apiUrl: "https://api.openweathermap.org/data/2.5/weather",
                      apiMethod: "GET",
                      apiHeaders: {
                        "Content-Type": "application/json",
                      },
                      apiAuth: {
                        type: "api-key",
                        apiKey: "your-api-key",
                        apiKeyHeader: "appid",
                      },
                      apiTimeout: 10000,
                    },
                    usage: {
                      action: "execute_tool",
                      toolName: "weatherAPI",
                      args: {
                        params: {
                          q: "Hanoi,VN",
                          units: "metric",
                        },
                      },
                    },
                  },

                  fetchApiTool: {
                    name: "fetchBasedAPI",
                    description:
                      "Recommended: API tool using fetch with Promise",
                    type: "processor",
                    createdWith: "create_tool",
                    note: "Use create_tool with fetch-based handler code for best compatibility",
                  },
                },

                guidelines: `
⚠️ QUAN TRỌNG: Handler code của TomiNetwork tools PHẢI:

1. Trả về MCP format:
   return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };

2. Có error handling:
   try { ... } catch (error) { return error response }

3. Validate input parameters

4. Sử dụng storage context: storage.store(), storage.retrieve(), storage.search()

5. Sử dụng generateId() để tạo unique IDs

✅ BEST PRACTICES:
- Luôn wrap code trong try-catch
- Validate tất cả inputs
- Trả về messages có ý nghĩa
- Sử dụng consistent naming
- Document các parameters rõ ràng
`,

                quickStart: {
                  step1: "Tạo tool: TomiNetwork(action: 'create_tool', ...)",
                  step2: "Test tool: TomiNetwork(action: 'execute_tool', ...)",
                  step3: "List tools: TomiNetwork(action: 'list_tools')",
                  step4: "Manage: TomiNetwork(action: 'delete_tool', ...)",
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
