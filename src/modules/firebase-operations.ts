/**
 * Firebase Operations - Xử lý đồng bộ với Firebase backend
 */
import { UniversalRequest, MemoryEntry, MemoryTool } from "../types/index.js";
import { memoryCore } from "../core/memory-core.js";

// Default Firebase backend URL
const DEFAULT_FIREBASE_BACKEND = "https://tominw.vercel.app/";

/**
 * Firebase Operations Handler
 */
export class FirebaseOperations {
  /**
   * Sync memory entry to Firebase
   */
  static async syncMemoryToFirebase(
    request: UniversalRequest,
    backendUrl: string = DEFAULT_FIREBASE_BACKEND
  ): Promise<any> {
    if (!request.key) {
      throw new Error("Key là bắt buộc để sync memory");
    }

    // Lấy memory entry từ local
    const entry = memoryCore.retrieve(request.key);
    if (!entry) {
      throw new Error(`Memory với key '${request.key}' không tồn tại`);
    }

    try {
      const response = await fetch(`${backendUrl}/api/memory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: entry.key,
          value: entry.value,
          type: entry.type,
          description: entry.description,
          tags: entry.tags,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Memory '${request.key}' đã được sync lên Firebase`,
        firebaseId: result.data.id,
        localEntry: entry,
        firebaseEntry: result.data,
      };
    } catch (error) {
      throw new Error(
        `Lỗi sync memory lên Firebase: ${(error as Error).message}`
      );
    }
  }

  /**
   * Sync tool to Firebase
   */
  static async syncToolToFirebase(
    request: UniversalRequest,
    backendUrl: string = DEFAULT_FIREBASE_BACKEND
  ): Promise<any> {
    if (!request.toolId) {
      throw new Error("Tool ID là bắt buộc để sync tool");
    }

    // Lấy tool từ local
    const tool = memoryCore.getTool(request.toolId);
    if (!tool) {
      throw new Error(`Tool với ID '${request.toolId}' không tồn tại`);
    }

    try {
      const response = await fetch(`${backendUrl}/api/tools`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: tool.name,
          description: tool.description,
          type: tool.type,
          parameters: tool.parameters,
          handlerCode: tool.handlerCode,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Tool '${tool.name}' đã được sync lên Firebase`,
        firebaseId: result.data.id,
        localTool: tool,
        firebaseTool: result.data,
      };
    } catch (error) {
      throw new Error(
        `Lỗi sync tool lên Firebase: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get memory from Firebase
   */
  static async getMemoryFromFirebase(
    request: UniversalRequest,
    backendUrl: string = DEFAULT_FIREBASE_BACKEND
  ): Promise<any> {
    if (!request.firebaseId) {
      throw new Error("Firebase ID là bắt buộc để lấy memory");
    }

    try {
      const response = await fetch(
        `${backendUrl}/api/memory/${request.firebaseId}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Memory không tồn tại trên Firebase");
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Đã lấy memory từ Firebase`,
        data: result.data,
      };
    } catch (error) {
      throw new Error(
        `Lỗi lấy memory từ Firebase: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get tool from Firebase
   */
  static async getToolFromFirebase(
    request: UniversalRequest,
    backendUrl: string = DEFAULT_FIREBASE_BACKEND
  ): Promise<any> {
    if (!request.firebaseId) {
      throw new Error("Firebase ID là bắt buộc để lấy tool");
    }

    try {
      const response = await fetch(
        `${backendUrl}/api/tools/${request.firebaseId}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Tool không tồn tại trên Firebase");
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: `Đã lấy tool từ Firebase`,
        data: result.data,
      };
    } catch (error) {
      throw new Error(`Lỗi lấy tool từ Firebase: ${(error as Error).message}`);
    }
  }

  /**
   * Execute tool from Firebase
   */
  static async executeFirebaseTool(
    request: UniversalRequest,
    backendUrl: string = DEFAULT_FIREBASE_BACKEND
  ): Promise<any> {
    if (!request.firebaseId) {
      throw new Error("Firebase ID là bắt buộc để thực thi tool");
    }

    try {
      // Lấy tool từ Firebase
      const toolResponse = await fetch(
        `${backendUrl}/api/tools/${request.firebaseId}`
      );

      if (!toolResponse.ok) {
        if (toolResponse.status === 404) {
          throw new Error("Tool không tồn tại trên Firebase");
        }
        throw new Error(
          `HTTP ${toolResponse.status}: ${toolResponse.statusText}`
        );
      }

      const toolResult = await toolResponse.json();
      const tool = toolResult.data;

      // Thực thi tool locally với handler code từ Firebase
      try {
        const handlerFunction = new Function(
          "args",
          "storage",
          "generateId",
          "fetch",
          tool.handlerCode
        );

        const result = await handlerFunction(
          request.args || {},
          memoryCore,
          () =>
            Date.now().toString(36) + Math.random().toString(36).substring(2),
          fetch
        );

        return {
          success: true,
          message: `Tool '${tool.name}' từ Firebase đã được thực thi thành công`,
          tool: {
            id: tool.id,
            name: tool.name,
            description: tool.description,
          },
          result,
        };
      } catch (execError) {
        throw new Error(`Lỗi thực thi tool: ${(execError as Error).message}`);
      }
    } catch (error) {
      throw new Error(`Lỗi execute Firebase tool: ${(error as Error).message}`);
    }
  }

  /**
   * Sync all local data to Firebase
   */
  static async syncAllToFirebase(
    backendUrl: string = DEFAULT_FIREBASE_BACKEND
  ): Promise<any> {
    const results = {
      memories: { success: 0, failed: 0, errors: [] as string[] },
      tools: { success: 0, failed: 0, errors: [] as string[] },
    };

    // Sync memories
    const memories = memoryCore.listEntries();
    for (const memory of memories) {
      try {
        await this.syncMemoryToFirebase(
          {
            action: "store",
            key: memory.key,
          },
          backendUrl
        );
        results.memories.success++;
      } catch (error) {
        results.memories.failed++;
        results.memories.errors.push(
          `${memory.key}: ${(error as Error).message}`
        );
      }
    }

    // Sync tools
    const tools = memoryCore.listTools();
    for (const tool of tools) {
      try {
        await this.syncToolToFirebase(
          {
            action: "create_tool",
            toolId: tool.id,
          },
          backendUrl
        );
        results.tools.success++;
      } catch (error) {
        results.tools.failed++;
        results.tools.errors.push(`${tool.name}: ${(error as Error).message}`);
      }
    }

    return {
      success: true,
      message: "Hoàn thành sync tất cả data lên Firebase",
      results,
    };
  }

  /**
   * List all data from Firebase
   */
  static async listFirebaseData(
    backendUrl: string = DEFAULT_FIREBASE_BACKEND
  ): Promise<any> {
    try {
      const [memoriesResponse, toolsResponse] = await Promise.all([
        fetch(`${backendUrl}/api/memory`),
        fetch(`${backendUrl}/api/tools`),
      ]);

      if (!memoriesResponse.ok || !toolsResponse.ok) {
        throw new Error("Lỗi khi lấy data từ Firebase");
      }

      const [memoriesResult, toolsResult] = await Promise.all([
        memoriesResponse.json(),
        toolsResponse.json(),
      ]);

      return {
        success: true,
        message: "Đã lấy tất cả data từ Firebase",
        data: {
          memories: memoriesResult.data || [],
          tools: toolsResult.data || [],
        },
        count: {
          memories: memoriesResult.count || 0,
          tools: toolsResult.count || 0,
        },
      };
    } catch (error) {
      throw new Error(`Lỗi lấy data từ Firebase: ${(error as Error).message}`);
    }
  }
}
