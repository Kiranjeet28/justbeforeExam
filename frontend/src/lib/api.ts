/**
 * API Client for justBeforExam Backend
 * Handles all communication with FastAPI backend with proper type safety and error handling
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type SourceType = "video" | "link" | "note";

export interface Source {
  id: number;
  type: SourceType;
  content: string;
  timestamp: string;
  video_id?: string | null;
}

export interface SourceCreate {
  type: SourceType;
  content: string;
  video_id?: string | null;
}

export interface SourceUpdate {
  type?: SourceType;
  content?: string;
  video_id?: string | null;
}

export interface Report {
  id: number;
  content: string;
  title?: string | null;
  timestamp: string;
  source_ids?: string | null;
}

export interface ReportCreate {
  content: string;
  title?: string | null;
  source_ids?: string | null;
  prompt?: string | null;
}

export interface ReportUpdate {
  content?: string;
  title?: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface ErrorResponse {
  detail: string;
  error_code?: string;
  timestamp?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string,
  ) {
    super(message);
    this.name = "APIError";
  }
}

export class ValidationError extends APIError {
  constructor(message: string, errorCode = "VALIDATION_ERROR") {
    super(message, 400, errorCode);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends APIError {
  constructor(message: string) {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends APIError {
  constructor(
    message: string,
    public retryAfter: number,
    public retryAt: string,
  ) {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitError";
  }
}

export class ServerError extends APIError {
  constructor(message: string, statusCode = 500) {
    super(message, statusCode, "SERVER_ERROR");
    this.name = "ServerError";
  }
}

// ============================================================================
// API CLIENT
// ============================================================================

class APIClient {
  private baseURL: string;
  private timeout: number = 30000; // 30 seconds

  constructor(baseURL: string = "http://localhost:8000") {
    this.baseURL = baseURL;
  }

  /**
   * Helper to make HTTP requests with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(
          response.headers.get("Retry-After") || "60",
          10,
        );
        const retryAt = new Date(Date.now() + retryAfter * 1000).toISOString();
        throw new RateLimitError(
          "Rate limit exceeded. Please try again later.",
          retryAfter,
          retryAt,
        );
      }

      // Parse response
      let data: any;
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle errors
      if (!response.ok) {
        this.handleErrorResponse(response.status, data);
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Re-throw custom errors
      if (error instanceof APIError) {
        throw error;
      }

      // Handle abort
      if (error instanceof Error && error.name === "AbortError") {
        throw new APIError("Request timeout", 408, "REQUEST_TIMEOUT");
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new APIError(
          "Network error. Please check your connection.",
          0,
          "NETWORK_ERROR",
        );
      }

      throw new APIError(
        error instanceof Error ? error.message : "Unknown error",
        500,
        "UNKNOWN_ERROR",
      );
    }
  }

  /**
   * Handle error responses from backend
   */
  private handleErrorResponse(status: number, data: any): never {
    const errorMessage =
      typeof data === "string" ? data : data?.detail || "An error occurred";
    const errorCode = data?.error_code;

    switch (status) {
      case 400:
        throw new ValidationError(errorMessage, errorCode);
      case 404:
        throw new NotFoundError(errorMessage);
      case 429:
        throw new APIError(errorMessage, 429, "RATE_LIMIT_EXCEEDED");
      case 500:
      case 502:
      case 503:
      case 504:
        throw new ServerError(errorMessage, status);
      default:
        throw new APIError(errorMessage, status, errorCode);
    }
  }

  // ========================================================================
  // HEALTH CHECK
  // ========================================================================

  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/health");
  }

  // ========================================================================
  // SOURCES ENDPOINTS
  // ========================================================================

  /**
   * Create a new source
   */
  async createSource(payload: SourceCreate): Promise<Source> {
    // Validate payload
    if (!payload.type || !["video", "link", "note"].includes(payload.type)) {
      throw new ValidationError("Invalid source type");
    }
    if (!payload.content || payload.content.trim().length === 0) {
      throw new ValidationError("Content cannot be empty");
    }
    if (payload.content.length > 100000) {
      throw new ValidationError("Content too long (max 100,000 characters)");
    }

    return this.request<Source>("/api/sources", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Get all sources with pagination
   */
  async getSources(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedResponse<Source>> {
    if (page < 1 || pageSize < 1) {
      throw new ValidationError("Page and pageSize must be positive integers");
    }

    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });

    return this.request<PaginatedResponse<Source>>(`/api/sources?${params}`);
  }

  /**
   * Get a single source by ID
   */
  async getSource(sourceId: number): Promise<Source> {
    if (!Number.isInteger(sourceId) || sourceId < 1) {
      throw new ValidationError("Invalid source ID");
    }

    return this.request<Source>(`/api/sources/${sourceId}`);
  }

  /**
   * Update a source
   */
  async updateSource(sourceId: number, payload: SourceUpdate): Promise<Source> {
    if (!Number.isInteger(sourceId) || sourceId < 1) {
      throw new ValidationError("Invalid source ID");
    }

    return this.request<Source>(`/api/sources/${sourceId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Delete a source
   */
  async deleteSource(
    sourceId: number,
  ): Promise<{ success: boolean; message: string }> {
    if (!Number.isInteger(sourceId) || sourceId < 1) {
      throw new ValidationError("Invalid source ID");
    }

    return this.request<{ success: boolean; message: string }>(
      `/api/sources/${sourceId}`,
      {
        method: "DELETE",
      },
    );
  }

  // ========================================================================
  // REPORTS ENDPOINTS
  // ========================================================================

  /**
   * Create a new report
   */
  async createReport(payload: ReportCreate): Promise<Report> {
    // Validate payload
    if (!payload.content || payload.content.trim().length === 0) {
      throw new ValidationError("Content cannot be empty");
    }
    if (payload.content.length > 500000) {
      throw new ValidationError("Content too long (max 500,000 characters)");
    }
    if (payload.title && payload.title.length > 255) {
      throw new ValidationError("Title too long (max 255 characters)");
    }

    return this.request<Report>("/api/reports", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Get all reports with pagination
   */
  async getReports(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedResponse<Report>> {
    if (page < 1 || pageSize < 1) {
      throw new ValidationError("Page and pageSize must be positive integers");
    }

    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });

    return this.request<PaginatedResponse<Report>>(`/api/reports?${params}`);
  }

  /**
   * Get a single report by ID
   */
  async getReport(reportId: number): Promise<Report> {
    if (!Number.isInteger(reportId) || reportId < 1) {
      throw new ValidationError("Invalid report ID");
    }

    return this.request<Report>(`/api/reports/${reportId}`);
  }

  /**
   * Update a report
   */
  async updateReport(reportId: number, payload: ReportUpdate): Promise<Report> {
    if (!Number.isInteger(reportId) || reportId < 1) {
      throw new ValidationError("Invalid report ID");
    }

    return this.request<Report>(`/api/reports/${reportId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Delete a report
   */
  async deleteReport(
    reportId: number,
  ): Promise<{ success: boolean; message: string }> {
    if (!Number.isInteger(reportId) || reportId < 1) {
      throw new ValidationError("Invalid report ID");
    }

    return this.request<{ success: boolean; message: string }>(
      `/api/reports/${reportId}`,
      {
        method: "DELETE",
      },
    );
  }

  // ========================================================================
  // GENERATION ENDPOINTS
  // ========================================================================

  /**
   * Generate study notes from sources
   */
  async generateNotes(
    sourceIds: string | string[] = "all",
    prompt?: string,
  ): Promise<{ content: string; model: string }> {
    const sourceIdStr = Array.isArray(sourceIds)
      ? sourceIds.join(",")
      : sourceIds;

    return this.request<{ content: string; model: string }>(
      "/api/v1/generate",
      {
        method: "POST",
        body: JSON.stringify({
          source_ids: sourceIdStr,
          prompt: prompt || "Generate comprehensive study notes",
        }),
      },
    );
  }

  /**
   * Generate report from sources
   */
  async generateReport(
    sourceIds: string | string[] = "all",
    prompt?: string,
    title?: string,
    save: boolean = false,
  ): Promise<Report> {
    const sourceIdStr = Array.isArray(sourceIds)
      ? sourceIds.join(",")
      : sourceIds;

    return this.request<Report>("/api/generate-report", {
      method: "POST",
      body: JSON.stringify({
        source_ids: sourceIdStr,
        prompt: prompt || "Create a comprehensive study guide",
        title: title || `Report - ${new Date().toLocaleDateString()}`,
        save,
      }),
    });
  }

  /**
   * Transform notes into artifacts (cheat sheet, mind map)
   */
  async transformNotes(content: string): Promise<{
    success: boolean;
    artifacts: {
      cheat_sheet?: string;
      mind_map?: {
        root: string;
        children: Array<{
          branch: string;
          leafs: string[];
        }>;
      };
    };
  }> {
    if (!content || content.trim().length === 0) {
      throw new ValidationError("Content cannot be empty");
    }

    return this.request<any>("/api/transform-notes", {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  /**
   * Generate cheat sheet
   */
  async generateCheatSheet(
    sourceIds?: number[],
    topic?: string,
  ): Promise<{ content: string }> {
    return this.request<{ content: string }>("/api/cheat-sheet", {
      method: "POST",
      body: JSON.stringify({
        source_ids: sourceIds || [],
        topic: topic || "",
      }),
    });
  }

  /**
   * Stream note generation (for real-time updates)
   */
  async generateNotesStreaming(
    sourceIds: string | string[] = "all",
    prompt?: string,
    onChunk?: (chunk: string) => void,
  ): Promise<string> {
    const sourceIdStr = Array.isArray(sourceIds)
      ? sourceIds.join(",")
      : sourceIds;
    const url = new URL(`${this.baseURL}/api/generate-notes-stream`);
    url.searchParams.append("source_ids", sourceIdStr);
    if (prompt) url.searchParams.append("prompt", prompt);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "text/event-stream",
      },
    });

    if (!response.ok) {
      throw new APIError(
        `Stream failed: ${response.statusText}`,
        response.status,
      );
    }

    const reader = response.body?.getReader();
    if (!reader) throw new APIError("No response body", 500);

    let fullContent = "";
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullContent += chunk;
        onChunk?.(chunk);
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const apiClient = new APIClient(API_BASE_URL);

export default apiClient;
