#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { APP_CONFIG } from "./config/config.js";

// Import Memory MCP Server
import { registerMemoryServer } from "./mcp/memory-server.js";

// Global variables for server management
let currentServer: McpServer | null = null;
let currentTransport: StdioServerTransport | null = null;
let isRestarting = false;

/**
 * Tạo và cấu hình server instance
 */
function createServer(): McpServer {
  const server = new McpServer({
    name: APP_CONFIG.NAME,
    version: APP_CONFIG.VERSION,
    capabilities: {
      resources: {},
      tools: {},
    },
  });

  // Đăng ký Memory MCP Server
  registerMemoryServer(server);

  return server;
}

/**
 * Khởi động server
 */
async function startServer(): Promise<void> {
  try {
    if (isRestarting) {
      console.error("🔄 Server đang trong quá trình restart...");
      return;
    }

    currentServer = createServer();
    currentTransport = new StdioServerTransport();

    await currentServer.connect(currentTransport);
    console.error(
      `✅ ${APP_CONFIG.NAME} v${APP_CONFIG.VERSION} đang chạy trên stdio`
    );
  } catch (error) {
    console.error("❌ Lỗi khi khởi động server:", error);
    throw error;
  }
}

/**
 * Dừng server hiện tại
 */
async function stopServer(): Promise<void> {
  try {
    if (currentTransport) {
      // Gracefully close transport
      await currentTransport.close?.();
      currentTransport = null;
    }

    if (currentServer) {
      // Close server
      await currentServer.close?.();
      currentServer = null;
    }

    console.error("🛑 Server đã được dừng");
  } catch (error) {
    console.error("❌ Lỗi khi dừng server:", error);
  }
}

/**
 * Hot-reload memory server mà không restart connection
 */
export async function hotReloadMemoryServer(): Promise<void> {
  if (isRestarting) {
    console.error("⚠️ Server đang reload, vui lòng đợi...");
    return;
  }

  try {
    isRestarting = true;
    console.error("🔄 Hot-reloading memory server...");

    if (currentServer) {
      // Re-register memory server vào server hiện tại
      const { registerMemoryServer } = await import("./mcp/memory-server.js");
      registerMemoryServer(currentServer);

      console.error("✅ Memory server đã được hot-reload thành công!");
    } else {
      console.error("❌ Không có server đang chạy để reload");
    }
  } catch (error) {
    console.error("❌ Lỗi khi hot-reload memory server:", error);
    throw error;
  } finally {
    isRestarting = false;
  }
}

/**
 * Restart server để load memory server mới (chỉ dùng khi cần thiết)
 */
export async function restartServer(): Promise<void> {
  if (isRestarting) {
    console.error("⚠️ Server đang restart, vui lòng đợi...");
    return;
  }

  try {
    isRestarting = true;
    console.error("🔄 Bắt đầu restart server để load memory server mới...");

    // Dừng server hiện tại
    await stopServer();

    // Đợi một chút để đảm bảo cleanup hoàn tất
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Khởi động server mới
    await startServer();

    console.error("✅ Server đã restart thành công!");
  } catch (error) {
    console.error("❌ Lỗi khi restart server:", error);
    throw error;
  } finally {
    isRestarting = false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await startServer();

    // Xử lý graceful shutdown
    process.on("SIGINT", async () => {
      console.error("\n🛑 Nhận tín hiệu SIGINT, đang dừng server...");
      await stopServer();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.error("\n🛑 Nhận tín hiệu SIGTERM, đang dừng server...");
      await stopServer();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Lỗi nghiêm trọng trong main():", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Lỗi nghiêm trọng:", error);
  process.exit(1);
});
