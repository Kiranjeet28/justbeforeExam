/**
 * Custom React hooks for API calls and state management
 * Provides reusable logic for data fetching, mutations, and error handling
 */

import { useCallback, useState, useRef, useEffect } from "react";
import {
  apiClient,
  APIError,
  RateLimitError,
  ValidationError,
  Source,
  SourceCreate,
  SourceUpdate,
  Report,
  ReportCreate,
  ReportUpdate,
  PaginatedResponse,
} from "@/lib/api";

// ============================================================================
// TYPES
// ============================================================================

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  success: boolean;
}

export interface UseApiOptions<T = any> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onSettled?: (data: T | null, error: Error | null) => void;
  autoFetch?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

// ============================================================================
// GENERIC HOOKS
// ============================================================================

/**
 * Generic hook for fetching data
 */
export function useApi<T>(
  apiFn: () => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiState<T> & {
  execute: () => Promise<T | null>;
  reset: () => void;
  retry: () => Promise<T | null>;
} {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);

  const execute = useCallback(async (): Promise<T | null> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const result = await apiFn();
      setState({
        data: result,
        loading: false,
        error: null,
        success: true,
      });
      options.onSuccess?.(result);
      options.onSettled?.(result, null);
      retryCountRef.current = 0;
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      // Handle rate limiting with retry
      if (error instanceof RateLimitError && retryCountRef.current < (options.retryCount || 3)) {
        retryCountRef.current++;
        const delay = options.retryDelay || error.retryAfter * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return execute();
      }

      setState({
        data: null,
        loading: false,
        error,
        success: false,
      });
      options.onError?.(error);
      options.onSettled?.(null, error);
      return null;
    }
  }, [apiFn, options]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    });
    retryCountRef.current = 0;
  }, []);

  const retry = useCallback(async () => {
    retryCountRef.current = 0;
    return execute();
  }, [execute]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (options.autoFetch) {
      execute();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [options.autoFetch, execute]);

  return { ...state, execute, reset, retry };
}

/**
 * Generic hook for mutations (create, update, delete)
 */
export function useMutation<TInput, TOutput>(
  mutateFn: (input: TInput) => Promise<TOutput>,
  options: UseApiOptions<TOutput> = {}
) {
  const [state, setState] = useState<UseApiState<TOutput>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const mutate = useCallback(
    async (input: TInput): Promise<TOutput | null> => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const result = await mutateFn(input);
        setState({
          data: result,
          loading: false,
          error: null,
          success: true,
        });
        options.onSuccess?.(result);
        options.onSettled?.(result, null);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({
          data: null,
          loading: false,
          error,
          success: false,
        });
        options.onError?.(error);
        options.onSettled?.(null, error);
        return null;
      }
    },
    [mutateFn, options]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  return { ...state, mutate, reset };
}

// ============================================================================
// SOURCES HOOKS
// ============================================================================

/**
 * Hook for creating a source
 */
export function useCreateSource(options?: UseApiOptions<Source>) {
  return useMutation(
    (payload: SourceCreate) => apiClient.createSource(payload),
    options
  );
}

/**
 * Hook for getting sources with pagination
 */
export function useGetSources(
  page: number = 1,
  pageSize: number = 20,
  options?: UseApiOptions<PaginatedResponse<Source>>
) {
  return useApi(
    () => apiClient.getSources(page, pageSize),
    options
  );
}

/**
 * Hook for getting a single source
 */
export function useGetSource(
  sourceId: number,
  options?: UseApiOptions<Source>
) {
  return useApi(
    () => apiClient.getSource(sourceId),
    options
  );
}

/**
 * Hook for updating a source
 */
export function useUpdateSource(options?: UseApiOptions<Source>) {
  return useMutation(
    ({ id, payload }: { id: number; payload: SourceUpdate }) =>
      apiClient.updateSource(id, payload),
    options
  );
}

/**
 * Hook for deleting a source
 */
export function useDeleteSource(options?: UseApiOptions) {
  return useMutation(
    (sourceId: number) => apiClient.deleteSource(sourceId),
    options
  );
}

// ============================================================================
// REPORTS HOOKS
// ============================================================================

/**
 * Hook for creating a report
 */
export function useCreateReport(options?: UseApiOptions<Report>) {
  return useMutation(
    (payload: ReportCreate) => apiClient.createReport(payload),
    options
  );
}

/**
 * Hook for getting reports with pagination
 */
export function useGetReports(
  page: number = 1,
  pageSize: number = 20,
  options?: UseApiOptions<PaginatedResponse<Report>>
) {
  return useApi(
    () => apiClient.getReports(page, pageSize),
    options
  );
}

/**
 * Hook for getting a single report
 */
export function useGetReport(
  reportId: number,
  options?: UseApiOptions<Report>
) {
  return useApi(
    () => apiClient.getReport(reportId),
    options
  );
}

/**
 * Hook for updating a report
 */
export function useUpdateReport(options?: UseApiOptions<Report>) {
  return useMutation(
    ({ id, payload }: { id: number; payload: ReportUpdate }) =>
      apiClient.updateReport(id, payload),
    options
  );
}

/**
 * Hook for deleting a report
 */
export function useDeleteReport(options?: UseApiOptions) {
  return useMutation(
    (reportId: number) => apiClient.deleteReport(reportId),
    options
  );
}

// ============================================================================
// GENERATION HOOKS
// ============================================================================

/**
 * Hook for generating study notes
 */
export function useGenerateNotes(options?: UseApiOptions<{ content: string; model: string }>) {
  return useMutation(
    ({ sourceIds, prompt }: { sourceIds: string | string[]; prompt?: string }) =>
      apiClient.generateNotes(sourceIds, prompt),
    options
  );
}

/**
 * Hook for generating a report
 */
export function useGenerateReport(options?: UseApiOptions<Report>) {
  return useMutation(
    ({
      sourceIds,
      prompt,
      title,
      save,
    }: {
      sourceIds: string | string[];
      prompt?: string;
      title?: string;
      save?: boolean;
    }) => apiClient.generateReport(sourceIds, prompt, title, save),
    options
  );
}

/**
 * Hook for transforming notes into artifacts
 */
export function useTransformNotes(options?: UseApiOptions<any>) {
  return useMutation(
    (content: string) => apiClient.transformNotes(content),
    options
  );
}

/**
 * Hook for generating cheat sheet
 */
export function useGenerateCheatSheet(options?: UseApiOptions<{ content: string }>) {
  return useMutation(
    ({ sourceIds, topic }: { sourceIds?: number[]; topic?: string }) =>
      apiClient.generateCheatSheet(sourceIds, topic),
    options
  );
}

/**
 * Hook for streaming note generation with real-time updates
 */
export function useGenerateNotesStreaming(
  options?: UseApiOptions<string>
) {
  const [state, setState] = useState<UseApiState<string>>({
    data: "",
    loading: false,
    error: null,
    success: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (sourceIds: string | string[], prompt?: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setState({
        data: "",
        loading: true,
        error: null,
        success: false,
      });

      try {
        const content = await apiClient.generateNotesStreaming(
          sourceIds,
          prompt,
          (chunk) => {
            setState((prev) => ({
              ...prev,
              data: (prev.data || "") + chunk,
            }));
          }
        );

        setState({
          data: content,
          loading: false,
          error: null,
          success: true,
        });
        options?.onSuccess?.(content);
        return content;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({
          data: "",
          loading: false,
          error,
          success: false,
        });
        options?.onError?.(error);
        return null;
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setState({
      data: "",
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  return { ...state, generate, reset };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for health check
 */
export function useHealthCheck(options?: UseApiOptions) {
  return useApi(
    () => apiClient.getHealth(),
    options
  );
}

/**
 * Hook for handling API errors with user-friendly messages
 */
export function useErrorMessage(error: Error | null): string {
  if (!error) return "";

  if (error instanceof RateLimitError) {
    return `Rate limited. Please retry in ${error.retryAfter} seconds.`;
  }

  if (error instanceof ValidationError) {
    return `Validation error: ${error.message}`;
  }

  if (error instanceof APIError) {
    if (error.statusCode === 404) {
      return "Resource not found";
    }
    if (error.statusCode >= 500) {
      return "Server error. Please try again later.";
    }
    if (error.statusCode === 0) {
      return "Network error. Please check your connection.";
    }
  }

  return error.message || "An error occurred";
}
