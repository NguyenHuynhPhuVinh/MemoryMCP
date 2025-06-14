/**
 * Search & List Operations Module - Xử lý tìm kiếm và liệt kê
 */
import { MemoryEntry, MemoryTool, UniversalRequest } from "../types/index.js";
import { memoryCore } from "../core/memory-core.js";
import { SearchUtils, ErrorUtils } from "../core/utilities.js";
import { ERROR_MESSAGES, LIMITS } from "../core/constants.js";

/**
 * Search result interface
 */
export interface SearchResult {
  entries: MemoryEntry[];
  tools: MemoryTool[];
  totalFound: number;
  query: string;
  searchTime: number;
  suggestions?: string[];
}

/**
 * List result interface
 */
export interface ListResult {
  items: (MemoryEntry | MemoryTool)[];
  total: number;
  type: "entries" | "tools" | "all";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Search & List Operations Handler
 */
export class SearchOperations {
  /**
   * Search in memory entries and tools
   */
  static search(request: UniversalRequest): SearchResult {
    if (!request.query) {
      throw ErrorUtils.createError(ERROR_MESSAGES.QUERY_REQUIRED);
    }

    const startTime = Date.now();
    const query = SearchUtils.normalizeQuery(request.query);
    const limit = Math.min(request.limit || LIMITS.DEFAULT_SEARCH_LIMIT, LIMITS.MAX_SEARCH_LIMIT);

    // Search in entries
    const entries = this.searchEntries(query, limit);
    
    // Search in tools
    const tools = this.searchTools(query, limit);

    const searchTime = Date.now() - startTime;
    const totalFound = entries.length + tools.length;

    // Generate search suggestions if no results found
    const suggestions = totalFound === 0 ? this.generateSuggestions(query) : undefined;

    return {
      entries,
      tools,
      totalFound,
      query: request.query,
      searchTime,
      suggestions,
    };
  }

  /**
   * Search only in memory entries
   */
  static searchEntries(query: string, limit?: number): MemoryEntry[] {
    const normalizedQuery = SearchUtils.normalizeQuery(query);
    const searchLimit = Math.min(limit || LIMITS.DEFAULT_SEARCH_LIMIT, LIMITS.MAX_SEARCH_LIMIT);
    
    const allEntries = memoryCore.listEntries();
    const results: Array<{ entry: MemoryEntry; relevance: number }> = [];

    for (const entry of allEntries) {
      let relevance = 0;

      // Search in key
      relevance += SearchUtils.calculateRelevance(entry.key, normalizedQuery) * 2;

      // Search in description
      if (entry.description) {
        relevance += SearchUtils.calculateRelevance(entry.description, normalizedQuery) * 1.5;
      }

      // Search in tags
      if (entry.tags) {
        for (const tag of entry.tags) {
          relevance += SearchUtils.calculateRelevance(tag, normalizedQuery);
        }
      }

      // Search in value (if string)
      if (typeof entry.value === "string") {
        relevance += SearchUtils.calculateRelevance(entry.value, normalizedQuery) * 0.8;
      } else if (typeof entry.value === "object") {
        // Search in JSON string representation
        const jsonString = JSON.stringify(entry.value);
        relevance += SearchUtils.calculateRelevance(jsonString, normalizedQuery) * 0.5;
      }

      if (relevance > 0) {
        results.push({ entry, relevance });
      }
    }

    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, searchLimit)
      .map(result => result.entry);
  }

  /**
   * Search only in tools
   */
  static searchTools(query: string, limit?: number): MemoryTool[] {
    const normalizedQuery = SearchUtils.normalizeQuery(query);
    const searchLimit = Math.min(limit || LIMITS.DEFAULT_SEARCH_LIMIT, LIMITS.MAX_SEARCH_LIMIT);
    
    const allTools = memoryCore.listTools();
    const results: Array<{ tool: MemoryTool; relevance: number }> = [];

    for (const tool of allTools) {
      let relevance = 0;

      // Search in name
      relevance += SearchUtils.calculateRelevance(tool.name, normalizedQuery) * 3;

      // Search in description
      relevance += SearchUtils.calculateRelevance(tool.description, normalizedQuery) * 2;

      // Search in type
      relevance += SearchUtils.calculateRelevance(tool.type, normalizedQuery) * 1.5;

      // Search in handler code
      relevance += SearchUtils.calculateRelevance(tool.handlerCode, normalizedQuery) * 0.5;

      if (relevance > 0) {
        results.push({ tool, relevance });
      }
    }

    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, searchLimit)
      .map(result => result.tool);
  }

  /**
   * List all entries
   */
  static listEntries(sortBy?: string, sortOrder?: "asc" | "desc"): ListResult {
    let entries = memoryCore.listEntries();

    // Apply sorting
    if (sortBy) {
      entries = this.sortEntries(entries, sortBy, sortOrder || "desc");
    }

    return {
      items: entries,
      total: entries.length,
      type: "entries",
      sortBy,
      sortOrder,
    };
  }

  /**
   * List all tools
   */
  static listTools(sortBy?: string, sortOrder?: "asc" | "desc"): ListResult {
    let tools = memoryCore.listTools();

    // Apply sorting
    if (sortBy) {
      tools = this.sortTools(tools, sortBy, sortOrder || "desc");
    }

    return {
      items: tools,
      total: tools.length,
      type: "tools",
      sortBy,
      sortOrder,
    };
  }

  /**
   * List everything (entries and tools)
   */
  static listAll(): ListResult {
    const entries = memoryCore.listEntries();
    const tools = memoryCore.listTools();
    const allItems = [...entries, ...tools];

    return {
      items: allItems,
      total: allItems.length,
      type: "all",
    };
  }

  /**
   * Get search suggestions based on existing data
   */
  private static generateSuggestions(query: string): string[] {
    const suggestions: Set<string> = new Set();
    const normalizedQuery = SearchUtils.normalizeQuery(query);

    // Get suggestions from entry keys
    const entries = memoryCore.listEntries();
    for (const entry of entries) {
      const words = entry.key.toLowerCase().split(/[._-\s]+/);
      for (const word of words) {
        if (word.length > 2 && word.includes(normalizedQuery.substring(0, 3))) {
          suggestions.add(word);
        }
      }

      // Get suggestions from tags
      if (entry.tags) {
        for (const tag of entry.tags) {
          if (tag.toLowerCase().includes(normalizedQuery.substring(0, 3))) {
            suggestions.add(tag);
          }
        }
      }
    }

    // Get suggestions from tool names
    const tools = memoryCore.listTools();
    for (const tool of tools) {
      const words = tool.name.toLowerCase().split(/[._-\s]+/);
      for (const word of words) {
        if (word.length > 2 && word.includes(normalizedQuery.substring(0, 3))) {
          suggestions.add(word);
        }
      }
    }

    return Array.from(suggestions).slice(0, 5);
  }

  /**
   * Sort entries by specified field
   */
  private static sortEntries(
    entries: MemoryEntry[],
    sortBy: string,
    sortOrder: "asc" | "desc"
  ): MemoryEntry[] {
    const sorted = [...entries].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "key":
          aValue = a.key;
          bValue = b.key;
          break;
        case "type":
          aValue = a.type;
          bValue = b.type;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "updatedAt":
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case "accessCount":
          aValue = a.accessCount;
          bValue = b.accessCount;
          break;
        case "lastAccessed":
          aValue = new Date(a.lastAccessed).getTime();
          bValue = new Date(b.lastAccessed).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  /**
   * Sort tools by specified field
   */
  private static sortTools(
    tools: MemoryTool[],
    sortBy: string,
    sortOrder: "asc" | "desc"
  ): MemoryTool[] {
    const sorted = [...tools].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "type":
          aValue = a.type;
          bValue = b.type;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "usageCount":
          aValue = a.usageCount;
          bValue = b.usageCount;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  /**
   * Advanced search with filters
   */
  static advancedSearch(options: {
    query?: string;
    type?: "entries" | "tools" | "all";
    entryType?: MemoryEntry["type"];
    toolType?: MemoryTool["type"];
    tags?: string[];
    dateRange?: { from: string; to: string };
    limit?: number;
  }): SearchResult {
    const startTime = Date.now();
    let entries: MemoryEntry[] = [];
    let tools: MemoryTool[] = [];

    if (options.type === "entries" || options.type === "all" || !options.type) {
      entries = this.filterEntries(options);
    }

    if (options.type === "tools" || options.type === "all" || !options.type) {
      tools = this.filterTools(options);
    }

    const searchTime = Date.now() - startTime;
    const totalFound = entries.length + tools.length;

    return {
      entries,
      tools,
      totalFound,
      query: options.query || "",
      searchTime,
    };
  }

  /**
   * Filter entries based on criteria
   */
  private static filterEntries(options: any): MemoryEntry[] {
    let entries = memoryCore.listEntries();

    // Filter by entry type
    if (options.entryType) {
      entries = entries.filter(entry => entry.type === options.entryType);
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      entries = entries.filter(entry =>
        entry.tags && options.tags.some((tag: string) => entry.tags!.includes(tag))
      );
    }

    // Filter by date range
    if (options.dateRange) {
      const fromDate = new Date(options.dateRange.from).getTime();
      const toDate = new Date(options.dateRange.to).getTime();
      entries = entries.filter(entry => {
        const entryDate = new Date(entry.createdAt).getTime();
        return entryDate >= fromDate && entryDate <= toDate;
      });
    }

    // Apply text search if query provided
    if (options.query) {
      entries = this.searchEntries(options.query, entries.length);
    }

    // Apply limit
    const limit = Math.min(options.limit || LIMITS.DEFAULT_SEARCH_LIMIT, LIMITS.MAX_SEARCH_LIMIT);
    return entries.slice(0, limit);
  }

  /**
   * Filter tools based on criteria
   */
  private static filterTools(options: any): MemoryTool[] {
    let tools = memoryCore.listTools();

    // Filter by tool type
    if (options.toolType) {
      tools = tools.filter(tool => tool.type === options.toolType);
    }

    // Filter by date range
    if (options.dateRange) {
      const fromDate = new Date(options.dateRange.from).getTime();
      const toDate = new Date(options.dateRange.to).getTime();
      tools = tools.filter(tool => {
        const toolDate = new Date(tool.createdAt).getTime();
        return toolDate >= fromDate && toolDate <= toDate;
      });
    }

    // Apply text search if query provided
    if (options.query) {
      tools = this.searchTools(options.query, tools.length);
    }

    // Apply limit
    const limit = Math.min(options.limit || LIMITS.DEFAULT_SEARCH_LIMIT, LIMITS.MAX_SEARCH_LIMIT);
    return tools.slice(0, limit);
  }
}
