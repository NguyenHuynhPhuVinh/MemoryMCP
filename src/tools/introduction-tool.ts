/**
 * Introduction Tool - Tool giới thiệu về TomiNetwork
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL_NAMES } from "../core/constants.js";

/**
 * Đăng ký Introduction Tool
 */
export function registerIntroductionTool(server: McpServer) {
  server.tool(
    TOOL_NAMES.INTRODUCTION,
    "Giới thiệu về TomiNetwork",
    {},
    async () => {
      return {
        content: [
          {
            type: "text",
            text: `# 🌐 TomiNetwork

## Giới thiệu

TomiNetwork là một hệ thống quản lý thông tin và công cụ thông minh cho AI.

## 🚀 Universal TomiNetwork Tool

Chỉ cần sử dụng **1 tool duy nhất**: \`TomiNetwork\`

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

## 📝 Ví dụ sử dụng:

### Lưu trữ thông tin:
\`\`\`
TomiNetwork(action: "store", key: "user_preferences", value: {...}, type: "json")
\`\`\`

### Truy xuất thông tin:
\`\`\`
TomiNetwork(action: "retrieve", key: "user_preferences")
\`\`\`

### Tạo tool tùy chỉnh:
\`\`\`
TomiNetwork(action: "create_tool", toolName: "notekeeper", ...)
\`\`\`

### Tạo API tool:
\`\`\`
TomiNetwork(action: "create_api_tool", toolName: "weatherAPI", apiUrl: "https://api.weather.com/v1/current", apiMethod: "GET", apiHeaders: {"X-API-Key": "your-key"})
\`\`\`

### Thực thi tool:
\`\`\`
TomiNetwork(action: "execute_tool", toolName: "notekeeper", args: {...})
\`\`\`

## ✨ Tính năng:

- 💾 **Persistent Storage**: Dữ liệu được lưu trên disk
- 🔍 **Full-text Search**: Tìm kiếm trong tất cả dữ liệu
- 🏷️ **Tags & Metadata**: Phân loại và quản lý
- 🛠️ **Custom Tools**: Tạo tools riêng cho workflow
- 🔄 **Hot Operations**: Tất cả operations không cần restart

## 🎯 Lợi ích:

1. **Đơn giản**: Chỉ 1 tool để làm tất cả
2. **Mạnh mẽ**: Lưu trữ mọi loại dữ liệu
3. **Linh hoạt**: Tạo tools riêng cho nhu cầu cụ thể
4. **Bền vững**: Dữ liệu persistent trên disk
5. **Thông minh**: Full-text search tích hợp
6. **Mở rộng**: Dễ dàng thêm tính năng mới

Hãy bắt đầu với \`TomiNetwork\` để khám phá tất cả tính năng! 🚀`,
          },
        ],
      };
    }
  );
}
