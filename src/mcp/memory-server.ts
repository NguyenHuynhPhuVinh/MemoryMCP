/**
 * TomiNetwork MCP Server - Server quản lý thông tin và công cụ thông minh cho AI
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerUniversalMemoryTool } from "../tools/universal-memory-tool.js";
import { registerIntroductionTool } from "../tools/introduction-tool.js";
import { registerExamplesTool } from "../tools/examples-tool.js";

/**
 * Đăng ký tất cả TomiNetwork Tools
 */
export function registerMemoryServer(server: McpServer) {
  // Đăng ký Universal Memory Tool
  registerUniversalMemoryTool(server);

  // Đăng ký Introduction Tool
  registerIntroductionTool(server);

  // Đăng ký Examples Tool
  registerExamplesTool(server);
}
