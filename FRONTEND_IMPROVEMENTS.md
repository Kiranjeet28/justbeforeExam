# Frontend Improvements Guide

## Overview

The frontend has been significantly enhanced with:
- **Robust API Client** - Type-safe communication with backend
- **Custom React Hooks** - Reusable state management and data fetching
- **Toast Notification System** - User-friendly feedback mechanism
- **Error Handling** - Comprehensive error management and user messaging
- **Improved Components** - Better UX with forms, loading states, and validation
- **Type Safety** - Full TypeScript support with proper interfaces

---

## Architecture

### Directory Structure

```
justbeforeExam/frontend/src/
├── app/
│   ├── layout.tsx          # Root layout with ToastProvider
│   ├── page.tsx            # Main page
│   └── globals.css         # Global styles
├── components/
│   ├── ReportTab.tsx       # Improved report generation
│   ├── GenerateReport.tsx  # Report generation component
│   └── [other components]
├── lib/
│   └── api.ts              # Enhanced API client (NEW)
├── hooks/
│   └── useApi.ts           # Custom React hooks (NEW)
├── providers/
│   └── ToastProvider.tsx   # Toast notification system (NEW)
└── [other directories]
```

---

## 1. API Client (`lib/api.ts`)

### Features

✅ **Type-Safe Interfaces** - Full TypeScript support
✅ **Error Handling** - Custom error classes for different scenarios
✅ **Rate Limiting** - Automatic handling of 429 responses
✅ **Request Timeout** - 30-second timeout with abort support
✅ **Validation** - Client-side validation helpers
✅ **Pagination** - Built-in pagination support

### Custom Error Classes

```typescript
// Error hierarchy
APIError (base)
├── ValidationError    // 400 errors
├── NotFoundError      // 404 errors
├── RateLimitError     // 429 errors with retry info
└── ServerError        // 5xx errors
```

### Basic Usage

```typescript
import { apiClient, APIError, RateLimitError } from "@/lib/api";

// Create a source
const source = await apiClient.createSource({
  type: "video",
  content: "Video transcript content",
  video_id: "dQw4w9WgXcQ",
});

// Get sources with pagination
const response = await apiClient.getSources(1, 20);
console.log(response.items); // Source[]
console.log(response.total); // Total count

// Handle errors
try {
  await apiClient.createReport({
    content: "My report",
    title: "Study Guide",
  });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof ValidationError) {
    console.log(`Validation failed: ${error.message}`);
  }
}
```

### Available Methods

#### Sources
- `createSource(payload: SourceCreate): Promise<Source>`
- `getSources(page?: number, pageSize?: number): Promise<PaginatedResponse<Source>>`
- `getSource(id: number): Promise<Source>`
- `updateSource(id: number, payload: SourceUpdate): Promise<Source>`
- `deleteSource(id: number): Promise<{ success: boolean }>`

#### Reports
- `createReport(payload: ReportCreate): Promise<Report>`
- `getReports(page?: number, pageSize?: number): Promise<PaginatedResponse<Report>>`
- `getReport(id: number): Promise<Report>`
- `updateReport(id: number, payload: ReportUpdate): Promise<Report>`
- `deleteReport(id: number): Promise<{ success: boolean }>`

#### Generation
- `generateNotes(sourceIds?: string | string[], prompt?: string): Promise<{ content: string; model: string }>`
- `generateReport(sourceIds?: string | string[], prompt?: string, title?: string, save?: boolean): Promise<Report>`
- `transformNotes(content: string): Promise<{ success: boolean; artifacts: ... }>`
- `generateCheatSheet(sourceIds?: number[], topic?: string): Promise<{ content: string }>`
- `generateNotesStreaming(sourceIds?: string | string[], prompt?: string, onChunk?: (chunk: string) => void): Promise<string>`

---

## 2. Custom Hooks (`hooks/useApi.ts`)

### Generic Hooks

#### `useApi<T>` - Data Fetching

```typescript
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/lib/api";

function MyComponent() {
  const { data, loading, error, execute, reset, retry } = useApi(
    () => apiClient.getSources(1, 20),
    {
      autoFetch: true,           // Auto-execute on mount
      onSuccess: (data) => {
        console.log("Sources loaded:", data);
      },
      onError: (error) => {
        console.error("Failed to load sources:", error);
      },
      retryCount: 3,             // Retry on rate limit
      retryDelay: 1000,          // Delay between retries
    }
  );

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && <p>Found {data.total} sources</p>}
      <button onClick={() => execute()}>Refresh</button>
      <button onClick={() => reset()}>Clear</button>
      <button onClick={() => retry()}>Retry</button>
    </div>
  );
}
```

#### `useMutation<TInput, TOutput>` - Create/Update/Delete

```typescript
import { useMutation } from "@/hooks/useApi";
import { apiClient } from "@/lib/api";

function CreateSourceForm() {
  const { mutate, loading, error, success } = useMutation(
    (payload) => apiClient.createSource(payload),
    {
      onSuccess: (data) => {
        console.log("Source created:", data);
      },
      onError: (error) => {
        console.error("Failed to create:", error);
      },
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await mutate({
      type: "note",
      content: "My notes",
    });
    
    if (result) {
      console.log("Success!");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create"}
      </button>
      {error && <p className="error">{error.message}</p>}
    </form>
  );
}
```

### Feature-Specific Hooks

#### `useGenerateReport`

```typescript
import { useGenerateReport } from "@/hooks/useApi";

function ReportGenerator() {
  const { mutate, loading, error, data } = useGenerateReport({
    onSuccess: (report) => {
      console.log("Report created:", report);
    },
  });

  const handleGenerate = async () => {
    await mutate({
      sourceIds: ["1", "2", "3"],
      prompt: "Create a study guide",
      title: "My Report",
      save: true,
    });
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate Report"}
      </button>
      {data && <p>Report: {data.content}</p>}
    </div>
  );
}
```

#### `useGenerateNotes`

```typescript
import { useGenerateNotes } from "@/hooks/useApi";

function NotesGenerator() {
  const { mutate, loading, data } = useGenerateNotes();

  const handleGenerate = async () => {
    const result = await mutate({
      sourceIds: "all",
      prompt: "Generate comprehensive notes",
    });
    
    if (result) {
      console.log("Notes:", result.content);
      console.log("Model used:", result.model);
    }
  };

  return (
    <button onClick={handleGenerate} disabled={loading}>
      {loading ? "Generating..." : "Generate Notes"}
    </button>
  );
}
```

#### `useTransformNotes`

```typescript
import { useTransformNotes } from "@/hooks/useApi";

function NoteTransformer({ content }) {
  const { mutate, loading, data } = useTransformNotes();

  const handleTransform = async () => {
    await mutate(content);
  };

  return (
    <>
      <button onClick={handleTransform} disabled={loading}>
        {loading ? "Transforming..." : "Transform to Artifacts"}
      </button>
      {data && (
        <div>
          <p>Cheat Sheet: {data.artifacts.cheat_sheet}</p>
          <p>Mind Map: {JSON.stringify(data.artifacts.mind_map)}</p>
        </div>
      )}
    </>
  );
}
```

#### `useCreateSource`, `useGetSources`, `useDeleteSource`, etc.

```typescript
// Creating a source
const { mutate: createSource } = useCreateSource();
await createSource({
  type: "video",
  content: "Transcript",
  video_id: "abc123",
});

// Getting sources
const { data: sources } = useGetSources(1, 20, { autoFetch: true });

// Deleting a source
const { mutate: deleteSource } = useDeleteSource();
await deleteSource(sourceId);

// Full example with error handling
const SourceManager = () => {
  const { data: sources, execute: fetchSources } = useGetSources(1, 20);
  const { mutate: createSource } = useCreateSource();
  const { mutate: deleteSource } = useDeleteSource();
  const { showSuccess, showError } = useToast();

  const handleCreate = async (payload) => {
    const result = await createSource(payload);
    if (result) {
      showSuccess("Source created!");
      await fetchSources();
    }
  };

  const handleDelete = async (sourceId) => {
    const result = await deleteSource(sourceId);
    if (result) {
      showSuccess("Source deleted!");
      await fetchSources();
    }
  };

  return (
    <div>
      {sources?.items.map((source) => (
        <div key={source.id}>
          <p>{source.type}: {source.content}</p>
          <button onClick={() => handleDelete(source.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
};
```

---

## 3. Toast Notification System (`providers/ToastProvider.tsx`)

### Setup

Wrap your app with `ToastProvider` in `layout.tsx`:

```typescript
import { ToastProvider } from "@/providers/ToastProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
```

### Usage

```typescript
import { useToast } from "@/providers/ToastProvider";

function MyComponent() {
  const { showSuccess, showError, showInfo, showWarning } = useToast();

  const handleSuccess = () => {
    showSuccess("Operation completed successfully!");
  };

  const handleError = () => {
    showError("Something went wrong. Please try again.");
  };

  const handleInfo = () => {
    showInfo("Here's some useful information for you.");
  };

  const handleWarning = () => {
    showWarning("Please be careful with this action.");
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleInfo}>Show Info</button>
      <button onClick={handleWarning}>Show Warning</button>
    </div>
  );
}
```

### Toast Types

- **Success** (Green) - Operation completed
- **Error** (Red) - Operation failed
- **Info** (Blue) - Informational messages
- **Warning** (Yellow) - Warning/caution messages

### Features

✅ Auto-dismisses after 3 seconds (configurable)
✅ Multiple toasts stack vertically
✅ Smooth animations
✅ Manual close button
✅ Responsive design (mobile-friendly)

---

## 4. Improved Components

### ReportTab Component

**Features:**
- Real API integration
- Form for customization
- Loading states
- Error handling
- Report preview
- Copy to clipboard
- Download as markdown
- Title and prompt inputs

**Usage:**

```typescript
import ReportTab from "@/components/ReportTab";

function Page() {
  return <ReportTab sourcesCount={3} />;
}
```

### Integration with Hooks and Toast

```typescript
import { useGenerateReport } from "@/hooks/useApi";
import { useToast } from "@/providers/ToastProvider";
import { RateLimitError, ValidationError } from "@/lib/api";

function MyComponent() {
  const { mutate: generateReport, loading, error } = useGenerateReport({
    onSuccess: (report) => {
      showSuccess("Report generated!");
    },
    onError: (error) => {
      if (error instanceof RateLimitError) {
        showWarning(`Rate limited. Retry in ${error.retryAfter}s`);
      } else if (error instanceof ValidationError) {
        showError(`Validation: ${error.message}`);
      }
    },
  });

  const { showSuccess, showError, showWarning } = useToast();

  return (
    <button onClick={() => generateReport({ sourceIds: "all" })}>
      {loading ? "Loading..." : "Generate"}
    </button>
  );
}
```

---

## 5. Error Handling Patterns

### Pattern 1: Try-Catch with Toast

```typescript
async function handleAction() {
  try {
    const result = await apiClient.createSource(payload);
    toast.showSuccess("Source created!");
    return result;
  } catch (error) {
    if (error instanceof RateLimitError) {
      toast.showWarning(`Try again in ${error.retryAfter}s`);
    } else if (error instanceof ValidationError) {
      toast.showError(`Invalid: ${error.message}`);
    } else if (error instanceof APIError) {
      toast.showError(`Error: ${error.message}`);
    }
  }
}
```

### Pattern 2: Hook-Based Error Handling

```typescript
const { mutate, error, loading } = useMutation(
  (input) => apiClient.createSource(input),
  {
    onSuccess: (data) => {
      toast.showSuccess("Created!");
    },
    onError: (error) => {
      toast.showError(error.message);
    },
  }
);
```

### Pattern 3: Error Messages Hook

```typescript
import { useErrorMessage } from "@/hooks/useApi";

function ErrorDisplay({ error }) {
  const message = useErrorMessage(error);
  
  return error ? (
    <div className="error-box">
      {message}
    </div>
  ) : null;
}
```

---

## 6. Type Safety

### Type Definitions

All types are exported from `@/lib/api`:

```typescript
import {
  Source,
  SourceCreate,
  SourceUpdate,
  Report,
  ReportCreate,
  ReportUpdate,
  PaginatedResponse,
  ErrorResponse,
  HealthResponse,
} from "@/lib/api";

// Type-safe function
function processSource(source: Source) {
  console.log(source.id);      // number
  console.log(source.type);    // "video" | "link" | "note"
  console.log(source.content); // string
}
```

### Validation Helpers

```typescript
import { validateSourceCreate, validateSourceIds } from "@/lib/api";

// Validate before sending
const payload = { type: "video", content: "..." };
if (validateSourceCreate(payload)) {
  await apiClient.createSource(payload);
}

// Validate source IDs
if (validateSourceIds("1,2,3")) {
  console.log("Valid");
}
```

---

## 7. Best Practices

### ✅ DO:

1. **Use Custom Hooks** for API calls
   ```typescript
   const { mutate, loading } = useCreateSource();
   ```

2. **Handle All Error Types** appropriately
   ```typescript
   if (error instanceof RateLimitError) { ... }
   if (error instanceof ValidationError) { ... }
   ```

3. **Show User Feedback** via Toast
   ```typescript
   toast.showSuccess("Operation complete!");
   ```

4. **Validate Input** before submission
   ```typescript
   if (!payload.content.trim()) {
     toast.showError("Content is required");
     return;
   }
   ```

5. **Use TypeScript** for type safety
   ```typescript
   const handleCreate = async (source: SourceCreate) => { ... }
   ```

### ❌ DON'T:

1. **Make direct fetch calls** - Use apiClient instead
   ```typescript
   // ❌ Bad
   const res = await fetch("/api/sources");
   
   // ✅ Good
   const sources = await apiClient.getSources();
   ```

2. **Ignore errors** - Always handle and show feedback
   ```typescript
   // ❌ Bad
   await apiClient.createSource(payload);
   
   // ✅ Good
   try {
     await apiClient.createSource(payload);
     toast.showSuccess("Created!");
   } catch (error) {
     toast.showError(error.message);
   }
   ```

3. **Mix API calls with UI logic** - Extract to hooks
   ```typescript
   // ❌ Bad - In component
   const [loading, setLoading] = useState(false);
   const handleCreate = async () => {
     setLoading(true);
     try { ... } finally { setLoading(false); }
   };
   
   // ✅ Good - Use hook
   const { mutate, loading } = useCreateSource();
   ```

4. **Hardcode URLs** - Use apiClient base URL
   ```typescript
   // ❌ Bad
   const res = await fetch("http://localhost:8000/api/...");
   
   // ✅ Good
   const res = await apiClient.createSource(...);
   ```

5. **Show generic errors** - Provide helpful messages
   ```typescript
   // ❌ Bad
   toast.showError("Error");
   
   // ✅ Good
   if (error instanceof RateLimitError) {
     toast.showWarning(`Rate limited. Retry in ${error.retryAfter}s`);
   } else {
     toast.showError(error.message);
   }
   ```

---

## 8. Migration Guide

### From Old to New API

**Before (Old Pattern):**
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sources");
      setData(await res.json());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

**After (New Pattern):**
```typescript
const { data, loading, error, execute } = useApi(
  () => apiClient.getSources(),
  { autoFetch: true }
);
```

### Integration Checklist

- [x] Import API client and hooks
- [x] Wrap app with `ToastProvider`
- [x] Replace direct fetch calls with `apiClient`
- [x] Replace manual state management with hooks
- [x] Add error handling with custom error classes
- [x] Show toast notifications for user feedback
- [x] Test all API operations
- [x] Verify error handling

---

## 9. Common Scenarios

### Scenario 1: Load and Display Data

```typescript
import { useGetSources } from "@/hooks/useApi";
import { useToast } from "@/providers/ToastProvider";

function SourcesList() {
  const { data, loading, error, retry } = useGetSources(1, 20, {
    autoFetch: true,
  });
  const { showError } = useToast();

  if (loading) return <div>Loading sources...</div>;

  if (error) {
    return (
      <div>
        <p>Failed to load: {error.message}</p>
        <button onClick={retry}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Sources ({data?.total})</h2>
      {data?.items.map((source) => (
        <div key={source.id}>{source.content}</div>
      ))}
    </div>
  );
}
```

### Scenario 2: Create with Validation

```typescript
import { useCreateSource } from "@/hooks/useApi";
import { useToast } from "@/providers/ToastProvider";
import { ValidationError } from "@/lib/api";

function CreateSourceForm() {
  const [content, setContent] = useState("");
  const { mutate, loading } = useCreateSource({
    onSuccess: () => {
      showSuccess("Source created!");
      setContent("");
    },
    onError: (error) => {
      if (error instanceof ValidationError) {
        showError(`Invalid: ${error.message}`);
      }
    },
  });
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      showError("Content is required");
      return;
    }

    if (content.length > 100000) {
      showError("Content too long");
      return;
    }

    await mutate({
      type: "note",
      content,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Enter content..."
      />
      <button disabled={loading}>{loading ? "Creating..." : "Create"}</button>
    </form>
  );
}
```

### Scenario 3: Handle Rate Limiting

```typescript
import { useGenerateReport } from "@/hooks/useApi";
import { useToast } from "@/providers/ToastProvider";
import { RateLimitError } from "@/lib/api";

function ReportGenerator() {
  const { mutate, loading, error } = useGenerateReport({
    onError: (error) => {
      if (error instanceof RateLimitError) {
        showWarning(
          `Rate limited. Please wait ${error.retryAfter} seconds before trying again.`
        );
        // Could auto-retry after delay
        setTimeout(() => {
          handleGenerate();
        }, error.retryAfter * 1000);
      }
    },
  });
  const { showWarning } = useToast();

  const handleGenerate = async () => {
    await mutate({ sourceIds: "all" });
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </button>
      {error instanceof RateLimitError && (
        <p>Retry after {error.retryAt}</p>
      )}
    </div>
  );
}
```

---

## 10. Environment Setup

### Configuration

Create a `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
```

The API client will use this URL:

```typescript
// Will use http://localhost:8000 as base
const apiClient = new APIClient(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
);
```

---

## 11. Testing

### Example Test

```typescript
import { apiClient, ValidationError } from "@/lib/api";

describe("API Client", () => {
  it("should create a source", async () => {
    const source = await apiClient.createSource({
      type: "note",
      content: "Test content",
    });
    expect(source.id).toBeDefined();
  });

  it("should throw ValidationError for empty content", async () => {
    await expect(
      apiClient.createSource({
        type: "note",
        content: "",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("should handle rate limiting", async () => {
    // Mock rate limit response
    // Should throw RateLimitError with retryAfter
  });
});
```

---

## Summary of Improvements

| Aspect | Before | After |
|--------|--------|-------|
| **API Integration** | Direct fetch calls | Type-safe API client |
| **State Management** | Manual useState | Custom hooks (useApi, useMutation) |
| **Error Handling** | Generic errors | Custom error classes with context |
| **User Feedback** | None/manual | Toast notification system |
| **Type Safety** | Limited types | Full TypeScript interfaces |
| **Code Reusability** | Limited | Highly reusable hooks |
| **Rate Limiting** | Manual handling | Automatic with retry logic |
| **Validation** | Client + server | Client validation helpers + server |
| **Error Messages** | Unclear | Clear, actionable messages |
| **Loading States** | Manual tracking | Automatic via hooks |

---

## Getting Started

1. **Import the API client:**
   ```typescript
   import { apiClient } from "@/lib/api";
   ```

2. **Use custom hooks in components:**
   ```typescript
   import { useGetSources } from "@/hooks/useApi";
   ```

3. **Show user feedback:**
   ```typescript
   import { useToast } from "@/providers/ToastProvider";
   ```

4. **Handle errors properly:**
   ```typescript
   import { APIError, ValidationError, RateLimitError } from "@/lib/api";
   ```

---

**Version:** 1.0  
**Last Updated:** January 2024  
**Status:** ✅ Production Ready