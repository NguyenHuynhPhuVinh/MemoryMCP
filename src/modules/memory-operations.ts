/**
 * Memory Operations Module - Xử lý các thao tác memory cơ bản
 */
import { MemoryEntry, UniversalRequest } from "../types/index.js";
import { memoryCore } from "../core/memory-core.js";
import { ValidationUtils, ErrorUtils } from "../core/utilities.js";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../core/constants.js";

/**
 * Memory Operations Handler
 */
export class MemoryOperations {
  /**
   * Store operation - Lưu trữ thông tin
   */
  static store(request: UniversalRequest): MemoryEntry {
    // Validate required fields
    const validation = ValidationUtils.validateRequired({
      key: request.key,
      value: request.value,
    });

    if (!validation.valid) {
      throw ErrorUtils.createValidationError("store", validation.error!);
    }

    // Validate key format
    const keyValidation = ValidationUtils.validateKey(request.key!);
    if (!keyValidation.valid) {
      throw ErrorUtils.createValidationError("key", keyValidation.error!);
    }

    return memoryCore.store(
      request.key!,
      request.value,
      request.type || "text",
      request.description,
      request.tags
    );
  }

  /**
   * Retrieve operation - Truy xuất thông tin
   */
  static retrieve(request: UniversalRequest): MemoryEntry | null {
    if (!request.key) {
      throw ErrorUtils.createError(ERROR_MESSAGES.KEY_REQUIRED);
    }

    const keyValidation = ValidationUtils.validateKey(request.key);
    if (!keyValidation.valid) {
      throw ErrorUtils.createValidationError("key", keyValidation.error!);
    }

    return memoryCore.retrieve(request.key);
  }

  /**
   * Update operation - Cập nhật thông tin
   */
  static update(request: UniversalRequest): MemoryEntry | null {
    // Validate required fields
    const validation = ValidationUtils.validateRequired({
      key: request.key,
      value: request.value,
    });

    if (!validation.valid) {
      throw ErrorUtils.createValidationError("update", validation.error!);
    }

    // Validate key format
    const keyValidation = ValidationUtils.validateKey(request.key!);
    if (!keyValidation.valid) {
      throw ErrorUtils.createValidationError("key", keyValidation.error!);
    }

    return memoryCore.update(
      request.key!,
      request.value,
      request.description,
      request.tags
    );
  }

  /**
   * Delete operation - Xóa thông tin
   */
  static delete(request: UniversalRequest): boolean {
    if (!request.key) {
      throw ErrorUtils.createError(ERROR_MESSAGES.KEY_REQUIRED);
    }

    const keyValidation = ValidationUtils.validateKey(request.key);
    if (!keyValidation.valid) {
      throw ErrorUtils.createValidationError("key", keyValidation.error!);
    }

    return memoryCore.delete(request.key);
  }

  /**
   * Clear all entries - Xóa sạch tất cả entries
   */
  static clearAll(): { cleared: number; timestamp: string } {
    return memoryCore.clearAllEntries();
  }

  /**
   * Get memory statistics
   */
  static getStats(): {
    totalEntries: number;
    totalSize: number;
    oldestEntry?: MemoryEntry;
    newestEntry?: MemoryEntry;
    mostAccessedEntry?: MemoryEntry;
  } {
    const entries = memoryCore.listEntries();
    
    if (entries.length === 0) {
      return {
        totalEntries: 0,
        totalSize: 0,
      };
    }

    // Calculate total size
    const totalSize = JSON.stringify(entries).length;

    // Find oldest and newest entries
    const sortedByCreated = [...entries].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const oldestEntry = sortedByCreated[0];
    const newestEntry = sortedByCreated[sortedByCreated.length - 1];

    // Find most accessed entry
    const mostAccessedEntry = [...entries].sort(
      (a, b) => b.accessCount - a.accessCount
    )[0];

    return {
      totalEntries: entries.length,
      totalSize,
      oldestEntry,
      newestEntry,
      mostAccessedEntry,
    };
  }

  /**
   * Get entries by type
   */
  static getEntriesByType(type: MemoryEntry["type"]): MemoryEntry[] {
    const entries = memoryCore.listEntries();
    return entries.filter(entry => entry.type === type);
  }

  /**
   * Get entries by tags
   */
  static getEntriesByTags(tags: string[]): MemoryEntry[] {
    const entries = memoryCore.listEntries();
    return entries.filter(entry => 
      entry.tags && tags.some(tag => entry.tags!.includes(tag))
    );
  }

  /**
   * Get recently accessed entries
   */
  static getRecentlyAccessed(limit: number = 10): MemoryEntry[] {
    const entries = memoryCore.listEntries();
    return entries
      .filter(entry => entry.accessCount > 0)
      .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
      .slice(0, limit);
  }

  /**
   * Get recently updated entries
   */
  static getRecentlyUpdated(limit: number = 10): MemoryEntry[] {
    const entries = memoryCore.listEntries();
    return entries
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }

  /**
   * Validate entry data
   */
  static validateEntry(entry: Partial<MemoryEntry>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!entry.key) {
      errors.push("Key is required");
    } else {
      const keyValidation = ValidationUtils.validateKey(entry.key);
      if (!keyValidation.valid) {
        errors.push(`Key validation failed: ${keyValidation.error}`);
      }
    }

    if (entry.value === undefined || entry.value === null) {
      errors.push("Value is required");
    }

    if (entry.type && !["text", "json", "list", "counter", "custom"].includes(entry.type)) {
      errors.push("Invalid entry type");
    }

    if (entry.tags && !Array.isArray(entry.tags)) {
      errors.push("Tags must be an array");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Backup entries to object
   */
  static backup(): {
    entries: MemoryEntry[];
    timestamp: string;
    version: string;
  } {
    return {
      entries: memoryCore.listEntries(),
      timestamp: new Date().toISOString(),
      version: "2.0.0",
    };
  }

  /**
   * Restore entries from backup
   */
  static restore(backup: {
    entries: MemoryEntry[];
    timestamp: string;
    version: string;
  }): { restored: number; skipped: number; errors: string[] } {
    const result = {
      restored: 0,
      skipped: 0,
      errors: [] as string[],
    };

    if (!backup.entries || !Array.isArray(backup.entries)) {
      result.errors.push("Invalid backup format: entries must be an array");
      return result;
    }

    for (const entry of backup.entries) {
      try {
        const validation = this.validateEntry(entry);
        if (!validation.valid) {
          result.errors.push(`Skipped entry ${entry.key}: ${validation.errors.join(", ")}`);
          result.skipped++;
          continue;
        }

        memoryCore.store(
          entry.key!,
          entry.value,
          entry.type || "text",
          entry.description,
          entry.tags
        );
        result.restored++;
      } catch (error) {
        result.errors.push(`Failed to restore entry ${entry.key}: ${ErrorUtils.handleError(error)}`);
        result.skipped++;
      }
    }

    return result;
  }
}
