# 🧠 Memory MCP Server

## 🎯 Giới thiệu

**Memory MCP Server** là một hệ thống lưu trữ và truy xuất thông tin chuyên dụng cho AI, được xây dựng trên Model Context Protocol (MCP).

## ✨ Tính năng chính

- 🚀 **Universal Memory Tool**: Một tool duy nhất để rule them all
- 💾 **Persistent Storage**: Dữ liệu được lưu trữ vĩnh viễn trên disk
- 🔍 **Full-text Search**: Tìm kiếm thông minh trong tất cả dữ liệu
- 🏷️ **Tags & Metadata**: Phân loại và quản lý thông tin
- 🛠️ **Custom Tools**: Tạo tools riêng cho workflow cụ thể
- 📊 **Analytics**: Phân tích usage patterns và trends
- 📤 **Export/Import**: Backup và restore dữ liệu
- 🔄 **Hot Operations**: Tất cả operations không cần restart

## 🚀 Universal Memory Tool

Chỉ cần sử dụng **1 tool duy nhất**: `universalMemory`

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
- `execute_tool`: Thực thi tool bằng ID/name
- `list_tools`: Liệt kê tất cả tools
- `delete_tool`: Xóa tool
- `clear_tools`: Xóa sạch tất cả tools

#### Analysis & Data:

- `analyze`: Phân tích dữ liệu
- `export`: Xuất dữ liệu
- `import`: Nhập dữ liệu

## 💡 Ví dụ sử dụng

### 1. Lưu trữ thông tin cơ bản

```
Tool: universalMemory
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
Tool: universalMemory
Parameters:
- action: "retrieve"
- key: "user_preferences"
```

### 3. Tìm kiếm thông tin

```
Tool: universalMemory
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

### 5. Sử dụng tool vừa tạo

```
Tool: universalMemory
Parameters:
- action: "execute_tool"
- toolName: "notekeeper"
- args: {"action": "add", "title": "Meeting Notes", "content": "..."}
```

### 6. Phân tích dữ liệu

```
Tool: universalMemory
Parameters:
- action: "analyze"
- analysisType: "summary"
```

### 7. Xóa sạch tất cả entries

```
Tool: universalMemory
Parameters:
- action: "clear_all"
```

### 8. Xóa sạch tất cả tools

```
Tool: universalMemory
Parameters:
- action: "clear_tools"
```

### 9. Reset toàn bộ hệ thống

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

### Analytics

Phân tích patterns và trends:

- Usage statistics
- Access patterns
- Data relationships
- Performance metrics

### Export/Import

Backup và migrate dữ liệu:

- JSON format cho full backup
- CSV format cho analysis
- TXT format cho human-readable

## 🎉 Lợi ích

1. **Đơn giản**: Chỉ 1 tool để làm tất cả
2. **Mạnh mẽ**: Lưu trữ mọi loại dữ liệu
3. **Linh hoạt**: Tạo tools riêng cho nhu cầu cụ thể
4. **Bền vững**: Dữ liệu persistent trên disk
5. **Thông minh**: Search và analytics tích hợp
6. **Mở rộng**: Dễ dàng thêm tính năng mới

Memory MCP Server - Biến AI thành một trợ lý có trí nhớ vĩnh viễn! 🧠✨
