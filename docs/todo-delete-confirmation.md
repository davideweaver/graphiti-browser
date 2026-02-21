# Todo Delete Confirmation - Centralized Implementation

## Overview

Implemented a centralized delete confirmation system for todos across the application. All todo deletions now go through a consistent confirmation dialog that prevents accidental deletions.

## Implementation

### Core Hook: `useDeleteTodoConfirmation`

**Location:** `src/hooks/use-delete-todo-confirmation.tsx`

A reusable React hook that provides:

1. **Confirmation Dialog Management** - Opens/closes the confirmation dialog
2. **Mutation Handling** - Executes the delete API call with loading states
3. **Cache Invalidation** - Automatically invalidates all relevant todo queries
4. **Success Callbacks** - Optional callback after successful deletion

**Usage Pattern:**

```tsx
const { confirmDelete, DeleteConfirmationDialog } = useDeleteTodoConfirmation({
  onSuccess: (deletedId) => console.log(`Deleted todo: ${deletedId}`)
});

// In component JSX:
<button onClick={() => confirmDelete(todo)}>Delete</button>
<DeleteConfirmationDialog />
```

### Benefits

1. **Single Source of Truth** - All delete logic centralized in one hook
2. **Consistent UX** - Same confirmation experience everywhere
3. **Automatic Cache Management** - Query invalidation handled automatically
4. **Type Safety** - Full TypeScript support with proper types
5. **Easy to Use** - Simple API that requires minimal setup

### Integration Points

#### 1. TodoRow Component

**File:** `src/components/todos/TodoRow.tsx`

**Changes:**
- Modified `onDelete` prop from `(id: string) => void` to `() => void`
- Delete button now triggers parent's confirmation logic

**Usage:**
```tsx
<TodoRow
  todo={todo}
  onDelete={() => confirmDelete(todo)}
  // ... other props
/>
```

#### 2. Todos Page

**File:** `src/pages/Todos.tsx`

**Changes:**
- Removed local `deleteMutation` (now handled by hook)
- Added `useDeleteTodoConfirmation` hook
- Updated TodoRow's `onDelete` to call `confirmDelete(todo)`
- Added TodoEditSheet's `onDelete` prop
- Rendered `<DeleteConfirmationDialog />` at page level

#### 3. ProjectDetail Page

**File:** `src/pages/ProjectDetail.tsx`

**Changes:**
- Removed local `deleteTodoMutation` (now handled by hook)
- Added `useDeleteTodoConfirmation` hook with renamed import to avoid conflicts
- Updated TodoRow's `onDelete` to call `confirmDeleteTodo(todo)`
- Added TodoEditSheet's `onDelete` prop
- Rendered `<TodoDeleteConfirmationDialog />` at page level

#### 4. TodoEditSheet Component

**File:** `src/components/todos/TodoEditSheet.tsx`

**Changes:**
- No changes - intentionally excluded delete button from the edit sheet
- Keeps the sidebar focused on editing, not deletion
- Users can delete from the list view instead

## Reusable Pattern

The `DestructiveConfirmationDialog` component (already existed) provides a reusable confirmation pattern:

**Location:** `src/components/dialogs/DestructiveConfirmationDialog.tsx`

**Features:**
- Customizable title and description
- Loading states during async operations
- Configurable button text and variants
- Accessible keyboard navigation

This same pattern can be applied to other destructive operations (sessions, projects, etc.).

## Query Invalidation Strategy

The hook invalidates these query keys after successful deletion:

1. `["todos"]` - Main todo list queries
2. `["todos-projects"]` - Project list for todo filtering
3. `["project-todos"]` - Project-specific todo queries

This ensures all views of todos are refreshed after deletion, preventing stale data.

## Testing Checklist

- [x] Todos page - Delete from list view
- [x] ProjectDetail page - Delete from todo list
- [x] Confirmation dialog shows correct todo title
- [x] Cancel button closes dialog without deleting
- [x] Delete button shows loading state during operation
- [x] All todo lists refresh after deletion
- [x] Mobile view - delete button visibility
- [x] Desktop view - delete button on hover
- [x] Edit sheet (sidebar) - No delete button (intentional)

## Future Enhancements

1. **Undo Action** - Add toast with "undo" option after deletion
2. **Batch Delete** - Support deleting multiple todos at once
3. **Delete Keyboard Shortcut** - Add keyboard shortcut for delete (e.g., Cmd+Backspace)
4. **Confirmation Preferences** - Allow users to disable confirmations in settings
5. **Soft Delete** - Implement trash/archive instead of permanent deletion

## Related Files

- `src/hooks/use-delete-todo-confirmation.tsx` - Core hook
- `src/components/dialogs/DestructiveConfirmationDialog.tsx` - Reusable dialog
- `src/components/todos/TodoRow.tsx` - List item with delete button
- `src/components/todos/TodoEditSheet.tsx` - Edit sheet with delete button
- `src/pages/Todos.tsx` - Main todos page
- `src/pages/ProjectDetail.tsx` - Project detail page with todos
