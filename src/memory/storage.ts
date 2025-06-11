/**
 * Memory Storage System - Hệ thống lưu trữ thông tin cho AI
 */
import { MemoryEntry, MemoryTool } from "../types/index.js";
import { generateId } from "../utils/helpers.js";
import * as fs from "fs";
import * as path from "path";

// Đường dẫn lưu trữ
const MEMORY_DIR = path.join(process.cwd(), 'ai-memory');
const ENTRIES_FILE = path.join(MEMORY_DIR, 'entries.json');
const TOOLS_FILE = path.join(MEMORY_DIR, 'tools.json');

/**
 * Đảm bảo thư mục memory tồn tại
 */
function ensureMemoryDir(): void {
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }
}

/**
 * Memory Storage Class
 */
export class MemoryStorage {
  private entries: Map<string, MemoryEntry> = new Map();
  private tools: Map<string, MemoryTool> = new Map();

  constructor() {
    this.loadFromDisk();
  }

  /**
   * Load data từ disk
   */
  private loadFromDisk(): void {
    try {
      ensureMemoryDir();
      
      // Load entries
      if (fs.existsSync(ENTRIES_FILE)) {
        const entriesData = fs.readFileSync(ENTRIES_FILE, 'utf-8');
        const entries: MemoryEntry[] = JSON.parse(entriesData);
        for (const entry of entries) {
          this.entries.set(entry.key, entry);
        }
        console.log(`✅ Loaded ${entries.length} memory entries`);
      }
      
      // Load tools
      if (fs.existsSync(TOOLS_FILE)) {
        const toolsData = fs.readFileSync(TOOLS_FILE, 'utf-8');
        const tools: MemoryTool[] = JSON.parse(toolsData);
        for (const tool of tools) {
          this.tools.set(tool.id, tool);
        }
        console.log(`✅ Loaded ${tools.length} memory tools`);
      }
    } catch (error) {
      console.error('❌ Error loading memory data:', error);
    }
  }

  /**
   * Save data to disk
   */
  private saveToDisk(): void {
    try {
      ensureMemoryDir();
      
      // Save entries
      const entries = Array.from(this.entries.values());
      fs.writeFileSync(ENTRIES_FILE, JSON.stringify(entries, null, 2));
      
      // Save tools
      const tools = Array.from(this.tools.values());
      fs.writeFileSync(TOOLS_FILE, JSON.stringify(tools, null, 2));
      
      console.log(`💾 Saved ${entries.length} entries and ${tools.length} tools`);
    } catch (error) {
      console.error('❌ Error saving memory data:', error);
    }
  }

  // ========== MEMORY OPERATIONS ==========

  /**
   * Store thông tin
   */
  store(key: string, value: any, type: MemoryEntry['type'] = 'text', description?: string, tags?: string[]): MemoryEntry {
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
      lastAccessed: now
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
  update(key: string, value: any, description?: string, tags?: string[]): MemoryEntry | null {
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
        (entry.description && entry.description.toLowerCase().includes(queryLower)) ||
        (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(queryLower))) ||
        (typeof entry.value === 'string' && entry.value.toLowerCase().includes(queryLower));
      
      if (matches) {
        results.push(entry);
      }
    }
    
    return results
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }

  /**
   * List tất cả entries
   */
  listEntries(): MemoryEntry[] {
    return Array.from(this.entries.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  // ========== TOOL OPERATIONS ==========

  /**
   * Create memory tool
   */
  createTool(name: string, description: string, type: MemoryTool['type'], parameters: Record<string, any>, handlerCode: string): MemoryTool {
    const tool: MemoryTool = {
      id: generateId(),
      name,
      description,
      type,
      parameters,
      handlerCode,
      createdAt: new Date().toISOString(),
      usageCount: 0
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
        'args', 'storage', 'generateId',
        tool.handlerCode
      );
      
      // Execute với context
      const result = await handlerFunction(args, this, generateId);
      return result;
    } catch (error) {
      throw new Error(`Lỗi khi thực thi tool '${tool.name}': ${(error as Error).message}`);
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
    return Array.from(this.tools.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

  // ========== ANALYSIS OPERATIONS ==========

  /**
   * Analyze memory data
   */
  analyze(type: 'summary' | 'count' | 'trends' | 'relationships'): any {
    const entries = this.listEntries();
    const tools = this.listTools();
    
    switch (type) {
      case 'summary':
        return {
          totalEntries: entries.length,
          totalTools: tools.length,
          totalSize: JSON.stringify(entries).length,
          mostAccessedEntry: entries.sort((a, b) => b.accessCount - a.accessCount)[0],
          mostUsedTool: tools.sort((a, b) => b.usageCount - a.usageCount)[0],
          typeDistribution: this.getTypeDistribution(entries)
        };
        
      case 'count':
        return {
          entries: entries.length,
          tools: tools.length,
          byType: this.getTypeDistribution(entries),
          byToolType: this.getToolTypeDistribution(tools)
        };
        
      case 'trends':
        return {
          recentEntries: entries.slice(0, 10),
          recentTools: tools.slice(0, 5),
          accessTrends: this.getAccessTrends(entries)
        };
        
      case 'relationships':
        return {
          tagRelationships: this.getTagRelationships(entries),
          keyPatterns: this.getKeyPatterns(entries)
        };
        
      default:
        return { error: 'Unknown analysis type' };
    }
  }

  private getTypeDistribution(entries: MemoryEntry[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    for (const entry of entries) {
      distribution[entry.type] = (distribution[entry.type] || 0) + 1;
    }
    return distribution;
  }

  private getToolTypeDistribution(tools: MemoryTool[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    for (const tool of tools) {
      distribution[tool.type] = (distribution[tool.type] || 0) + 1;
    }
    return distribution;
  }

  private getAccessTrends(entries: MemoryEntry[]): any {
    return entries
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10)
      .map(e => ({ key: e.key, accessCount: e.accessCount, lastAccessed: e.lastAccessed }));
  }

  private getTagRelationships(entries: MemoryEntry[]): Record<string, number> {
    const tagCount: Record<string, number> = {};
    for (const entry of entries) {
      if (entry.tags) {
        for (const tag of entry.tags) {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        }
      }
    }
    return tagCount;
  }

  private getKeyPatterns(entries: MemoryEntry[]): any {
    const patterns: Record<string, number> = {};
    for (const entry of entries) {
      const parts = entry.key.split(/[._-]/);
      for (const part of parts) {
        if (part.length > 2) {
          patterns[part] = (patterns[part] || 0) + 1;
        }
      }
    }
    return Object.entries(patterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
  }
}

// Singleton instance
export const memoryStorage = new MemoryStorage();
