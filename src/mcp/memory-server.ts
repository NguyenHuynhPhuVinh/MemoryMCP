/**
 * Memory MCP Server - Server chuyên về lưu trữ và truy xuất thông tin cho AI
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { handleUniversalMemory } from "../memory/universal-tool.js";
import { UniversalRequest } from "../types/index.js";

/**
 * Đăng ký Universal Memory Tool
 */
export function registerMemoryServer(server: McpServer) {
  // 🚀 UNIVERSAL MEMORY TOOL - Tool duy nhất để rule them all!
  server.tool(
    "universalMemory",
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
          "analyze", // Phân tích dữ liệu
          "export", // Xuất dữ liệu
          "import", // Nhập dữ liệu
          "clear_all", // Xóa sạch tất cả entries
          "clear_tools", // Xóa sạch tất cả tools
          "reset", // Reset toàn bộ hệ thống
        ])
        .describe("Hành động cần thực hiện"),

      // For memory operations
      key: z.string().optional().describe("Key để lưu trữ/truy xuất thông tin"),
      value: z
        .any()
        .optional()
        .describe(
          "Giá trị cần lưu trữ (có thể là text, object, array, number...)"
        ),
      type: z
        .enum(["text", "json", "list", "counter", "custom"])
        .optional()
        .describe("Loại dữ liệu"),
      description: z.string().optional().describe("Mô tả về thông tin này"),
      tags: z.array(z.string()).optional().describe("Tags để phân loại"),

      // For search
      query: z.string().optional().describe("Từ khóa tìm kiếm"),
      limit: z.number().optional().describe("Số lượng kết quả tối đa"),

      // For tools
      toolName: z.string().optional().describe("Tên tool"),
      toolId: z.string().optional().describe("ID của tool"),
      toolDescription: z.string().optional().describe("Mô tả tool"),
      toolType: z
        .enum(["storage", "retrieval", "processor", "analyzer"])
        .optional()
        .describe("Loại tool"),
      parameters: z.record(z.any()).optional().describe("Parameters của tool"),
      handlerCode: z
        .string()
        .optional()
        .describe("JavaScript code để xử lý tool"),
      args: z.record(z.any()).optional().describe("Arguments để thực thi tool"),

      // For analysis
      analysisType: z
        .enum(["summary", "count", "trends", "relationships"])
        .optional()
        .describe("Loại phân tích"),

      // For export/import
      format: z
        .enum(["json", "csv", "txt"])
        .optional()
        .describe("Format dữ liệu"),
      data: z.any().optional().describe("Dữ liệu để import"),

      // For API tool creation
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
          analysisType: params.analysisType,
          format: params.format,
          data: params.data,
          apiUrl: params.apiUrl,
          apiMethod: params.apiMethod,
          apiHeaders: params.apiHeaders,
          apiAuth: params.apiAuth,
          apiTimeout: params.apiTimeout,
        };

        // Thực thi universal tool
        const result = await handleUniversalMemory(request);

        // Xử lý đặc biệt cho execute_tool - trả về kết quả trực tiếp
        if (params.action === "execute_tool" && result.success) {
          // Nếu tool trả về MCP format, sử dụng trực tiếp
          if (
            result.data &&
            typeof result.data === "object" &&
            result.data.content
          ) {
            return result.data;
          }

          // Nếu không, wrap trong MCP format
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result.data, null, 2),
              },
            ],
          };
        }

        // Cho các actions khác, trả về format Universal Tool
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error: `Lỗi trong universalMemory: ${
                    (error as Error).message
                  }`,
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

  // Tool giới thiệu về Memory MCP
  server.tool(
    "introduction",
    "Giới thiệu về Memory MCP Server",
    {},
    async () => {
      return {
        content: [
          {
            type: "text",
            text: `# 🧠 Memory MCP Server

## Giới thiệu

Memory MCP Server là một hệ thống lưu trữ và truy xuất thông tin chuyên dụng cho AI.

## 🚀 Universal Memory Tool

Chỉ cần sử dụng **1 tool duy nhất**: \`universalMemory\`

### 📝 Các Actions có sẵn:

#### Memory Operations:
- **store**: Lưu trữ thông tin
- **retrieve**: Truy xuất thông tin
- **search**: Tìm kiếm thông tin
- **list**: Liệt kê tất cả
- **delete**: Xóa thông tin
- **update**: Cập nhật thông tin
- **clear_all**: Xóa sạch tất cả entries
- **reset**: Reset toàn bộ hệ thống

#### Tool Operations:
- **create_tool**: Tạo tool tùy chỉnh
- **create_api_tool**: Tạo API tool với template
- **execute_tool**: Thực thi tool bằng ID/name
- **list_tools**: Liệt kê tất cả tools
- **delete_tool**: Xóa tool
- **clear_tools**: Xóa sạch tất cả tools

#### Analysis & Data:
- **analyze**: Phân tích dữ liệu
- **export**: Xuất dữ liệu
- **import**: Nhập dữ liệu

## 💡 Ví dụ sử dụng:

### Lưu trữ thông tin:
\`\`\`
universalMemory(action: "store", key: "user_preferences", value: {...}, type: "json")
\`\`\`

### Truy xuất thông tin:
\`\`\`
universalMemory(action: "retrieve", key: "user_preferences")
\`\`\`

### Tạo tool tùy chỉnh:
\`\`\`
universalMemory(action: "create_tool", toolName: "notekeeper", ...)
\`\`\`

### Tạo API tool:
\`\`\`
universalMemory(action: "create_api_tool", toolName: "weatherAPI", apiUrl: "https://api.weather.com/v1/current", apiMethod: "GET", apiHeaders: {"X-API-Key": "your-key"})
\`\`\`

### Thực thi tool:
\`\`\`
universalMemory(action: "execute_tool", toolName: "notekeeper", args: {...})
\`\`\`

## ✨ Tính năng:

- 💾 **Persistent Storage**: Dữ liệu được lưu trên disk
- 🔍 **Full-text Search**: Tìm kiếm trong tất cả dữ liệu
- 🏷️ **Tags & Metadata**: Phân loại và quản lý
- 📊 **Analytics**: Phân tích usage và trends
- 🛠️ **Custom Tools**: Tạo tools riêng cho workflow
- 📤 **Export/Import**: Backup và restore dữ liệu

Hãy bắt đầu với \`universalMemory\` để khám phá tất cả tính năng! 🚀`,
          },
        ],
      };
    }
  );

  // Tool để lấy examples về cách tạo memory tools
  server.tool(
    "getMemoryToolExamples",
    "Lấy examples về cách tạo memory tools đúng cách",
    {},
    async () => {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                examples: {
                  notekeeper: {
                    name: "notekeeper",
                    description: "Tool để lưu và quản lý ghi chú",
                    type: "storage",
                    parameters: {
                      action: {
                        type: "string",
                        description: "add, get, list, delete",
                      },
                      title: { type: "string", description: "Tiêu đề ghi chú" },
                      content: {
                        type: "string",
                        description: "Nội dung ghi chú",
                      },
                      id: { type: "string", description: "ID ghi chú" },
                    },
                    handlerCode: `
const { action, title, content, id } = args;

switch (action) {
  case 'add':
    const noteId = generateId();
    const note = { id: noteId, title, content, createdAt: new Date().toISOString() };
    storage.store(\`note_\${noteId}\`, note, 'json', \`Note: \${title}\`, ['note']);
    return { content: [{ type: "text", text: JSON.stringify({ success: true, noteId, message: "Ghi chú đã được lưu" }, null, 2) }] };
    
  case 'get':
    const retrieved = storage.retrieve(\`note_\${id}\`);
    return { content: [{ type: "text", text: JSON.stringify(retrieved ? retrieved.value : { error: "Không tìm thấy ghi chú" }, null, 2) }] };
    
  case 'list':
    const notes = storage.search('note').map(e => e.value);
    return { content: [{ type: "text", text: JSON.stringify({ notes, count: notes.length }, null, 2) }] };
    
  case 'delete':
    const deleted = storage.delete(\`note_\${id}\`);
    return { content: [{ type: "text", text: JSON.stringify({ success: deleted, message: deleted ? "Đã xóa" : "Không tìm thấy" }, null, 2) }] };
    
  default:
    return { content: [{ type: "text", text: JSON.stringify({ error: "Action không hợp lệ" }, null, 2) }] };
}
`,
                  },

                  taskTracker: {
                    name: "taskTracker",
                    description: "Tool theo dõi công việc",
                    type: "processor",
                    parameters: {
                      action: {
                        type: "string",
                        description: "add, complete, list, stats",
                      },
                      task: { type: "string", description: "Mô tả công việc" },
                      priority: {
                        type: "string",
                        description: "high, medium, low",
                      },
                      id: { type: "string", description: "ID công việc" },
                    },
                    handlerCode: `
const { action, task, priority, id } = args;

switch (action) {
  case 'add':
    const taskId = generateId();
    const newTask = { 
      id: taskId, 
      task, 
      priority: priority || 'medium', 
      status: 'pending',
      createdAt: new Date().toISOString() 
    };
    storage.store(\`task_\${taskId}\`, newTask, 'json', \`Task: \${task}\`, ['task', priority]);
    return { content: [{ type: "text", text: JSON.stringify({ success: true, taskId, task: newTask }, null, 2) }] };
    
  case 'complete':
    const taskEntry = storage.retrieve(\`task_\${id}\`);
    if (taskEntry) {
      taskEntry.value.status = 'completed';
      taskEntry.value.completedAt = new Date().toISOString();
      storage.update(\`task_\${id}\`, taskEntry.value);
      return { content: [{ type: "text", text: JSON.stringify({ success: true, message: "Task đã hoàn thành" }, null, 2) }] };
    }
    return { content: [{ type: "text", text: JSON.stringify({ error: "Không tìm thấy task" }, null, 2) }] };
    
  case 'list':
    const tasks = storage.search('task').map(e => e.value);
    return { content: [{ type: "text", text: JSON.stringify({ tasks, count: tasks.length }, null, 2) }] };
    
  case 'stats':
    const allTasks = storage.search('task').map(e => e.value);
    const stats = {
      total: allTasks.length,
      pending: allTasks.filter(t => t.status === 'pending').length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      byPriority: {
        high: allTasks.filter(t => t.priority === 'high').length,
        medium: allTasks.filter(t => t.priority === 'medium').length,
        low: allTasks.filter(t => t.priority === 'low').length
      }
    };
    return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] };
    
  default:
    return { content: [{ type: "text", text: JSON.stringify({ error: "Action không hợp lệ" }, null, 2) }] };
}
`,
                  },
                },

                apiTool: {
                  name: "weatherAPI",
                  description: "Tool để lấy thông tin thời tiết",
                  type: "processor",
                  createdWith: "create_api_tool",
                  example: {
                    action: "create_api_tool",
                    toolName: "weatherAPI",
                    toolDescription:
                      "Tool để lấy thông tin thời tiết từ OpenWeatherMap",
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
                  description: "Recommended: API tool using fetch with Promise",
                  type: "processor",
                  createdWith: "create_tool",
                  note: "Use create_tool with fetch-based handler code for best compatibility",
                },

                guidelines: `
⚠️ QUAN TRỌNG: Handler code của memory tools PHẢI:

1. Trả về MCP format:
   return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };

2. Sử dụng storage context:
   - storage.store(key, value, type, description, tags)
   - storage.retrieve(key)
   - storage.search(query)
   - storage.delete(key)
   - storage.update(key, value)

3. Sử dụng generateId() để tạo ID unique

4. Xử lý errors properly với try-catch

🚀 KHUYẾN NGHỊ cho API tools:

1. SỬ DỤNG FETCH với PROMISE thay vì async/await:
   return fetch(url, options)
     .then(response => response.json().then(data => ({ response, data })))
     .catch(error => handleError(error));

2. KHÔNG sử dụng async/await trong handler code (sẽ gây lỗi)

3. SỬ DỤNG create_api_tool cho API tools đơn giản
   SỬ DỤNG create_tool với fetch code cho API tools phức tạp

4. Template fetch code mẫu:
   const startTime = Date.now();
   return fetch(url, fetchOptions)
     .then(response => {
       const duration = Date.now() - startTime;
       return response.text().then(text => {
         let data; try { data = JSON.parse(text); } catch { data = text; }
         return { content: [{ type: "text", text: JSON.stringify({ success: response.ok, data, status: response.status, duration }, null, 2) }] };
       });
     })
     .catch(error => ({ content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }] }));
              `,
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
