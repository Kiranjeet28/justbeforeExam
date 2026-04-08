# Frontend Quick Start Guide

## 🚀 What's New

Your frontend now has:
- ✅ **Type-safe API client** - No more manual fetch calls
- ✅ **Custom React hooks** - Reusable data fetching logic
- ✅ **Toast notifications** - User-friendly feedback system
- ✅ **Error handling** - Smart error messages based on error type
- ✅ **Better UX** - Loading states, validation, animations

---

## 📦 Installation & Setup

### 1. No Installation Needed
All improvements are already integrated! Just make sure your app is running:

```bash
npm run dev
```

### 2. Verify Backend is Running
The frontend expects the backend at `http://localhost:8000`:

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

### 3. Check Environment
Make sure `.env.local` has:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🎯 5-Minute Quick Start

### Using the API Client

```typescript
import { apiClient } from "@/lib/api";

// Create a source
const source = await apiClient.createSource({
  type: "note",
  content: "My study notes",
});

// Get sources
const { items, total } = await apiClient.getSources(1, 20);

// Generate a report
const report = await apiClient.generateReport(
  "all",                          // sourceIds
  "Create study guide",           // prompt
  "My Report"                     // title
);
```

### Using Custom Hooks

```typescript
import { useGetSources, useCreateReport } from "@/hooks/useApi";
import { useToast } from "@/providers/ToastProvider";

export function MyComponent() {
  // Fetch data
  const { data: sources, loading, error } = useGetSources(1, 20, {
    autoFetch: true,
  });

  // Generate report
  const { mutate: generateReport, loading: generating } = useGenerateReport();

  // Show notifications
  const { showSuccess, showError } = useToast();

  const handleGenerate = async () => {
    try {
      const result = await generateReport({
        sourceIds: "all",
        prompt: "Create comprehensive study guide",
      });
      showSuccess("Report generated!");
    } catch (error) {
      showError(error.message);
    }
  };

  if (loading) return <div>Loading sources...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Found {sources?.total} sources</h2>
      <button onClick={handleGenerate} disabled={generating}>
        {generating ? "Generating..." : "Generate Report"}
      </button>
    </div>
  );
}
```

---

## 📋 Common Tasks

### Task 1: Display List of Sources

```typescript
import { useGetSources } from "@/hooks/useApi";

function SourceList() {
  const { data, loading, error } = useGetSources(1, 20, {
    autoFetch: true,
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      {data?.items.map((source) => (
        <div key={source.id}>
          <p>{source.type}: {source.content}</p>
        </div>
      ))}
    </div>
  );
}
```

### Task 2: Create a Source with Form

```typescript
import { useCreateSource } from "@/hooks/useApi";
import { useToast } from "@/providers/ToastProvider";
import { useState } from "react";

function CreateSourceForm() {
  const [content, setContent] = useState("");
  const { mutate: createSource, loading } = useCreateSource();
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      showError("Content is required");
      return;
    }

    const result = await createSource({
      type: "note",
      content,
    });

    if (result) {
      showSuccess("Source created!");
      setContent("");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Enter your notes..."
      />
      <button disabled={loading}>
        {loading ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
```

### Task 3: Generate Report with Custom Settings

```typescript
import { useGenerateReport } from "@/hooks/useApi";
import { useToast } from "@/providers/ToastProvider";
import { RateLimitError } from "@/lib/api";
import { useState } from "react";

function ReportGenerator() {
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const { mutate: generateReport, loading } = useGenerateReport();
  const { showSuccess, showError, showWarning } = useToast();

  const handleGenerate = async (e) => {
    e.preventDefault();

    try {
      const result = await generateReport({
        sourceIds: "all",
        prompt: prompt || "Create comprehensive study guide",
        title: title || "Study Report",
        save: true,
      });

      if (result) {
        showSuccess("Report generated successfully!");
      }
    } catch (error) {
      if (error instanceof RateLimitError) {
        showWarning(`Rate limited. Retry in ${error.retryAfter} seconds.`);
      } else {
        showError(error.message);
      }
    }
  };

  return (
    <form onSubmit={handleGenerate}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Report title (optional)"
      />
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Instructions for report generation..."
        rows={4}
      />
      <button disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </button>
    </form>
  );
}
```

### Task 4: Handle Different Error Types

```typescript
import { apiClient, APIError, RateLimitError, ValidationError } from "@/lib/api";
import { useToast } from "@/providers/ToastProvider";

function ErrorHandlingExample() {
  const { showError, showWarning, showInfo } = useToast();

  const handleCreateSource = async () => {
    try {
      await apiClient.createSource({
        type: "video",
        content: "My content",
      });
      showInfo("Source created!");
    } catch (error) {
      if (error instanceof RateLimitError) {
        // Rate limited - show when to retry
        showWarning(
          `Service is busy. Please try again in ${error.retryAfter} seconds.`
        );
      } else if (error instanceof ValidationError) {
        // Validation error - show validation issue
        showError(`Invalid data: ${error.message}`);
      } else if (error instanceof APIError) {
        // Other API errors
        if (error.statusCode === 404) {
          showError("Resource not found");
        } else if (error.statusCode >= 500) {
          showError("Server error. Please try again later.");
        } else {
          showError(error.message);
        }
      }
    }
  };

  return <button onClick={handleCreateSource}>Create Source</button>;
}
```

### Task 5: Delete with Confirmation

```typescript
import { useDeleteSource } from "@/hooks/useApi";
import { useToast } from "@/providers/ToastProvider";

function SourceItem({ sourceId, onDeleted }) {
  const { mutate: deleteSource, loading } = useDeleteSource();
  const { showSuccess, showError } = useToast();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this source?")) {
      return;
    }

    const result = await deleteSource(sourceId);
    if (result) {
      showSuccess("Source deleted!");
      onDeleted?.();
    }
  };

  return (
    <button onClick={handleDelete} disabled={loading}>
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
```

---

## 🎨 Hook Reference

### Data Fetching Hooks

```typescript
// Get sources
const { data, loading, error, execute, retry } = useGetSources(page, pageSize);

// Get single source
const { data, loading, error, execute } = useGetSource(sourceId);

// Get reports
const { data, loading, error, execute, retry } = useGetReports(page, pageSize);

// Get single report
const { data, loading, error, execute } = useGetReport(reportId);

// Health check
const { data, loading, error } = useHealthCheck({ autoFetch: true });
```

### Mutation Hooks

```typescript
// Create
const { mutate, loading, error, data } = useCreateSource();
const { mutate, loading, error, data } = useCreateReport();

// Update
const { mutate, loading, error, data } = useUpdateSource();
const { mutate, loading, error, data } = useUpdateReport();

// Delete
const { mutate, loading, error, data } = useDeleteSource();
const { mutate, loading, error, data } = useDeleteReport();
```

### Generation Hooks

```typescript
// Generate notes
const { mutate, loading, error, data } = useGenerateNotes();

// Generate report
const { mutate, loading, error, data } = useGenerateReport();

// Transform notes
const { mutate, loading, error, data } = useTransformNotes();

// Generate cheat sheet
const { mutate, loading, error, data } = useGenerateCheatSheet();

// Stream generation (real-time)
const { generate, loading, data, error } = useGenerateNotesStreaming();
```

---

## 🔔 Toast Notifications

### Basic Usage

```typescript
import { useToast } from "@/providers/ToastProvider";

function MyComponent() {
  const { showSuccess, showError, showInfo, showWarning } = useToast();

  return (
    <div>
      <button onClick={() => showSuccess("Success!")}>Show Success</button>
      <button onClick={() => showError("Error!")}>Show Error</button>
      <button onClick={() => showInfo("Info!")}>Show Info</button>
      <button onClick={() => showWarning("Warning!")}>Show Warning</button>
    </div>
  );
}
```

### With Custom Duration

```typescript
const { showSuccess } = useToast();

// Show for 5 seconds
showSuccess("Operation complete!", 5000);

// Show indefinitely (0 = no auto-dismiss)
showWarning("Important: This action cannot be undone", 0);
```

---

## 🔍 API Client Methods

### Sources

```typescript
import { apiClient } from "@/lib/api";

// Create
await apiClient.createSource({
  type: "video" | "link" | "note",
  content: string,
  video_id?: string,
});

// Read (all)
await apiClient.getSources(page, pageSize);

// Read (single)
await apiClient.getSource(id);

// Update
await apiClient.updateSource(id, {
  type?: "video" | "link" | "note",
  content?: string,
});

// Delete
await apiClient.deleteSource(id);
```

### Reports

```typescript
// Create
await apiClient.createReport({
  content: string,
  title?: string,
  source_ids?: string,  // "all" or "1,2,3"
  prompt?: string,
});

// Read (all)
await apiClient.getReports(page, pageSize);

// Read (single)
await apiClient.getReport(id);

// Update
await apiClient.updateReport(id, {
  content?: string,
  title?: string,
});

// Delete
await apiClient.deleteReport(id);
```

### Generation

```typescript
// Generate notes
await apiClient.generateNotes(
  sourceIds,  // "all" or ["1", "2"]
  prompt      // optional
);

// Generate report
await apiClient.generateReport(
  sourceIds,
  prompt,
  title,
  save
);

// Transform notes
await apiClient.transformNotes(content);

// Generate cheat sheet
await apiClient.generateCheatSheet(sourceIds, topic);

// Stream generation
await apiClient.generateNotesStreaming(
  sourceIds,
  prompt,
  (chunk) => console.log(chunk)  // Real-time chunks
);
```

---

## ⚙️ Configuration

### Change API URL

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=https://api.example.com
```

Or change in code:
```typescript
import { APIClient } from "@/lib/api";
const client = new APIClient("https://api.example.com");
```

### Change Request Timeout

Edit `src/lib/api.ts`:
```typescript
private timeout: number = 60000; // 60 seconds instead of 30
```

---

## 🐛 Debugging

### Enable Console Logging

```typescript
// In your component
const { mutate, error } = useCreateSource();

const handleCreate = async () => {
  try {
    const result = await mutate(payload);
    console.log("Success:", result);
  } catch (error) {
    console.error("Failed:", error);
    if (error instanceof RateLimitError) {
      console.log("Retry after:", error.retryAfter, "seconds");
    }
  }
};
```

### Check Network Requests

1. Open DevTools (F12)
2. Go to Network tab
3. Look for requests to `/api/*`
4. Check response status and headers

### Common Issues

**Issue**: "useToast must be used within ToastProvider"
- **Solution**: Make sure your component is inside the app wrapped with `<ToastProvider>`

**Issue**: API calls failing with 404
- **Solution**: Check backend is running on `http://localhost:8000`

**Issue**: Types not found (red squiggles in IDE)
- **Solution**: Run `npm install` and restart your IDE

**Issue**: Notifications not showing
- **Solution**: Check that `ToastProvider` wraps your app in `layout.tsx`

---

## 📚 Example: Complete App

```typescript
"use client";

import { useGetSources, useCreateSource, useGenerateReport } from "@/hooks/useApi";
import { useToast } from "@/providers/ToastProvider";
import { useState } from "react";

export default function StudyApp() {
  const [newContent, setNewContent] = useState("");

  // Fetch sources
  const { data: sources, loading: loadingSources, execute: refreshSources } = 
    useGetSources(1, 20, { autoFetch: true });

  // Create source
  const { mutate: createSource, loading: creating } = useCreateSource({
    onSuccess: () => {
      showSuccess("Source added!");
      setNewContent("");
      refreshSources();
    },
  });

  // Generate report
  const { mutate: generateReport, loading: generating } = useGenerateReport({
    onSuccess: () => showSuccess("Report generated!"),
  });

  const { showSuccess, showError } = useToast();

  const handleAddSource = async () => {
    if (!newContent.trim()) {
      showError("Content is required");
      return;
    }

    await createSource({
      type: "note",
      content: newContent,
    });
  };

  const handleGenerateReport = async () => {
    if (!sources?.items.length) {
      showError("Add sources first");
      return;
    }

    await generateReport({
      sourceIds: "all",
      prompt: "Create comprehensive study guide",
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h1>Study App</h1>

      {/* Add Source Form */}
      <div>
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Add your notes here..."
          rows={4}
        />
        <button onClick={handleAddSource} disabled={creating}>
          {creating ? "Adding..." : "Add Source"}
        </button>
      </div>

      {/* Sources List */}
      <div>
        <h2>Sources ({sources?.total})</h2>
        {loadingSources && <p>Loading...</p>}
        {sources?.items.map((source) => (
          <div key={source.id} className="p-2 border rounded">
            <p>{source.type}: {source.content.substring(0, 50)}...</p>
          </div>
        ))}
      </div>

      {/* Generate Report Button */}
      <button onClick={handleGenerateReport} disabled={generating}>
        {generating ? "Generating..." : "Generate Report"}
      </button>
    </div>
  );
}
```

---

## 🎓 Next Steps

1. **Explore the hooks** - Check `src/hooks/useApi.ts` for all available hooks
2. **Read the full guide** - See `FRONTEND_IMPROVEMENTS.md` for detailed documentation
3. **Update your components** - Replace old patterns with new hooks
4. **Test error handling** - Try different error scenarios
5. **Customize toasts** - Add icons, colors, and custom messages

---

## ✅ Checklist

- [ ] Backend running at `http://localhost:8000`
- [ ] Frontend running with `npm run dev`
- [ ] `NEXT_PUBLIC_API_URL` set in `.env.local`
- [ ] `ToastProvider` wraps app in `layout.tsx`
- [ ] Can import from `@/lib/api`
- [ ] Can import from `@/hooks/useApi`
- [ ] Can import from `@/providers/ToastProvider`
- [ ] First API call works without errors
- [ ] Toast notifications display correctly
- [ ] Error handling works for different error types

---

## 📞 Support

If you get stuck:
1. Check the error message in console
2. Review `FRONTEND_IMPROVEMENTS.md` for detailed explanations
3. Look at component examples in `src/components/`
4. Check network requests in DevTools

---

**Happy coding! 🚀**