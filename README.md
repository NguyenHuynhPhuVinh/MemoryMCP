# 🌐 TomiNetwork

## 🎯 Giới thiệu

**TomiNetwork** là một hệ thống quản lý thông tin và công cụ thông minh cho AI, được xây dựng trên Model Context Protocol (MCP).

## ✨ Tính năng chính

- 🚀 **Universal Memory Tool**: Một tool duy nhất để rule them all
- 💾 **Persistent Storage**: Dữ liệu được lưu trữ vĩnh viễn trên disk
- 🔍 **Full-text Search**: Tìm kiếm thông minh trong tất cả dữ liệu
- 🏷️ **Tags & Metadata**: Phân loại và quản lý thông tin
- 🛠️ **Custom Tools**: Tạo tools riêng cho workflow cụ thể
- 🔄 **Hot Operations**: Tất cả operations không cần restart

## 🚀 Universal TomiNetwork Tool

Chỉ cần sử dụng **1 tool duy nhất**: `universalMemory_TomiNetwork`

### 📝 Actions có sẵn:

#### Memory Operations:

- `store`: Lưu trữ thông tin
- `retrieve`: Truy xuất thông tin
- `search`: Tìm kiếm thông tin
- `list`: Liệt kê tất cả entries
- `delete`: Xóa thông tin
- `update`: Cập nhật thông tin
- `clear_all`: Xóa sạch tất cả entries
- `reset`: Reset toàn bộ hệ thống

#### Tool Operations:

- `create_tool`: Tạo tool tùy chỉnh
- `create_api_tool`: Tạo API tool với template
- `execute_tool`: Thực thi tool bằng ID/name
- `list_tools`: Liệt kê tất cả tools
- `delete_tool`: Xóa tool
- `clear_tools`: Xóa sạch tất cả tools

## 💡 Ví dụ sử dụng

### 1. Lưu trữ thông tin cơ bản

```
Tool: universalMemory_TomiNetwork
Parameters:
- action: "store"
- key: "user_preferences"
- value: {"theme": "dark", "language": "vi"}
- type: "json"
- description: "Cài đặt người dùng"
- tags: ["user", "settings"]
```

### 2. Truy xuất thông tin

```
Tool: universalMemory_TomiNetwork
Parameters:
- action: "retrieve"
- key: "user_preferences"
```

### 3. Tìm kiếm thông tin

```
Tool: universalMemory_TomiNetwork
Parameters:
- action: "search"
- query: "user"
- limit: 10
```

### 4. Tạo tool tùy chỉnh để quản lý ghi chú

```
Tool: universalMemory
Parameters:
- action: "create_tool"
- toolName: "notekeeper"
- toolDescription: "Tool để lưu và quản lý ghi chú"
- toolType: "storage"
- parameters: {
    "action": {"type": "string", "description": "add, get, list, delete"},
    "title": {"type": "string", "description": "Tiêu đề ghi chú"},
    "content": {"type": "string", "description": "Nội dung ghi chú"}
  }
- handlerCode: "// JavaScript code để xử lý ghi chú"
```

### 5. Tạo API tool để fetch dữ liệu

```
Tool: universalMemory
Parameters:
- action: "create_api_tool"
- toolName: "weatherAPI"
- toolDescription: "Tool để lấy thông tin thời tiết"
- apiUrl: "https://api.openweathermap.org/data/2.5/weather"
- apiMethod: "GET"
- apiHeaders: {"Content-Type": "application/json"}
- apiAuth: {
    "type": "api-key",
    "apiKey": "your-api-key",
    "apiKeyHeader": "appid"
  }
- apiTimeout: 10000
```

### 6. Sử dụng tool vừa tạo

```
Tool: universalMemory
Parameters:
- action: "execute_tool"
- toolName: "notekeeper"
- args: {"action": "add", "title": "Meeting Notes", "content": "..."}
```

### 7. Sử dụng API tool

```
Tool: universalMemory
Parameters:
- action: "execute_tool"
- toolName: "weatherAPI"
- args: {
    "params": {"q": "Hanoi,VN", "units": "metric"}
  }
```

### 8. Xóa sạch tất cả entries

```
Tool: universalMemory
Parameters:
- action: "clear_all"
```

### 9. Xóa sạch tất cả tools

```
Tool: universalMemory
Parameters:
- action: "clear_tools"
```

### 10. Reset toàn bộ hệ thống

```
Tool: universalMemory
Parameters:
- action: "reset"
```

## 🛠️ Cài đặt và sử dụng

### Cài đặt

```bash
npm install
npm run build
```

### Chạy server

```bash
# Development với MCP inspector
npm run dev

# Production
npm start
```

### Cấu hình với Claude Desktop

Thêm vào `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "memory-mcp": {
      "command": "node",
      "args": ["path/to/build/index.js"]
    }
  }
}
```

## 📁 Cấu trúc dữ liệu

Dữ liệu được lưu trong thư mục `ai-memory/`:

```
ai-memory/
├── entries.json    # Tất cả memory entries
└── tools.json      # Custom tools đã tạo
```

## 🎯 Use Cases

### 1. Personal Knowledge Base

- Lưu trữ thông tin cá nhân
- Ghi chú và ý tưởng
- Bookmarks và references

### 2. Project Management

- Task tracking
- Project notes
- Team information

### 3. Learning & Research

- Study notes
- Research findings
- Learning progress

### 4. AI Workflow Automation

- Custom tools cho tasks cụ thể
- Data processing pipelines
- Automated reporting

## 🔧 Advanced Features

### Custom Tools

Tạo tools riêng với JavaScript code để:

- Xử lý dữ liệu phức tạp
- Tích hợp với external APIs
- Automation workflows
- Data analysis

### API Tools

Tạo API tools nhanh chóng với template có sẵn:

- **Hỗ trợ tất cả HTTP methods**: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- **Authentication**: Bearer token, Basic auth, API key
- **Custom headers**: Tùy chỉnh headers cho từng request
- **Request body**: Hỗ trợ JSON, form data, raw data
- **Query parameters**: Dynamic query params
- **Error handling**: Xử lý lỗi tự động
- **Response formatting**: Format response theo MCP standard

## 🎉 Lợi ích

1. **Đơn giản**: Chỉ 1 tool để làm tất cả
2. **Mạnh mẽ**: Lưu trữ mọi loại dữ liệu
3. **Linh hoạt**: Tạo tools riêng cho nhu cầu cụ thể
4. **Bền vững**: Dữ liệu persistent trên disk
5. **Thông minh**: Full-text search tích hợp
6. **Mở rộng**: Dễ dàng thêm tính năng mới

Memory MCP Server - Biến AI thành một trợ lý có trí nhớ vĩnh viễn! 🧠✨
