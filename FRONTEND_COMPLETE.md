# 🎨 Frontend Complete Implementation Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [API Client](#api-client)
3. [Custom Hooks](#custom-hooks)
4. [Toast System](#toast-system)
5. [Component Examples](#component-examples)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The frontend has been completely rebuilt with:

✅ **Type-Safe API Client** (`lib/api.ts`) - Communicate with backend safely
✅ **Custom React Hooks** (`hooks/useApi.ts`) - Reusable state management
✅ **Toast Notification System** (`providers/ToastProvider.tsx`) - User feedback
✅ **Enhanced Components** - Real functionality with validation
✅ **Error Handling** - Smart error management with 6 error types

### Architecture Flow

```
User Interface (Components)
         ↓
Custom Hooks (useApi, useCreateSource, etc.)
         ↓
API Client (apiClient with validation)
         ↓
Toast System (showSuccess, showError, etc.)
         ↓
Backend API (http://localhost:8000)
```

---

## 🔌 API Client (`lib/api.ts`)

### Overview

The API client is a type-safe wrapper around the Fetch API that handles:
- Request/response validation
- Automatic retry on rate limits
- Custom error classes
- Request timeouts
- Pagination

### Key Classes

#### APIClient
```typescript
class APIClient {
  // Sources
  createSource(payload: SourceCreate): Promise<Source>
  getSources(page?: number, pageSize?: number): Promise<PaginatedResponse<Source>>
  getSource(id: number): Promise<Source>
  updateSource(id: number, payload: SourceUpdate): Promise<Source>
  deleteSource(id: number): Promise<{ success: boolean }>

  // Reports
  createReport(payload: ReportCreate): Promise<Report>
  getReports(page?: number, pageSize?: number): Promise<PaginatedResponse<Report>>
  getReport(id: number): Promise<Report>
  updateReport(id: number, payload: ReportUpdate): Promise<Report>
  deleteReport(id: number): Promise<{ success: boolean }>

  // Generation
  generateNotes(sourceIds?: string | string[], prompt?: string): Promise<{ content: string; model: string }>
  generateReport(sourceIds?: string | string[], prompt?: string, title?: string, save?: boolean): Promise<Report>
  transformNotes(content: string): Promise<{ success: boolean; artifacts: any }>
  generateCheatSheet(sourceIds?: number[], topic?: string): Promise<{ content: string }>
  generateNotesStreaming(sourceIds?: string | string[], prompt?: string, onChunk?: (chunk: string) => void): Promise<string>

  // Health
  getHealth(): Promise<HealthResponse>
}

// Singleton instance
export const apiClient = new APIClient();
```

#### Error Classes
```typescript
APIError
├─ ValidationError (400 errors)
├─ NotFoundError (404 errors)
├─ RateLimitError (429 errors)
└─ ServerError (5xx errors)
```

### Usage Examples

```typescript
import { apiClient, RateLimitError, ValidationError } from "@/lib/api";

// Create a source
try {
  const source = await apiClient.createSource({
    type: "note",
    content: "My study notes",
  });
  console.log("Created:", source);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error("Invalid data:", error.message);
  }
}

// Get sources with pagination
const response = await apiClient.getSources(1, 20);
console.log(response.items);    // Source[]
console.log(response.total);    // Total count
console.log(response.page);     // Current page
console.log(response.page_size);// Items per page

// Generate report
const report = await apiClient.generateReport(
  "all",  // sourceIds: "all" or "1,2,3"
  "Create comprehensive study guide",  // prompt
  "My Study Guide"  // title
);
```

---

## 🪝 Custom Hooks (`hooks/useApi.ts`)

### Overview

Custom hooks provide reusable logic for:
- Data fetching with automatic loading/error states
- Mutations (create/update/delete)
- Error handling with callbacks
- Automatic retry on rate limits

### Generic Hooks

#### useApi<T> - Data Fetching
```typescript
const { 
  data,           // The fetched data (type T)
  loading,        // Is fetching? (boolean)
  error,          // Error object (Error | null)
  success,        // Did last fetch succeed? (boolean)
  execute,        // Function to manually execute fetch
  reset,          // Function to clear state
  retry           // Function to retry on error
} = useApi(
  () => apiClient.getSources(),  // API function
  {
    autoFetch: true,   // Auto-execute on mount
    onSuccess: (data) => console.log("Loaded:", data),
    onError: (error) => console.error("Failed:", error),
    retryCount: 3,     // Retry count for rate limits
    retryDelay: 1000   // Delay between retries
  }
);
```

#### useMutation<TInput, TOutput> - Create/Update/Delete
```typescript
const {
  data,           // Result of mutation
  loading,        // Is mutating? (boolean)
  error,          // Error object (Error | null)
  success,        // Did mutation succeed? (boolean)
  mutate,         // Function to execute mutation
  reset           // Function to clear state
} = useMutation(
  (payload) => apiClient.createSource(payload),  // Mutation function
  {
    onSuccess: (result) => console.log("Created:", result),
    onError: (error) => console.error("Failed:", error),
    onSettled: (data, error) => console.log("Done")
  }
);

// Execute mutation
const result = await mutate({
  type: "note",
  content: "My notes"
});
```

### Domain-Specific Hooks

#### Sources
```typescript
// Create source
const { mutate: createSource, loading } = useCreateSource();
await createSource({ type: "note", content: "..." });

// Get sources (paginated)
const { data: sources, loading: loadingSources } = useGetSources(1, 20);

// Get single source
const { data: source } = useGetSource(sourceId);

// Update source
const { mutate: updateSource } = useUpdateSource();
await updateSource({ id: sourceId, payload: { content: "updated" } });

// Delete source
const { mutate: deleteSource } = useDeleteSource();
await deleteSource(sourceId);
```

#### Reports
```typescript
// Create report
const { mutate: createReport } = useCreateReport();
await createReport({
  content: "...",
  title: "My Report",
  source_ids: "1,2,3"
});

// Get reports
const { data: reports } = useGetReports(1, 20);

// Update report
const { mutate: updateReport } = useUpdateReport();
await updateReport({ id: reportId, payload: { title: "New Title" } });

// Delete report
const { mutate: deleteReport } = useDeleteReport();
await deleteReport(reportId);
```

#### Generation
```typescript
// Generate notes
const { mutate: generateNotes } = useGenerateNotes();
await generateNotes({
  sourceIds: ["1", "2"],
  prompt: "Create study notes"
});

// Generate report
const { mutate: generateReport } = useGenerateReport();
await generateReport({
  sourceIds: "all",
  prompt: "Create comprehensive guide",
  title: "Exam Prep",
  save: true
});

// Transform notes
const { mutate: transformNotes } = useTransformNotes();
await transformNotes(noteContent);

// Generate cheat sheet
const { mutate: generateCheatSheet } = useGenerateCheatSheet();
await generateCheatSheet({
  sourceIds: [1, 2, 3],
  topic: "Quantum Physics"
});

// Stream generation (real-time)
const { generate, data, loading } = useGenerateNotesStreaming();
await generate("all", "Generate notes");
// Access streamed content in data
```

---

## 🔔 Toast System (`providers/ToastProvider.tsx`)

### Setup

Add to root layout (`app/layout.tsx`):

```typescript
import { ToastProvider } from "@/providers/ToastProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
```

### Usage

```typescript
import { useToast } from "@/providers/ToastProvider";

export function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const handleClick = () => {
    showSuccess("Operation successful!");        // Green, 3s auto-dismiss
    showError("Something went wrong");            // Red, 3s auto-dismiss
    showWarning("Be careful with this");          // Yellow, 3s auto-dismiss
    showInfo("Just letting you know");            // Blue, 3s auto-dismiss
  };

  return <button onClick={handleClick}>Show Toast</button>;
}
```

### Types

- **Success** (Green) - ✅ Operation completed
- **Error** (Red) - ❌ Operation failed
- **Warning** (Yellow) - ⚠️ Caution/warning
- **Info** (Blue) - ℹ️ Informational

### Options

```typescript
const { showSuccess } = useToast();

// Default (3 second auto-dismiss)
showSuccess("Done!");

// Custom duration (5 seconds)
showSuccess("Operation complete!", 5000);

// No auto-dismiss
showWarning("Important!", 0);
```

---

## 🎨 Component Examples

### Example 1: Display List with Loading

```typescript
import { useGetSources } from "@/hooks/useApi";
import { useToast } from "@/providers/ToastProvider";

export function SourcesList() {
  const { data, loading, error, retry } = useGetSources(1, 20, {
    autoFetch: true
  });
  const { showError } = useToast();

  if (loading) return <div>Loading sources...</div>;

  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={() => retry()}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Sources ({data?.total})</h2>
      <div className="space-y-2">
        {data?.items.map((source) => (
          <div key={source.id} className="p-2 border rounded">
            <p><strong>{source.type}:</strong> {source.content}</p>
            <p className="text-sm text-gray-500">
              {new Date(source.timestamp).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 2: Create with Form

```typescript
import { useCreateSource } from "@/hooks/useApi";
import { useToast } from "@/providers/ToastProvider";
import { ValidationError } from "@/lib/api";
import { useState } from "react";

export function CreateSourceForm() {
  const [content, setContent] = useState("");
  const { mutate: createSource, loading, error } = useCreateSource({
    onSuccess: () => {
      showSuccess("Source created!");
      setContent("");
    }
  });
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      showError("Content is required");
      return;
    }

    if (content.length > 100000) {
      showError("Content is too long (max 100,000 characters)");
      return;
    }

    const result = await createSource({
      type: "note",
      content
    });

    if (result) {
      console.log("Created:", result);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Enter your notes..."
        rows={4}
        className="w-full p-2 border rounded"
      />

      {error && (
        <div className="p-2 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700">{error.message}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Source"}
      </button>
    </form>
  );
}
```

### Example 3: Generate Report

```typescript
import { useGenerateReport } from "@/hooks/useApi";
import { useToast } from "@/providers/ToastProvider";
import { RateLimitError, ValidationError } from "@/lib/api";
import { useState } from "react";

export function ReportGenerator({ sourcesCount }) {
  const [prompt, setPrompt] = useState("Create comprehensive study guide");
  const [title, setTitle] = useState("");
  const { mutate: generateReport, loading, data: report } = useGenerateReport();
  const { showSuccess, showError, showWarning } = useToast();

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!prompt.trim()) {
      showError("Prompt is required");
      return;
    }

    try {
      const result = await generateReport({
        sourceIds: "all",
        prompt,
        title: title || "Study Report",
        save: true
      });

      if (result) {
        showSuccess("Report generated successfully!");
      }
    } catch (error) {
      if (error instanceof RateLimitError) {
        showWarning(`Please wait ${error.retryAfter} seconds before retrying`);
      } else if (error instanceof ValidationError) {
        showError(`Validation error: ${error.message}`);
      } else {
        showError(error.message);
      }
    }
  };

  if (sourcesCount === 0) {
    return <p className="text-gray-500">Add sources to generate a report</p>;
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label className="block font-medium mb-2">Report Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional title"
            maxLength={255}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={5000}
            rows={4}
            className="w-full p-2 border rounded"
          />
          <p className="text-sm text-gray-500">{prompt.length}/5000</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </form>

      {report && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h3 className="font-bold mb-2">{report.title}</h3>
          <p className="text-sm text-gray-600 mb-4">
            Generated {new Date(report.timestamp).toLocaleString()}
          </p>
          <div className="prose prose-sm max-w-none">
            {report.content}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## ✅ Best Practices

### 1. Always Handle Errors
```typescript
// ✅ Good
try {
  const result = await apiClient.createSource(payload);
  showSuccess("Created!");
} catch (error) {
  if (error instanceof ValidationError) {
    showError(`Invalid: ${error.message}`);
  } else if (error instanceof RateLimitError) {
    showWarning(`Retry in ${error.retryAfter}s`);
  } else {
    showError(error.message);
  }
}

// ❌ Bad
const result = await apiClient.createSource(payload);  // No error handling
```

### 2. Use Hooks Instead of Manual State
```typescript
// ✅ Good
const { data, loading, error } = useGetSources(1, 20, { autoFetch: true });

// ❌ Bad
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
useEffect(() => {
  // Manual fetch logic...
}, []);
```

### 3. Validate Before Submission
```typescript
// ✅ Good
if (!content.trim()) {
  showError("Content is required");
  return;
}
if (content.length > 100000) {
  showError("Content too long");
  return;
}
await mutate(payload);

// ❌ Bad
await mutate(payload);  // No validation
```

### 4. Show User Feedback
```typescript
// ✅ Good
const { mutate } = useCreateSource({
  onSuccess: () => showSuccess("Created!"),
  onError: (error) => showError(error.message)
});

// ❌ Bad
const { mutate } = useCreateSource();  // No feedback
```

### 5. Use Type Safety
```typescript
// ✅ Good - Types are enforced
import { SourceCreate, Report } from "@/lib/api";
const payload: SourceCreate = { type: "note", content: "..." };

// ❌ Bad - Any type loses type safety
const payload: any = { type: "note", content: "..." };
```

---

## 🔧 Configuration

### Environment Variables
Create `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### API Base URL
Default: `http://localhost:8000`

To change:
1. Edit `.env.local`
2. Or modify `APIClient` constructor in `lib/api.ts`

### Request Timeout
Edit `lib/api.ts`:
```typescript
private timeout: number = 30000; // 30 seconds
```

---

## 🐛 Troubleshooting

### Issue: "useToast must be used within ToastProvider"
**Solution**: Ensure `ToastProvider` wraps your app in `layout.tsx`

### Issue: API calls failing with 404
**Solution**: 
1. Check backend is running: `python -m uvicorn main:app --reload --port 8000`
2. Verify `NEXT_PUBLIC_API_URL` in `.env.local`

### Issue: Types not found
**Solution**:
1. Run `npm install`
2. Restart IDE
3. Check `src/lib/api.ts` exists

### Issue: Loading state doesn't change
**Solution**: Make sure you're awaiting the `execute` or `mutate` function

### Issue: Toast notifications not showing
**Solution**: Check that `ToastProvider` wraps children in `layout.tsx`

### Issue: Rate limit errors
**Solution**: 
- Automatic retry happens after `error.retryAfter` seconds
- Or manually retry with `retry()` function
- Check if backend has rate limiting configured

---

## 📚 File Structure

```
frontend/src/
├── lib/
│   └── api.ts
│       ├─ APIClient class
│       ├─ Error classes
│       ├─ Type definitions
│       └─ Validation helpers
│
├── hooks/
│   └── useApi.ts
│       ├─ useApi<T>
│       ├─ useMutation<I,O>
│       ├─ Domain-specific hooks (15+)
│       └─ Error utilities
│
├── providers/
│   └── ToastProvider.tsx
│       ├─ Toast context
│       ├─ Toast container
│       ├─ Toast item component
│       └─ Animations
│
├── components/
│   └── ReportTab.tsx (enhanced)
│       ├─ Form inputs
│       ├─ Loading states
│       ├─ Error handling
│       └─ Report preview
│
└── app/
    └── layout.tsx (updated)
        └─ ToastProvider wrapper
```

---

## 🚀 Next Steps

1. **Review this guide** - Understand architecture
2. **Use example components** - Copy patterns
3. **Update existing components** - Apply improvements
4. **Test thoroughly** - Test all states
5. **Deploy** - Use deployment checklist

---

## 📞 Quick Reference

### Import Patterns
```typescript
// API client
import { apiClient, APIError, RateLimitError, ValidationError } from "@/lib/api";

// Hooks
import { useApi, useMutation, useGetSources, useCreateReport } from "@/hooks/useApi";

// Toast
import { useToast } from "@/providers/ToastProvider";

// Types
import { Source, Report, SourceCreate, ReportCreate } from "@/lib/api";
```

### Common Operations
```typescript
// Fetch
const { data, loading, error } = useApi(..., { autoFetch: true });

// Create
const { mutate, loading } = useMutation(async (input) => { ... });

// Toast
const { showSuccess, showError } = useToast();
showSuccess("Done!");
showError("Error!");

// Error handling
if (error instanceof RateLimitError) { ... }
if (error instanceof ValidationError) { ... }
```

---

**Version**: 1.0  
**Last Updated**: January 2024  
**Status**: ✅ Production Ready

Ready to build with confidence! 🚀