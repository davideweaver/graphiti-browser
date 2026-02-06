# Agent Tasks Implementation

## Overview

Successfully implemented a read-only "Agent Tasks" section in the graphiti-browser that displays scheduled tasks from xerro-service. This feature allows users to browse task configurations and execution history.

## Implementation Summary

### Files Created

1. **`src/types/agentTasks.ts`**
   - TypeScript interfaces for agent tasks
   - `ScheduledTask` - Task configuration with schedule, enabled status, properties
   - `TaskExecution` - Execution history entry with success/failure, duration, error details
   - `ScheduledTaskListResponse` - API response type

2. **`src/api/agentTasksService.ts`**
   - API service singleton for xerro-service
   - Methods:
     - `listTasks(enabled?, task?)` - List all tasks with optional filters
     - `getTask(id)` - Get single task details
     - `getTaskHistory(id, limit?)` - Get execution history (default 20)
   - Automatic error handling with toast notifications
   - Uses `VITE_XERRO_SERVICE_URL` env var (http://172.16.0.114:9205)

3. **`src/lib/cronFormatter.ts`**
   - Utility functions for formatting cron expressions and timestamps
   - `formatCronExpression()` - Converts cron to human-readable strings
     - Examples: "Every weekday at 9:00 AM", "Every 15 minutes"
     - Handles common patterns: daily, weekdays, weekends, monthly
   - `formatRelativeTime()` - Converts dates to relative strings ("2 hours ago")
   - `formatTimestamp()` - Formats dates for display

4. **`src/pages/AgentTasks.tsx`**
   - Task list page with table view
   - Features:
     - Search by task name (debounced)
     - Filter by enabled/disabled status
     - Table columns: Name, Status, Schedule, Task Type, Last Updated
     - Click row to navigate to detail page
   - Uses simple table component (not paginated)

5. **`src/pages/AgentTaskDetail.tsx`**
   - Task detail page showing full configuration
   - Sections:
     - **Summary Card** - Name, description, enabled status, schedule, timestamps
     - **Configuration Card** - Task type, properties (JSON display)
     - **Execution History Card** - Last 20 runs with status, duration, error messages
   - Visual indicators for success/failure with icons
   - Back button to return to list

### Files Modified

1. **`src/lib/navigationConfig.ts`**
   - Added `ListChecks` icon import from lucide-react
   - Added "Agent Tasks" primary nav item
   - Updated `getActivePrimary()` to handle `/agent-tasks` routes

2. **`src/layout/Router.tsx`**
   - Added routes:
     - `/agent-tasks` → AgentTasks list page
     - `/agent-tasks/:id` → AgentTaskDetail page
   - Uses lazy loading for code splitting

## Features

### List Page
- **Search**: Real-time search by task name with debouncing (300ms)
- **Filters**: Toggle between All/Enabled/Disabled tasks
- **Table Display**:
  - Name with description (if available)
  - Status badge (Enabled/Disabled)
  - Schedule (formatted cron or "One-time")
  - Task type (monospace font)
  - Last updated (relative time)
- **Navigation**: Click any row to view details

### Detail Page
- **Summary**: Full task metadata with formatted schedule
- **Configuration**: JSON display of task properties
- **Execution History**:
  - Last 20 executions
  - Success/failure indicators with icons
  - Timestamps, duration, error messages
  - Empty state when no history

## Technical Details

### API Integration
- **Base URL**: `VITE_XERRO_SERVICE_URL` from `.env` (http://172.16.0.114:9205)
- **Endpoints**:
  - `GET /api/v1/scheduled-tasks` - List tasks
  - `GET /api/v1/scheduled-tasks/{id}` - Get task details
  - `GET /api/v1/scheduled-tasks/{id}/history?limit=20` - Get execution history
- **Error Handling**: Automatic toast notifications on API failures

### State Management
- **React Query**: Caching and data fetching
  - Query keys: `["agent-tasks", filter]`, `["agent-task", id]`, `["agent-task-history", id]`
  - 5-minute stale time with 1 retry
- **No GraphitiContext**: Agent Tasks are global (not tied to graph selection)
- **URL State**: React Router for navigation

### UI Components
- **Container**: Page wrapper with title and tools
- **Table**: ShadCN UI table components (Table, TableRow, TableCell, etc.)
- **Badge**: Status indicators (enabled/disabled, success/failure)
- **Card**: Content sections in detail page
- **Icons**: lucide-react (ListChecks, CheckCircle2, XCircle, Clock, etc.)

## Cron Expression Formatting

The `formatCronExpression()` function handles common patterns:

| Cron Expression | Human-Readable Output |
|-----------------|----------------------|
| `* * * * *` | Every minute |
| `*/15 * * * *` | Every 15 minutes |
| `0 9 * * 1-5` | Every weekday at 9:00 AM |
| `0 9 * * 0,6` | Every weekend at 9:00 AM |
| `0 9 * * *` | Daily at 9:00 AM |
| `0 9 1 * *` | Monthly on the 1st at 9:00 AM |

Fallback: If pattern not recognized, displays raw cron expression.

## Testing Checklist

### Manual Testing
- [ ] Start dev server: `npm run dev`
- [ ] Verify xerro-service is running: `curl http://172.16.0.114:9205/api/v1/scheduled-tasks`
- [ ] Navigate to Agent Tasks via primary nav icon
- [ ] Test list page:
  - [ ] Tasks display in table
  - [ ] Enabled/Disabled badges show correctly
  - [ ] Schedule formatting works
  - [ ] Search filters tasks by name
  - [ ] Enabled/Disabled filter works
  - [ ] Click row navigates to detail
- [ ] Test detail page:
  - [ ] Task details display
  - [ ] Configuration shows properties
  - [ ] Execution history displays (if available)
  - [ ] Success/failure indicators work
  - [ ] Back button returns to list
- [ ] Test error states:
  - [ ] Stop xerro-service temporarily
  - [ ] Verify error toast appears
  - [ ] Verify empty states display
- [ ] Test responsive design:
  - [ ] Mobile viewport
  - [ ] Table scrolls or adapts

### API Testing
```bash
# List all tasks
curl http://172.16.0.114:9205/api/v1/scheduled-tasks

# Get single task (replace {id} with real ID)
curl http://172.16.0.114:9205/api/v1/scheduled-tasks/{id}

# Get execution history
curl http://172.16.0.114:9205/api/v1/scheduled-tasks/{id}/history
```

## Notes

- **Read-only**: No create, update, delete, or execute functionality
- **Global scope**: Not tied to graph/groupId selection
- **Performance**: React Query caching reduces API calls
- **Future enhancements**: Can add edit/delete/execute with mutations

## Configuration

Environment variable already configured in `.env`:
```
VITE_XERRO_SERVICE_URL=http://172.16.0.114:9205
```

No additional setup required.
