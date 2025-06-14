/**
 * Firebase Helpers - Các helper functions cho Firebase operations
 */
import { UniversalRequest } from "../types/index.js";
import { FirebaseOperations } from "./firebase-operations.js";

/**
 * Firebase Helper Class
 */
export class FirebaseHelpers {
  /**
   * Check if tags contain "public" or "firebase"
   */
  static isFirebaseEnabled(tags?: string[]): boolean {
    return tags ? (tags.includes("public") || tags.includes("firebase")) : false;
  }

  /**
   * Get Firebase backend URL from request
   */
  static getBackendUrl(request: UniversalRequest): string {
    return request.firebaseBackendUrl || "http://localhost:3001";
  }

  /**
   * Handle Firebase memory retrieval
   */
  static async retrieveFromFirebase(
    request: UniversalRequest
  ): Promise<any | null> {
    try {
      const backendUrl = this.getBackendUrl(request);
      const firebaseData = await FirebaseOperations.listFirebaseData(backendUrl);
      const firebaseMemory = firebaseData.data.memories.find(
        (m: any) => m.key === request.key
      );

      if (firebaseMemory) {
        return {
          ...firebaseMemory,
          source: "firebase",
          message: `Đã lấy từ Firebase: ${request.key}`,
        };
      }
      return null;
    } catch (error) {
      console.warn(`Lỗi lấy từ Firebase: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Handle Firebase memory deletion
   */
  static async deleteMemoryFromFirebase(
    request: UniversalRequest
  ): Promise<{ success: boolean; message: string }> {
    try {
      const backendUrl = this.getBackendUrl(request);
      const firebaseData = await FirebaseOperations.listFirebaseData(backendUrl);
      const firebaseMemory = firebaseData.data.memories.find(
        (m: any) => m.key === request.key
      );

      if (firebaseMemory) {
        const response = await fetch(
          `${backendUrl}/api/memory/${firebaseMemory.id}`,
          { method: "DELETE" }
        );

        if (response.ok) {
          return { success: true, message: "Đã xóa Firebase" };
        } else {
          return { success: false, message: `Lỗi xóa Firebase: ${response.statusText}` };
        }
      } else {
        return { success: false, message: "Không tìm thấy trên Firebase" };
      }
    } catch (error) {
      return { success: false, message: `Lỗi xóa Firebase: ${(error as Error).message}` };
    }
  }

  /**
   * Handle Firebase tool deletion
   */
  static async deleteToolFromFirebase(
    request: UniversalRequest
  ): Promise<{ success: boolean; message: string }> {
    try {
      const backendUrl = this.getBackendUrl(request);
      const firebaseData = await FirebaseOperations.listFirebaseData(backendUrl);
      const firebaseTool = firebaseData.data.tools.find(
        (t: any) => t.id === request.toolId || t.name === request.toolName
      );

      if (firebaseTool) {
        const response = await fetch(
          `${backendUrl}/api/tools/${firebaseTool.id}`,
          { method: "DELETE" }
        );

        if (response.ok) {
          return { success: true, message: "Đã xóa tool Firebase" };
        } else {
          return { success: false, message: `Lỗi xóa tool Firebase: ${response.statusText}` };
        }
      } else {
        return { success: false, message: "Không tìm thấy tool trên Firebase" };
      }
    } catch (error) {
      return { success: false, message: `Lỗi xóa tool Firebase: ${(error as Error).message}` };
    }
  }

  /**
   * Handle Firebase memory sync during store
   */
  static async syncMemoryToFirebase(
    request: UniversalRequest,
    localResult: any
  ): Promise<any> {
    try {
      const backendUrl = this.getBackendUrl(request);
      await FirebaseOperations.syncMemoryToFirebase(request, backendUrl);
      return {
        ...localResult,
        firebaseSync: true,
        message: `Memory đã được lưu local và sync lên Firebase`,
      };
    } catch (error) {
      return {
        ...localResult,
        firebaseSync: false,
        firebaseError: (error as Error).message,
        message: `Memory đã được lưu local nhưng lỗi sync Firebase: ${
          (error as Error).message
        }`,
      };
    }
  }

  /**
   * Handle Firebase tool sync during create
   */
  static async syncToolToFirebase(
    request: UniversalRequest,
    localResult: any
  ): Promise<any> {
    try {
      const backendUrl = this.getBackendUrl(request);
      await FirebaseOperations.syncToolToFirebase(
        {
          ...request,
          toolId: localResult.id,
        },
        backendUrl
      );
      return {
        ...localResult,
        firebaseSync: true,
        message: `Tool đã được tạo local và sync lên Firebase`,
      };
    } catch (error) {
      return {
        ...localResult,
        firebaseSync: false,
        firebaseError: (error as Error).message,
        message: `Tool đã được tạo local nhưng lỗi sync Firebase: ${
          (error as Error).message
        }`,
      };
    }
  }
}
