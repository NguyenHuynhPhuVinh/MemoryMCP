/**
 * Handler Operations - Các handler functions cho Universal Tool
 */
import { UniversalRequest } from "../types/index.js";
import { MemoryOperations } from "./memory-operations.js";
import { ToolOperations } from "./tool-operations.js";
import { SearchOperations } from "./search-operations.js";
import { FirebaseHelpers } from "./firebase-helpers.js";
import { FirebaseOperations } from "./firebase-operations.js";
import { memoryCore } from "../core/memory-core.js";

/**
 * Handler Operations Class
 */
export class HandlerOperations {
  /**
   * Handle store operation with Firebase sync
   */
  static async handleStore(request: UniversalRequest): Promise<any> {
    // Store locally first
    const localResult = MemoryOperations.store(request);

    // Always sync to Firebase if has "public" tag
    if (request.tags && request.tags.includes("public")) {
      return await FirebaseHelpers.syncMemoryToFirebase(request, localResult);
    }

    return localResult;
  }

  /**
   * Handle retrieve operation with Firebase support
   */
  static async handleRetrieve(request: UniversalRequest): Promise<any> {
    // If has "public" tag, try Firebase first
    if (request.tags && request.tags.includes("public")) {
      const firebaseResult = await FirebaseHelpers.retrieveFromFirebase(
        request
      );
      if (firebaseResult) {
        return firebaseResult;
      }
    }

    // Fallback to local
    return MemoryOperations.retrieve(request);
  }

  /**
   * Handle delete operation with Firebase support
   */
  static async handleDelete(request: UniversalRequest): Promise<any> {
    let localDeleted = false;
    let firebaseDeleted = false;
    const results = [];

    // Delete local first
    try {
      localDeleted = MemoryOperations.delete(request);
      if (localDeleted) {
        results.push("Đã xóa local");
      }
    } catch (error) {
      results.push(`Lỗi xóa local: ${(error as Error).message}`);
    }

    // If has "public" tag, delete from Firebase
    if (request.tags && request.tags.includes("public")) {
      const firebaseResult = await FirebaseHelpers.deleteMemoryFromFirebase(
        request
      );
      if (firebaseResult.success) {
        firebaseDeleted = true;
      }
      results.push(firebaseResult.message);
    }

    return {
      success: localDeleted || firebaseDeleted,
      localDeleted,
      firebaseDeleted,
      results,
      message: results.join(", "),
    };
  }

  /**
   * Handle create tool operation with Firebase sync
   */
  static async handleCreateTool(request: UniversalRequest): Promise<any> {
    // Create tool locally first
    const localResult = ToolOperations.createTool(request);

    // Always sync to Firebase if has "public" tag
    if (request.tags && request.tags.includes("public")) {
      return await FirebaseHelpers.syncToolToFirebase(request, localResult);
    }

    return localResult;
  }

  /**
   * Handle delete tool operation with Firebase support
   */
  static async handleDeleteTool(request: UniversalRequest): Promise<any> {
    let localDeleted = false;
    let firebaseDeleted = false;
    const results = [];

    // Delete local first
    try {
      localDeleted = ToolOperations.deleteTool(request);
      if (localDeleted) {
        results.push("Đã xóa tool local");
      }
    } catch (error) {
      results.push(`Lỗi xóa tool local: ${(error as Error).message}`);
    }

    // If has "public" tag, delete from Firebase
    if (request.tags && request.tags.includes("public")) {
      const firebaseResult = await FirebaseHelpers.deleteToolFromFirebase(
        request
      );
      if (firebaseResult.success) {
        firebaseDeleted = true;
      }
      results.push(firebaseResult.message);
    }

    return {
      success: localDeleted || firebaseDeleted,
      localDeleted,
      firebaseDeleted,
      results,
      message: results.join(", "),
    };
  }

  /**
   * Handle execute tool operation with Firebase support
   */
  static async handleExecuteTool(request: UniversalRequest): Promise<any> {
    // First try to execute local tool
    const localTool = memoryCore.getTool(request.toolId!);

    if (localTool) {
      // Execute local tool
      return await ToolOperations.executeTool(request);
    } else {
      // Tool not found locally, try Firebase if toolId looks like Firebase ID
      try {
        const backendUrl = FirebaseHelpers.getBackendUrl(request);
        return await FirebaseOperations.executeFirebaseTool(
          {
            ...request,
            firebaseId: request.toolId,
          },
          backendUrl
        );
      } catch (error) {
        throw new Error(
          `Tool '${
            request.toolId
          }' không tồn tại local và không thể thực thi từ Firebase: ${
            (error as Error).message
          }`
        );
      }
    }
  }

  /**
   * Handle search operation
   */
  static handleSearch(request: UniversalRequest): any {
    return SearchOperations.search(request);
  }

  /**
   * Handle list operation with Firebase support and pagination
   */
  static async handleList(request: UniversalRequest): Promise<any> {
    const page = (request as any).page || 1;
    const limit = (request as any).limit || 10;
    const offset = (page - 1) * limit;

    let localResult = SearchOperations.listEntries();
    let localEntries = Array.isArray(localResult)
      ? localResult
      : localResult.items || [];
    let firebaseEntries: any[] = [];
    let totalLocal = localEntries.length;
    let totalFirebase = 0;

    // If has "public" tag, get Firebase data
    if (request.tags && request.tags.includes("public")) {
      try {
        const backendUrl = FirebaseHelpers.getBackendUrl(request);
        const firebaseData = await FirebaseOperations.listFirebaseData(
          backendUrl
        );
        firebaseEntries = firebaseData.data.memories.map((m: any) => ({
          ...m,
          source: "firebase",
        }));
        totalFirebase = firebaseEntries.length;
      } catch (error) {
        console.warn(`Lỗi lấy data từ Firebase: ${(error as Error).message}`);
      }
    }

    // Combine and deduplicate entries (prefer Firebase version if exists)
    const combinedEntries = [...firebaseEntries];
    const firebaseKeys = new Set(firebaseEntries.map((e: any) => e.key));

    localEntries.forEach((entry) => {
      if (!firebaseKeys.has(entry.key)) {
        combinedEntries.push({
          ...entry,
          source: "local",
        });
      }
    });

    // Sort by updatedAt desc
    combinedEntries.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    // Apply pagination
    const paginatedEntries = combinedEntries.slice(offset, offset + limit);
    const totalEntries = combinedEntries.length;
    const totalPages = Math.ceil(totalEntries / limit);

    return {
      items: paginatedEntries,
      pagination: {
        page,
        limit,
        total: totalEntries,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      sources: {
        local: totalLocal,
        firebase: totalFirebase,
        combined: totalEntries,
      },
      type: "entries",
    };
  }

  /**
   * Handle update operation with Firebase sync
   */
  static async handleUpdate(request: UniversalRequest): Promise<any> {
    // Update locally first
    const localResult = MemoryOperations.update(request);

    // If has "public" tag and update successful, sync to Firebase
    if (localResult && request.tags && request.tags.includes("public")) {
      try {
        const backendUrl = FirebaseHelpers.getBackendUrl(request);
        await FirebaseHelpers.syncMemoryToFirebase(request, localResult);
        return {
          ...localResult,
          firebaseSync: true,
          message: `Memory đã được cập nhật local và sync lên Firebase`,
        };
      } catch (error) {
        return {
          ...localResult,
          firebaseSync: false,
          firebaseError: (error as Error).message,
          message: `Memory đã được cập nhật local nhưng lỗi sync Firebase: ${
            (error as Error).message
          }`,
        };
      }
    }

    return localResult;
  }

  /**
   * Handle create API tool operation with Firebase sync
   */
  static async handleCreateApiTool(request: UniversalRequest): Promise<any> {
    // Create API tool locally first
    const localResult = ToolOperations.createApiTool(request);

    // Always sync to Firebase if has "public" tag
    if (request.tags && request.tags.includes("public")) {
      return await FirebaseHelpers.syncToolToFirebase(request, localResult);
    }

    return localResult;
  }

  /**
   * Handle list tools operation with Firebase support and pagination
   */
  static async handleListTools(request: UniversalRequest): Promise<any> {
    const page = (request as any).page || 1;
    const limit = (request as any).limit || 10;
    const offset = (page - 1) * limit;

    let localTools = ToolOperations.listTools();
    let firebaseTools: any[] = [];
    let totalLocal = localTools.length;
    let totalFirebase = 0;

    // If has "public" tag, get Firebase tools
    if (request.tags && request.tags.includes("public")) {
      try {
        const backendUrl = FirebaseHelpers.getBackendUrl(request);
        const firebaseData = await FirebaseOperations.listFirebaseData(
          backendUrl
        );
        firebaseTools = firebaseData.data.tools.map((t: any) => ({
          ...t,
          source: "firebase",
        }));
        totalFirebase = firebaseTools.length;
      } catch (error) {
        console.warn(`Lỗi lấy tools từ Firebase: ${(error as Error).message}`);
      }
    }

    // Combine and deduplicate tools (prefer Firebase version if exists)
    const combinedTools = [...firebaseTools];
    const firebaseIds = new Set(firebaseTools.map((t: any) => t.id));
    const firebaseNames = new Set(firebaseTools.map((t: any) => t.name));

    localTools.forEach((tool: any) => {
      if (!firebaseIds.has(tool.id) && !firebaseNames.has(tool.name)) {
        combinedTools.push({
          ...tool,
          source: "local",
        });
      }
    });

    // Sort by createdAt desc
    combinedTools.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination
    const paginatedTools = combinedTools.slice(offset, offset + limit);
    const totalTools = combinedTools.length;
    const totalPages = Math.ceil(totalTools / limit);

    return {
      items: paginatedTools,
      pagination: {
        page,
        limit,
        total: totalTools,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      sources: {
        local: totalLocal,
        firebase: totalFirebase,
        combined: totalTools,
      },
      type: "tools",
    };
  }

  /**
   * Handle clear all operation with Firebase support
   */
  static async handleClearAll(request: UniversalRequest): Promise<any> {
    let localCleared = 0;
    let firebaseCleared = 0;
    const results = [];

    // Clear local first
    try {
      const localResult = MemoryOperations.clearAll();
      localCleared = localResult.cleared;
      results.push(`Đã xóa ${localCleared} entries local`);
    } catch (error) {
      results.push(`Lỗi xóa local: ${(error as Error).message}`);
    }

    // If has "public" tag, clear Firebase memories
    if (request.tags && request.tags.includes("public")) {
      try {
        const backendUrl = FirebaseHelpers.getBackendUrl(request);
        const firebaseData = await FirebaseOperations.listFirebaseData(
          backendUrl
        );

        for (const memory of firebaseData.data.memories) {
          try {
            const response = await fetch(
              `${backendUrl}/api/memory/${memory.id}`,
              {
                method: "DELETE",
              }
            );
            if (response.ok) {
              firebaseCleared++;
            }
          } catch (error) {
            console.warn(
              `Lỗi xóa memory Firebase ${memory.id}: ${
                (error as Error).message
              }`
            );
          }
        }

        results.push(`Đã xóa ${firebaseCleared} entries Firebase`);
      } catch (error) {
        results.push(`Lỗi xóa Firebase: ${(error as Error).message}`);
      }
    }

    return {
      cleared: localCleared + firebaseCleared,
      localCleared,
      firebaseCleared,
      results,
      message: results.join(", "),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle clear tools operation with Firebase support
   */
  static async handleClearTools(request: UniversalRequest): Promise<any> {
    let localCleared = 0;
    let firebaseCleared = 0;
    const results = [];

    // Clear local tools first
    try {
      const localResult = ToolOperations.clearAllTools();
      localCleared = localResult.cleared;
      results.push(`Đã xóa ${localCleared} tools local`);
    } catch (error) {
      results.push(`Lỗi xóa tools local: ${(error as Error).message}`);
    }

    // If has "public" tag, clear Firebase tools
    if (request.tags && request.tags.includes("public")) {
      try {
        const backendUrl = FirebaseHelpers.getBackendUrl(request);
        const firebaseData = await FirebaseOperations.listFirebaseData(
          backendUrl
        );

        for (const tool of firebaseData.data.tools) {
          try {
            const response = await fetch(`${backendUrl}/api/tools/${tool.id}`, {
              method: "DELETE",
            });
            if (response.ok) {
              firebaseCleared++;
            }
          } catch (error) {
            console.warn(
              `Lỗi xóa tool Firebase ${tool.id}: ${(error as Error).message}`
            );
          }
        }

        results.push(`Đã xóa ${firebaseCleared} tools Firebase`);
      } catch (error) {
        results.push(`Lỗi xóa tools Firebase: ${(error as Error).message}`);
      }
    }

    return {
      cleared: localCleared + firebaseCleared,
      localCleared,
      firebaseCleared,
      results,
      message: results.join(", "),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle reset operation with Firebase support
   */
  static async handleReset(request: UniversalRequest): Promise<any> {
    let localResult = { entriesCleared: 0, toolsCleared: 0 };
    let firebaseEntriesCleared = 0;
    let firebaseToolsCleared = 0;
    const results = [];

    // Reset local first
    try {
      localResult = memoryCore.resetAll();
      results.push(
        `Local: ${localResult.entriesCleared} entries, ${localResult.toolsCleared} tools`
      );
    } catch (error) {
      results.push(`Lỗi reset local: ${(error as Error).message}`);
    }

    // If has "public" tag, reset Firebase
    if (request.tags && request.tags.includes("public")) {
      try {
        const backendUrl = FirebaseHelpers.getBackendUrl(request);
        const firebaseData = await FirebaseOperations.listFirebaseData(
          backendUrl
        );

        // Clear Firebase memories
        for (const memory of firebaseData.data.memories) {
          try {
            const response = await fetch(
              `${backendUrl}/api/memory/${memory.id}`,
              {
                method: "DELETE",
              }
            );
            if (response.ok) {
              firebaseEntriesCleared++;
            }
          } catch (error) {
            console.warn(
              `Lỗi xóa memory Firebase ${memory.id}: ${
                (error as Error).message
              }`
            );
          }
        }

        // Clear Firebase tools
        for (const tool of firebaseData.data.tools) {
          try {
            const response = await fetch(`${backendUrl}/api/tools/${tool.id}`, {
              method: "DELETE",
            });
            if (response.ok) {
              firebaseToolsCleared++;
            }
          } catch (error) {
            console.warn(
              `Lỗi xóa tool Firebase ${tool.id}: ${(error as Error).message}`
            );
          }
        }

        results.push(
          `Firebase: ${firebaseEntriesCleared} entries, ${firebaseToolsCleared} tools`
        );
      } catch (error) {
        results.push(`Lỗi reset Firebase: ${(error as Error).message}`);
      }
    }

    return {
      entriesCleared: localResult.entriesCleared + firebaseEntriesCleared,
      toolsCleared: localResult.toolsCleared + firebaseToolsCleared,
      localEntriesCleared: localResult.entriesCleared,
      localToolsCleared: localResult.toolsCleared,
      firebaseEntriesCleared,
      firebaseToolsCleared,
      results,
      message: results.join(", "),
      timestamp: new Date().toISOString(),
    };
  }
}
