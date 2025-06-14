/**
 * Tool Operations Module - Xử lý các thao tác tool
 */
import { MemoryTool, UniversalRequest } from "../types/index.js";
import { memoryCore } from "../core/memory-core.js";
import { ValidationUtils, ErrorUtils } from "../core/utilities.js";
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  API_DEFAULTS,
  HTTP_METHODS,
  AUTH_TYPES,
} from "../core/constants.js";

/**
 * Tool Operations Handler
 */
export class ToolOperations {
  /**
   * Create custom tool
   */
  static createTool(request: UniversalRequest): MemoryTool {
    // Validate required fields
    const validation = ValidationUtils.validateRequired({
      toolName: request.toolName,
      toolDescription: request.toolDescription,
      handlerCode: request.handlerCode,
    });

    if (!validation.valid) {
      throw ErrorUtils.createValidationError("create_tool", validation.error!);
    }

    // Validate tool name
    const nameValidation = ValidationUtils.validateToolName(request.toolName!);
    if (!nameValidation.valid) {
      throw ErrorUtils.createValidationError("toolName", nameValidation.error!);
    }

    // Check if tool name already exists
    const existingTool = memoryCore.getTool(request.toolName!);
    if (existingTool) {
      throw ErrorUtils.createError(
        `Tool với tên '${request.toolName}' đã tồn tại`
      );
    }

    return memoryCore.createTool(
      request.toolName!,
      request.toolDescription!,
      request.toolType || "processor",
      request.parameters || {},
      request.handlerCode!
    );
  }

  /**
   * Create API tool with template
   */
  static createApiTool(request: UniversalRequest): MemoryTool {
    // Validate required fields
    const validation = ValidationUtils.validateRequired({
      toolName: request.toolName,
      toolDescription: request.toolDescription,
      apiUrl: request.apiUrl,
    });

    if (!validation.valid) {
      throw ErrorUtils.createValidationError(
        "create_api_tool",
        validation.error!
      );
    }

    // Validate tool name
    const nameValidation = ValidationUtils.validateToolName(request.toolName!);
    if (!nameValidation.valid) {
      throw ErrorUtils.createValidationError("toolName", nameValidation.error!);
    }

    // Check if tool name already exists
    const existingTool = memoryCore.getTool(request.toolName!);
    if (existingTool) {
      throw ErrorUtils.createError(
        `Tool với tên '${request.toolName}' đã tồn tại`
      );
    }

    // Validate API URL
    try {
      new URL(request.apiUrl!);
    } catch {
      throw ErrorUtils.createValidationError("apiUrl", "URL không hợp lệ");
    }

    const method = request.apiMethod || "GET";
    const headers = { ...API_DEFAULTS.HEADERS, ...(request.apiHeaders || {}) };
    const auth = request.apiAuth;
    const timeout = request.apiTimeout || API_DEFAULTS.TIMEOUT;

    // Generate API tool handler code
    const handlerCode = this.generateApiToolCode(
      request.apiUrl!,
      method,
      headers,
      auth,
      timeout
    );

    // Create parameters schema for API tool
    const parameters = {
      body: {
        type: "object",
        description: "Request body (cho POST, PUT, PATCH)",
        optional: true,
      },
      params: {
        type: "object",
        description: "Query parameters",
        optional: true,
      },
      customHeaders: {
        type: "object",
        description: "Custom headers để override",
        optional: true,
      },
      customAuth: {
        type: "object",
        description: "Custom authentication để override",
        optional: true,
      },
    };

    return memoryCore.createTool(
      request.toolName!,
      request.toolDescription!,
      "processor",
      parameters,
      handlerCode
    );
  }

  /**
   * Execute tool
   */
  static async executeTool(request: UniversalRequest): Promise<any> {
    if (!request.toolId && !request.toolName) {
      throw ErrorUtils.createError(ERROR_MESSAGES.TOOL_ID_OR_NAME_REQUIRED);
    }

    let toolId = request.toolId;
    if (!toolId && request.toolName) {
      const tool = memoryCore.getTool(request.toolName);
      if (!tool) {
        throw ErrorUtils.createError(
          `Tool '${request.toolName}' không tồn tại`
        );
      }
      toolId = tool.id;
    }

    return await memoryCore.executeTool(toolId!, request.args || {});
  }

  /**
   * List all tools
   */
  static listTools(): MemoryTool[] {
    return memoryCore.listTools();
  }

  /**
   * Get tool by ID or name
   */
  static getTool(identifier: string): MemoryTool | null {
    return memoryCore.getTool(identifier);
  }

  /**
   * Delete tool
   */
  static deleteTool(request: UniversalRequest): boolean {
    if (!request.toolId && !request.toolName) {
      throw ErrorUtils.createError(ERROR_MESSAGES.TOOL_ID_OR_NAME_REQUIRED);
    }

    let toolId = request.toolId;
    if (!toolId && request.toolName) {
      const tool = memoryCore.getTool(request.toolName);
      if (!tool) return false;
      toolId = tool.id;
    }

    return memoryCore.deleteTool(toolId!);
  }

  /**
   * Clear all tools
   */
  static clearAllTools(): { cleared: number; timestamp: string } {
    return memoryCore.clearAllTools();
  }

  /**
   * Get tool statistics
   */
  static getToolStats(): {
    totalTools: number;
    byType: Record<string, number>;
    mostUsedTool?: MemoryTool;
    recentTools: MemoryTool[];
    totalUsage: number;
  } {
    const tools = memoryCore.listTools();

    if (tools.length === 0) {
      return {
        totalTools: 0,
        byType: {},
        recentTools: [],
        totalUsage: 0,
      };
    }

    // Count by type
    const byType: Record<string, number> = {};
    let totalUsage = 0;

    for (const tool of tools) {
      byType[tool.type] = (byType[tool.type] || 0) + 1;
      totalUsage += tool.usageCount;
    }

    // Find most used tool
    const mostUsedTool = [...tools].sort(
      (a, b) => b.usageCount - a.usageCount
    )[0];

    // Get recent tools (last 5)
    const recentTools = tools.slice(0, 5);

    return {
      totalTools: tools.length,
      byType,
      mostUsedTool,
      recentTools,
      totalUsage,
    };
  }

  /**
   * Validate tool data
   */
  static validateTool(tool: Partial<MemoryTool>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!tool.name) {
      errors.push("Tool name is required");
    } else {
      const nameValidation = ValidationUtils.validateToolName(tool.name);
      if (!nameValidation.valid) {
        errors.push(`Tool name validation failed: ${nameValidation.error}`);
      }
    }

    if (!tool.description) {
      errors.push("Tool description is required");
    }

    if (!tool.handlerCode) {
      errors.push("Handler code is required");
    }

    if (
      tool.type &&
      !["storage", "retrieval", "processor", "analyzer"].includes(tool.type)
    ) {
      errors.push("Invalid tool type");
    }

    if (tool.parameters && typeof tool.parameters !== "object") {
      errors.push("Parameters must be an object");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate API tool handler code
   */
  private static generateApiToolCode(
    apiUrl: string,
    method: string,
    headers: Record<string, string>,
    auth?: any,
    timeout: number = 5000
  ): string {
    return `
// API Tool Handler - Generated by TomiNetwork
const { body, params, customHeaders, customAuth } = args;

// Prepare URL with query parameters
let url = '${apiUrl}';
if (params && Object.keys(params).length > 0) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    searchParams.append(key, value.toString());
  }
  url += (url.includes('?') ? '&' : '?') + searchParams.toString();
}

// Prepare headers
const fetchHeaders = {
  ...${JSON.stringify(headers)},
  ...(customHeaders || {})
};

// Handle authentication
${
  auth
    ? `
const authConfig = ${JSON.stringify(auth)};
if (customAuth) {
  Object.assign(authConfig, customAuth);
}

if (authConfig.type === 'bearer' && authConfig.token) {
  fetchHeaders['Authorization'] = \`Bearer \${authConfig.token}\`;
} else if (authConfig.type === 'basic' && authConfig.username && authConfig.password) {
  const credentials = btoa(\`\${authConfig.username}:\${authConfig.password}\`);
  fetchHeaders['Authorization'] = \`Basic \${credentials}\`;
} else if (authConfig.type === 'api-key' && authConfig.apiKey) {
  const headerName = authConfig.apiKeyHeader || 'X-API-Key';
  fetchHeaders[headerName] = authConfig.apiKey;
}
`
    : `
if (customAuth) {
  if (customAuth.type === 'bearer' && customAuth.token) {
    fetchHeaders['Authorization'] = \`Bearer \${customAuth.token}\`;
  } else if (customAuth.type === 'basic' && customAuth.username && customAuth.password) {
    const credentials = btoa(\`\${customAuth.username}:\${customAuth.password}\`);
    fetchHeaders['Authorization'] = \`Basic \${credentials}\`;
  } else if (customAuth.type === 'api-key' && customAuth.apiKey) {
    const headerName = customAuth.apiKeyHeader || 'X-API-Key';
    fetchHeaders[headerName] = customAuth.apiKey;
  }
}
`
}

// Prepare fetch options
const fetchOptions = {
  method: '${method.toUpperCase()}',
  headers: fetchHeaders
};

// Add body if needed
if (body && ['POST', 'PUT', 'PATCH'].includes('${method.toUpperCase()}')) {
  fetchOptions.body = JSON.stringify(body);
}

const startTime = Date.now();

// Create timeout promise
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Request timeout after ${timeout}ms')), ${timeout});
});

// Execute API call with timeout
return Promise.race([fetch(url, fetchOptions), timeoutPromise])
  .then(response => {
    const duration = Date.now() - startTime;
    
    return response.text().then(responseText => {
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = responseText;
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: response.ok,
            data: responseData,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            duration: duration,
            url: url,
            method: '${method.toUpperCase()}'
          }, null, 2)
        }]
      };
    });
  })
  .catch(error => {
    const duration = Date.now() - startTime;
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: false,
          error: error.message,
          url: url,
          method: '${method.toUpperCase()}',
          duration: duration
        }, null, 2)
      }]
    };
  });
`;
  }
}
