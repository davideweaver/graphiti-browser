# Patterns

Common UI patterns, conventions, and reusable solutions for frequent design challenges.

## Tool Button Hierarchy

All tool buttons in Container toolbars should use `ContainerToolButton` with `size="sm"` for consistent height. Icons should use `className="h-4 w-4 mr-2"`.

### Button Positioning and Variants

**1. Action buttons** (left and middle positions) - `default` variant

- Back, Info, Edit, etc.
- All non-destructive actions use default variant (no variant prop needed)
- Visual hierarchy determined by position (left-most = primary action)
- Get subtle neutral gray background for visual grouping

**2. Destructive actions** (right-most position) - `variant="destructive"`

- Delete, Remove, Clear, etc.
- Always positioned last (right-most)
- Gets red styling on hover for danger indication

### Example Toolbar

```tsx
import { ContainerToolButton } from "@/components/container/ContainerToolButton";
import { ChevronLeft, Info, Trash2 } from "lucide-react";

const tools = (
  <div className="flex gap-2">
    {/* Primary action: Back button (left-most) */}
    <ContainerToolButton size="sm" onClick={() => navigate(-1)}>
      <ChevronLeft className="h-4 w-4 md:mr-2" />
      <span className="hidden md:inline">Back</span>
    </ContainerToolButton>

    {/* Other actions: Info */}
    <ContainerToolButton size="sm" onClick={() => setSheetOpen(true)}>
      <Info className="h-4 w-4 mr-2" />
      Info
    </ContainerToolButton>

    {/* Destructive action: Delete (right-most) */}
    <ContainerToolButton variant="destructive" size="sm" onClick={handleDelete}>
      <Trash2 className="h-4 w-4 mr-2" />
      Delete
    </ContainerToolButton>
  </div>
);
```

## Back Button Pattern

The back button should always be the **first tool** (left-most position) in the toolbar.

### Guidelines

- **Position:** First tool (left-most button)
- **Variant:** Default (no variant prop needed) - makes it the primary action
- **Icon:** `<ChevronLeft className="h-4 w-4 md:mr-2" />` (single chevron, not arrow)
- **Text:** "Back" (or context-specific like "Back to Search")
- **Mobile behavior:** Show only the chevron icon, hide text

### Implementation

```tsx
import { ContainerToolButton } from "@/components/container/ContainerToolButton";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DetailPage() {
  const navigate = useNavigate();

  const tools = (
    <div className="flex gap-2">
      <ContainerToolButton size="sm" onClick={() => navigate(-1)}>
        <ChevronLeft className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline">Back</span>
      </ContainerToolButton>
      {/* Other tools */}
    </div>
  );

  return <Container title="Details" tools={tools}>{/* content */}</Container>;
}
```

### Mobile Responsive Behavior

```tsx
// Icon margin only on desktop (removed on mobile)
<ChevronLeft className="h-4 w-4 md:mr-2" />

// Text hidden on mobile, shown on desktop
<span className="hidden md:inline">Back</span>
```

Result:
- Mobile: Shows only chevron icon (no text, no margin)
- Desktop: Shows "< Back" with proper spacing

### Context-Specific Labels

```tsx
// Generic back
<span className="hidden md:inline">Back</span>

// Back to specific page
<span className="hidden md:inline">Back to Search</span>
<span className="hidden md:inline">Back to Entities</span>
```

## Delete Confirmation Pattern

All delete operations should use the `DeleteConfirmationDialog` component for consistency and better UX.

### Full Usage Pattern

```tsx
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import DeleteConfirmationDialog from "@/components/dialogs/DeleteConfirmationDialog";
import { ContainerToolButton } from "@/components/container/ContainerToolButton";
import { Trash2 } from "lucide-react";

function MyComponent() {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemType | null>(null);

  // Mutation for deleting the item
  const deleteMutation = useMutation({
    mutationFn: () => myService.deleteItem(itemToDelete!.id),
    onSuccess: () => {
      // Cleanup and navigation
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      navigate("/items"); // Or wherever appropriate
    },
  });

  // Handler to open the delete dialog
  const handleOpenDeleteDialog = (item: ItemType) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  // Handler to confirm delete (called by dialog)
  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate();
    }
  };

  // Handler to cancel delete (called by dialog)
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  return (
    <>
      {/* Delete button in toolbar */}
      <ContainerToolButton
        variant="destructive"
        size="sm"
        onClick={() => handleOpenDeleteDialog(item)}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </ContainerToolButton>

      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDelete={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete Item"
        description={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
      />
    </>
  );
}
```

### Key Points

**State Management:**
- Store both the dialog state (`deleteDialogOpen`) and the item to delete (`itemToDelete`)
- When user clicks delete, set the item and open the dialog
- On confirm: execute the mutation and clean up state on success
- On cancel: just close the dialog and reset state

**Description Format:**
- Always include "This action cannot be undone." for destructive operations
- Include the item name in the description for context
- Use template literals for dynamic descriptions

**Mutation Handling:**
- Use React Query's `useMutation` for delete operations
- Invalidate relevant queries on success
- Clean up dialog state after successful deletion
- Navigate away from deleted item's detail page

### Examples in Codebase

**Delete Entity:**
```tsx
<DeleteConfirmationDialog
  open={deleteDialogOpen}
  onOpenChange={setDeleteDialogOpen}
  onDelete={handleConfirmDelete}
  onCancel={handleCancelDelete}
  title="Delete Entity"
  description={`Are you sure you want to delete "${entity?.name}"? This will remove the entity and all its relationships. This action cannot be undone.`}
/>
```

**Delete Session:**
```tsx
<DeleteConfirmationDialog
  open={deleteDialogOpen}
  onOpenChange={setDeleteDialogOpen}
  onDelete={handleConfirmDelete}
  onCancel={handleCancelDelete}
  title="Delete Session"
  description={`Are you sure you want to delete this session? This action cannot be undone.`}
/>
```

**Delete Graph:**
```tsx
<DeleteConfirmationDialog
  open={deleteDialogOpen}
  onOpenChange={setDeleteDialogOpen}
  onDelete={handleConfirmDelete}
  onCancel={handleCancelDelete}
  title="Delete Graph"
  description={`Are you sure you want to delete "${graphToDelete?.id}"? All entities, facts, and episodes in this graph will be permanently removed. This action cannot be undone.`}
/>
```

## Empty States

Show helpful messages when there's no data to display.

### Basic Empty State

```tsx
<Card>
  <CardContent className="p-6 text-center text-muted-foreground">
    <p>No items found.</p>
  </CardContent>
</Card>
```

### Empty State with Icon

```tsx
import { FileX } from "lucide-react";

<Card>
  <CardContent className="p-12 text-center">
    <FileX className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
    <p className="text-lg font-semibold mb-2">No items found</p>
    <p className="text-sm text-muted-foreground">
      Try adjusting your filters or create a new item.
    </p>
  </CardContent>
</Card>
```

### Empty State with Action

```tsx
<Card>
  <CardContent className="p-12 text-center">
    <FileX className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
    <p className="text-lg font-semibold mb-2">No items yet</p>
    <p className="text-sm text-muted-foreground mb-4">
      Get started by creating your first item.
    </p>
    <Button onClick={handleCreate}>
      <Plus className="h-4 w-4 mr-2" />
      Create Item
    </Button>
  </CardContent>
</Card>
```

## Error States

Display errors with clear messages and recovery options.

### Basic Error State

```tsx
<Card>
  <CardContent className="p-6 text-center text-destructive">
    <p>Error loading data. Please try again.</p>
  </CardContent>
</Card>
```

### Error State with Retry

```tsx
import { AlertCircle, RefreshCw } from "lucide-react";

<Card>
  <CardContent className="p-12 text-center">
    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
    <p className="text-lg font-semibold mb-2">Error Loading Data</p>
    <p className="text-sm text-muted-foreground mb-4">
      {error?.message || "Something went wrong. Please try again."}
    </p>
    <Button onClick={refetch}>
      <RefreshCw className="h-4 w-4 mr-2" />
      Retry
    </Button>
  </CardContent>
</Card>
```

## Icon Usage Conventions

### Icon Sizing

**Standard sizes:**
- Small: `h-4 w-4` (16px) - Used in buttons, badges
- Medium: `h-5 w-5` (20px) - Used in card headers
- Large: `h-6 w-6` (24px) - Used in page headers, empty states
- Extra large: `h-12 w-12` (48px) - Used in empty/error states

### Icon Spacing

**With text:**
```tsx
// Before text (mr-2 = 8px margin right)
<Button>
  <Plus className="h-4 w-4 mr-2" />
  Add New
</Button>

// After text (ml-2 = 8px margin left)
<Button>
  Continue
  <ChevronRight className="h-4 w-4 ml-2" />
</Button>
```

**Mobile responsive:**
```tsx
// Margin only on desktop
<ChevronLeft className="h-4 w-4 md:mr-2" />
<span className="hidden md:inline">Back</span>
```

### Common Icons

From `lucide-react`:

**Actions:**
- `Plus` - Add/create actions
- `Edit` - Edit actions
- `Trash2` - Delete actions
- `Save` - Save actions
- `X` - Close/cancel actions

**Navigation:**
- `ChevronLeft` - Back buttons
- `ChevronRight` - Forward/next actions
- `ChevronDown` - Dropdown indicators, collapsibles
- `ArrowLeft` - Previous in pagination
- `ArrowRight` - Next in pagination

**Status:**
- `Loader2` - Loading spinners (with `animate-spin`)
- `AlertCircle` - Warnings/errors
- `CheckCircle` - Success states
- `Info` - Information

**Data:**
- `Search` - Search inputs
- `Filter` - Filter actions
- `FileX` - Empty states
- `Calendar` - Date pickers

### Icon-Only Buttons

```tsx
<Button size="icon">
  <Plus className="h-4 w-4" />
</Button>
```

Use `size="icon"` for square buttons with no text.

### Large Icons in Fixed-Size Buttons

When you need a larger icon while keeping the button size fixed, use the `[&_svg]:!size-*` pattern to target SVG children directly:

```tsx
<Button
  variant="ghost"
  size="icon"
  className="h-11 w-11 p-0 [&_svg]:!size-6"
>
  <Search />
</Button>
```

**Pattern breakdown:**
- `h-11 w-11` - Explicit button size (44px × 44px)
- `p-0` - Remove padding to maximize icon space
- `[&_svg]:!size-6` - Target SVG children directly, set size to 6 (24px)
- `!` - Important flag to override default icon sizes
- No className on icon component - styling applied via button's SVG selector

**Common size combinations:**
- Button `h-11 w-11` + Icon `[&_svg]:!size-6` (24px icon in 44px button)
- Button `h-14 w-14` + Icon `[&_svg]:!size-7` (28px icon in 56px button)
- Button `h-16 w-16` + Icon `[&_svg]:!size-8` (32px icon in 64px button)

**When to use:**
- Navigation headers with prominent icon buttons
- Action buttons that need visual emphasis
- Touch targets that need larger icons for accessibility

**Used in:**
- `PrimaryNav` - Main navigation icon buttons (`h-14 w-14` with `[&_svg]:!size-5`)
- `DocumentsSecondaryNav` - Search button header (`h-11 w-11` with `[&_svg]:!size-6`)

## Text Truncation

### Single Line Truncation

```tsx
<h3 className="truncate">
  {veryLongTitle}
</h3>
```

### Multi-Line Truncation (Line Clamp)

```tsx
// 2 lines
<p className="text-sm text-muted-foreground line-clamp-2">
  {longDescription}
</p>

// 3 lines
<p className="line-clamp-3">
  {evenLongerContent}
</p>
```

### Truncation with Flex Layout

```tsx
<div className="flex items-start gap-4">
  <div className="flex-shrink-0">
    {/* Fixed width element (avatar, icon, etc.) */}
  </div>
  <div className="flex-1 min-w-0">
    {/* Truncatable content */}
    <h3 className="truncate">{title}</h3>
    <p className="line-clamp-2">{description}</p>
  </div>
</div>
```

The `min-w-0` on the flex-1 container is critical for truncation to work properly.

## Hover Visibility Pattern

Show actions only when hovering over an element.

### Group Hover for Inline Actions

```tsx
<div className="group relative">
  {/* Main content */}
  <div className="flex items-center justify-between">
    <span>{item.name}</span>

    {/* Actions appear on hover */}
    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
      <Button size="icon" variant="ghost">
        <Edit className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  </div>
</div>
```

### Card with Hover Actions

```tsx
<Card className="group cursor-pointer hover:shadow-md transition-shadow">
  <CardContent className="p-5">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Action button appears on card hover */}
      <Button
        size="icon"
        variant="ghost"
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleAction}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  </CardContent>
</Card>
```

## Form Field Layouts

### Standard Field Layout

```tsx
<div className="space-y-2">
  <Label htmlFor="field">Field Label</Label>
  <Input id="field" type="text" />
</div>
```

**Pattern:**
- Container: `space-y-2` (8px between label and input)
- Label uses `htmlFor` to match input `id`

### Multiple Fields Layout

```tsx
<div className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="field1">Field 1</Label>
    <Input id="field1" />
  </div>

  <div className="space-y-2">
    <Label htmlFor="field2">Field 2</Label>
    <Input id="field2" />
  </div>
</div>
```

**Pattern:**
- Outer container: `space-y-4` (16px between fields)
- Each field: `space-y-2` (8px between label and input)

### Optional Field Indicator

```tsx
<Label htmlFor="field">
  Field Label
  <span className="text-muted-foreground ml-1">(optional)</span>
</Label>
```

### Field with Helper Text

```tsx
<div className="space-y-2">
  <Label htmlFor="field">Field Label</Label>
  <Input id="field" type="text" />
  <p className="text-xs text-muted-foreground">
    Helper text explaining the field requirements.
  </p>
</div>
```

### Field with Error

```tsx
<div className="space-y-2">
  <Label htmlFor="field">Field Label</Label>
  <Input
    id="field"
    type="text"
    className={error ? "border-destructive" : ""}
  />
  {error && (
    <p className="text-xs text-destructive">
      {error.message}
    </p>
  )}
</div>
```

## Loading Patterns

See [states.md](./states.md#loading-states) for comprehensive loading state patterns.

### Inline Loading

```tsx
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
  {isLoading ? "Loading..." : "Submit"}
</Button>
```

### Page Loading

```tsx
<Container title="Page Title" loading={isLoading}>
  {/* Content only shows when loading=false */}
</Container>
```

## Search Pattern

### Debounced Search Input

```tsx
import { useState, useEffect } from "react";
import { Search } from "lucide-react";

function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}
```

### Search with Clear Button

```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input
    type="text"
    placeholder="Search..."
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    className="pl-10 pr-10"
  />
  {query && (
    <button
      onClick={() => setQuery("")}
      className="absolute right-3 top-1/2 transform -translate-y-1/2"
    >
      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
    </button>
  )}
</div>
```

## Filter Pattern

### Filter with Select

```tsx
<div className="flex gap-4 items-center">
  <Label>Filter:</Label>
  <Select value={filter} onValueChange={setFilter}>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="All items" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Items</SelectItem>
      <SelectItem value="active">Active Only</SelectItem>
      <SelectItem value="inactive">Inactive Only</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Multiple Filters

```tsx
<div className="flex flex-wrap gap-4">
  <Select value={typeFilter} onValueChange={setTypeFilter}>
    <SelectTrigger className="w-[150px]">
      <SelectValue placeholder="Type" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Types</SelectItem>
      <SelectItem value="person">Person</SelectItem>
      <SelectItem value="org">Organization</SelectItem>
    </SelectContent>
  </Select>

  <Select value={statusFilter} onValueChange={setStatusFilter}>
    <SelectTrigger className="w-[150px]">
      <SelectValue placeholder="Status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Status</SelectItem>
      <SelectItem value="active">Active</SelectItem>
      <SelectItem value="inactive">Inactive</SelectItem>
    </SelectContent>
  </Select>
</div>
```

## Pagination Pattern

### Basic Pagination

```tsx
<div className="flex justify-between items-center mt-6">
  <Button
    variant="outline"
    onClick={handlePrevious}
    disabled={!hasPrevious}
  >
    <ArrowLeft className="h-4 w-4 mr-2" />
    Previous
  </Button>

  <span className="text-sm text-muted-foreground">
    Page {currentPage} of {totalPages}
  </span>

  <Button
    variant="outline"
    onClick={handleNext}
    disabled={!hasNext}
  >
    Next
    <ArrowRight className="h-4 w-4 ml-2" />
  </Button>
</div>
```

### Cursor-Based Pagination

```tsx
<div className="flex justify-between items-center mt-6">
  <Button
    variant="outline"
    onClick={() => loadMore(previousCursor)}
    disabled={!previousCursor}
  >
    <ArrowLeft className="h-4 w-4 mr-2" />
    Previous
  </Button>

  <Button
    variant="outline"
    onClick={() => loadMore(nextCursor)}
    disabled={!nextCursor}
  >
    Next
    <ArrowRight className="h-4 w-4 ml-2" />
  </Button>
</div>
```

## Responsive Visibility

### Hide on Mobile

```tsx
<span className="hidden md:inline">Desktop Only</span>
```

### Show Only on Mobile

```tsx
<span className="md:hidden">Mobile Only</span>
```

### Different Content for Mobile/Desktop

```tsx
<div>
  <span className="md:hidden">Mobile Content</span>
  <span className="hidden md:inline">Desktop Content</span>
</div>
```

### Responsive Icon Margin

```tsx
// Margin only on desktop (removed on mobile for icon-only button)
<Icon className="h-4 w-4 md:mr-2" />
<span className="hidden md:inline">Text</span>
```
