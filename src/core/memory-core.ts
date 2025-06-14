/**
 * Memory Core - Tập trung các functionality chính của Memory MCP
 */
import { MemoryEntry, MemoryTool, UniversalAction } from "../types/index.js";
import { generateId } from "../utils/helpers.js";
import { STORAGE_PATHS } from "./constants.js";
import * as fs from "fs";
import * as path from "path";

// Đường dẫn lưu trữ
const DATA_DIR = path.join(process.cwd(), STORAGE_PATHS.DATA_DIR);
const MEMORY_FILE = path.join(DATA_DIR, STORAGE_PATHS.MEMORY_FILE);
const TOOLS_FILE = path.join(DATA_DIR, STORAGE_PATHS.TOOLS_FILE);

/**
 * Đảm bảo thư mục data tồn tại
 */
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Memory Core Class - Quản lý tất cả memory operations
 */
export class MemoryCore {
  private entries: Map<string, MemoryEntry> = new Map();
  private tools: Map<string, MemoryTool> = new Map();

  constructor() {
    this.loadFromDisk();
  }

  // ========== LIFECYCLE METHODS ==========

  /**
   * Load data từ disk
   */
  private loadFromDisk(): void {
    try {
      ensureDataDir();

      // Load entries
      if (fs.existsSync(MEMORY_FILE)) {
        const entriesData = fs.readFileSync(MEMORY_FILE, "utf-8");
        const entries: MemoryEntry[] = JSON.parse(entriesData);
        for (const entry of entries) {
          this.entries.set(entry.key, entry);
        }
        console.log(`✅ Loaded ${entries.length} memory entries`);
      }

      // Load tools
      if (fs.existsSync(TOOLS_FILE)) {
        const toolsData = fs.readFileSync(TOOLS_FILE, "utf-8");
        const tools: MemoryTool[] = JSON.parse(toolsData);
        for (const tool of tools) {
          this.tools.set(tool.id, tool);
        }
        console.log(`✅ Loaded ${tools.length} memory tools`);
      }
    } catch (error) {
      console.error("❌ Error loading TomiNetwork data:", error);
    }
  }

  /**
   * Save data to disk
   */
  private saveToDisk(): void {
    try {
      ensureDataDir();

      // Save entries
      const entries = Array.from(this.entries.values());
      fs.writeFileSync(MEMORY_FILE, JSON.stringify(entries, null, 2));

      // Save tools
      const tools = Array.from(this.tools.values());
      fs.writeFileSync(TOOLS_FILE, JSON.stringify(tools, null, 2));

      console.log(
        `💾 Saved ${entries.length} entries and ${tools.length} tools`
      );
    } catch (error) {
      console.error("❌ Error saving TomiNetwork data:", error);
    }
  }

  // ========== MEMORY OPERATIONS ==========

  /**
   * Store thông tin
   */
  store(
    key: string,
    value: any,
    type: MemoryEntry["type"] = "text",
    description?: string,
    tags?: string[]
  ): MemoryEntry {
    const now = new Date().toISOString();
    const entry: MemoryEntry = {
      id: generateId(),
      key,
      value,
      type,
      description,
      tags: tags || [],
      createdAt: now,
      updatedAt: now,
      accessCount: 0,
      lastAccessed: now,
    };

    this.entries.set(key, entry);
    this.saveToDisk();

    return entry;
  }

  /**
   * Retrieve thông tin
   */
  retrieve(key: string): MemoryEntry | null {
    const entry = this.entries.get(key);
    if (entry) {
      // Update access stats
      entry.accessCount++;
      entry.lastAccessed = new Date().toISOString();
      this.saveToDisk();
    }
    return entry || null;
  }

  /**
   * Update thông tin
   */
  update(
    key: string,
    value: any,
    description?: string,
    tags?: string[]
  ): MemoryEntry | null {
    const entry = this.entries.get(key);
    if (!entry) return null;

    entry.value = value;
    entry.updatedAt = new Date().toISOString();
    if (description !== undefined) entry.description = description;
    if (tags !== undefined) entry.tags = tags;

    this.saveToDisk();
    return entry;
  }

  /**
   * Delete thông tin
   */
  delete(key: string): boolean {
    const deleted = this.entries.delete(key);
    if (deleted) {
      this.saveToDisk();
    }
    return deleted;
  }

  /**
   * Search thông tin
   */
  search(query: string, limit: number = 10): MemoryEntry[] {
    const results: MemoryEntry[] = [];
    const queryLower = query.toLowerCase();

    for (const entry of this.entries.values()) {
      const matches =
        entry.key.toLowerCase().includes(queryLower) ||
        (entry.description &&
          entry.description.toLowerCase().includes(queryLower)) ||
        (entry.tags &&
          entry.tags.some((tag) => tag.toLowerCase().includes(queryLower))) ||
        (typeof entry.value === "string" &&
          entry.value.toLowerCase().includes(queryLower));

      if (matches) {
        results.push(entry);
      }
    }

    return results
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, limit);
  }

  /**
   * List tất cả entries
   */
  listEntries(): MemoryEntry[] {
    return Array.from(this.entries.values()).sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * Clear tất cả entries
   */
  clearAllEntries(): { cleared: number; timestamp: string } {
    const count = this.entries.size;
    this.entries.clear();
    this.saveToDisk();

    return {
      cleared: count,
      timestamp: new Date().toISOString(),
    };
  }

  // ========== TOOL OPERATIONS ==========

  /**
   * Create memory tool
   */
  createTool(
    name: string,
    description: string,
    type: MemoryTool["type"],
    parameters: Record<string, any>,
    handlerCode: string
  ): MemoryTool {
    const tool: MemoryTool = {
      id: generateId(),
      name,
      description,
      type,
      parameters,
      handlerCode,
      createdAt: new Date().toISOString(),
      usageCount: 0,
    };

    this.tools.set(tool.id, tool);
    this.saveToDisk();

    return tool;
  }

  /**
   * Execute memory tool
   */
  async executeTool(toolId: string, args: Record<string, any>): Promise<any> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`Tool với ID '${toolId}' không tồn tại`);
    }

    try {
      // Update usage stats
      tool.usageCount++;
      this.saveToDisk();

      // Create function từ handler code với memory storage context
      const handlerFunction = new Function(
        "args",
        "storage",
        "generateId",
        tool.handlerCode
      );

      // Execute với context
      const result = await handlerFunction(args, this, generateId);
      return result;
    } catch (error) {
      throw new Error(
        `Lỗi khi thực thi tool '${tool.name}': ${(error as Error).message}`
      );
    }
  }

  /**
   * Get tool by ID or name
   */
  getTool(identifier: string): MemoryTool | null {
    // Try by ID first
    let tool = this.tools.get(identifier);
    if (tool) return tool;

    // Try by name
    for (const t of this.tools.values()) {
      if (t.name === identifier) {
        return t;
      }
    }

    return null;
  }

  /**
   * List tools
   */
  listTools(): MemoryTool[] {
    return Array.from(this.tools.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Delete tool
   */
  deleteTool(toolId: string): boolean {
    const deleted = this.tools.delete(toolId);
    if (deleted) {
      this.saveToDisk();
    }
    return deleted;
  }

  /**
   * Clear tất cả tools
   */
  clearAllTools(): { cleared: number; timestamp: string } {
    const count = this.tools.size;
    this.tools.clear();
    this.saveToDisk();

    return {
      cleared: count,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset toàn bộ hệ thống (xóa cả entries và tools)
   */
  resetAll(): {
    entriesCleared: number;
    toolsCleared: number;
    timestamp: string;
  } {
    const entriesCount = this.entries.size;
    const toolsCount = this.tools.size;

    this.entries.clear();
    this.tools.clear();
    this.saveToDisk();

    return {
      entriesCleared: entriesCount,
      toolsCleared: toolsCount,
      timestamp: new Date().toISOString(),
    };
  }
}

// Singleton instance
export const memoryCore = new MemoryCore();
