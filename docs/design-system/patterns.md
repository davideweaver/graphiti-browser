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

## Secondary Navigation Tool Buttons

Secondary navigation sidebars use **SecondaryNavToolButton** for header toolbar actions. These are icon-only buttons with a more compact design compared to page Container tool buttons.

### Component Code

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const secondaryNavToolButtonVariants = cva(
  // Base classes with fixed h-10 w-10 sizing
  "inline-flex items-center justify-center h-10 w-10 rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "ghost",
    },
  },
);

export interface SecondaryNavToolButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof secondaryNavToolButtonVariants> {}

export const SecondaryNavToolButton = React.forwardRef<
  HTMLButtonElement,
  SecondaryNavToolButtonProps
>(({ className, variant, ...props }, ref) => {
  return (
    <button
      className={cn(secondaryNavToolButtonVariants({ variant, className }))}
      ref={ref}
      {...props}
    />
  );
});

SecondaryNavToolButton.displayName = "SecondaryNavToolButton";
```

### Design Specifications

| Property | Value | Notes |
|----------|-------|-------|
| **Button Size** | h-10 w-10 (40x40px) | Fixed square size |
| **Variant** | ghost | Only variant available |
| **Icon Control** | Via icon's size prop | No CSS override - icons control their own size |
| **Gap** | gap-1 (4px) | Set by SecondaryNavContainer, not button |
| **Border Radius** | rounded-md | Consistent with other buttons |

### Icon Sizing

**Important:** Icons control their own size using the `size` prop. The button does not enforce a default icon size via CSS.

```tsx
// Smaller icon (18px)
<SecondaryNavToolButton onClick={handleRefresh}>
  <RefreshCw size={18} />
</SecondaryNavToolButton>

// Standard icon (20px)
<SecondaryNavToolButton onClick={handleSearch}>
  <Search size={20} />
</SecondaryNavToolButton>

// Larger icon (24px)
<SecondaryNavToolButton onClick={handleAdd}>
  <Plus size={24} />
</SecondaryNavToolButton>
```

### Comparison with ContainerToolButton

| Feature | ContainerToolButton | SecondaryNavToolButton |
|---------|---------------------|------------------------|
| **Use Case** | Page toolbar actions | Secondary nav toolbar actions |
| **Button Size** | h-9 (36px) | h-10 (40px) |
| **Sizes Available** | sm, icon | None (always fixed) |
| **Variants** | default, primary, destructive, outline, ghost | ghost only |
| **Text Support** | Yes (with icon or alone) | No (icon-only) |
| **Icon Size** | size-4 (16px) via CSS | Controlled by icon's size prop |

### Usage Example

```tsx
import { SecondaryNavContainer } from "@/components/navigation/SecondaryNavContainer";
import { SecondaryNavToolButton } from "@/components/navigation/SecondaryNavToolButton";
import { RefreshCw, Search, Plus } from "lucide-react";

export function MySecondaryNav() {
  return (
    <SecondaryNavContainer
      title="Documents"
      tools={
        <>
          <SecondaryNavToolButton onClick={handleRefresh}>
            <RefreshCw size={18} />
          </SecondaryNavToolButton>
          <SecondaryNavToolButton onClick={handleSearch}>
            <Search size={20} />
          </SecondaryNavToolButton>
          <SecondaryNavToolButton onClick={handleAdd}>
            <Plus size={22} />
          </SecondaryNavToolButton>
        </>
      }
    >
      {/* Navigation content */}
    </SecondaryNavContainer>
  );
}
```

### Best Practices

1. **Icon-Only Design** - Never add text to these buttons. Use tooltips if labels are needed.
2. **Icon Size Range** - Keep icons between 16px-24px for balance with 40px button size.
3. **Common Actions** - Typical actions include refresh, search, add, filter, settings.
4. **Compact Spacing** - SecondaryNavContainer uses gap-1 (4px) between buttons.
5. **Visual Balance** - Similar-sized icons (within 2-4px of each other) look best together.

### Common Icon Sizes

- **18px** - Compact icons (RefreshCw, X, Filter)
- **20px** - Standard icons (Search, Settings, Bell)
- **22px** - Prominent icons (Plus, Download, Upload)
- **24px** - Large icons (rare, use sparingly)

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

## Destructive Confirmation Pattern

All destructive operations (delete, cancel, clear, etc.) should use the `DestructiveConfirmationDialog` component for consistency and better UX.

### Component Props

The component accepts these props:
- `open` - Boolean controlling dialog visibility
- `onOpenChange` - Callback when dialog open state changes
- `onConfirm` - Called when user confirms the action
- `onCancel` - Called when user cancels
- `title` - Dialog title (e.g., "Delete Item", "Cancel Task")
- `description` - Detailed description of what will happen
- `isLoading` - Optional: Shows loading state (default: false)
- `confirmText` - Optional: Confirm button text (default: "Delete")
- `confirmLoadingText` - Optional: Loading text (default: "Deleting...")
- `confirmVariant` - Optional: Button variant (default: "destructive")

### Full Usage Pattern (Delete)

```tsx
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import DestructiveConfirmationDialog from "@/components/dialogs/DestructiveConfirmationDialog";
import { ContainerToolButton } from "@/components/container/ContainerToolButton";
import { Trash2 } from "lucide-react";

function MyComponent() {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemType | null>(null);

  // Mutation for deleting the item
  const deleteMutation = useMutation({
    mutationFn: () => myService.deleteItem(itemToDelete!.id),
    onError: () => {
      // Close dialog on error (error toast shown by service)
      setDeleteDialogOpen(false);
    },
    onSuccess: () => {
      // Close dialog immediately
      setDeleteDialogOpen(false);
      setItemToDelete(null);

      // Cleanup and navigation
      queryClient.invalidateQueries({ queryKey: ["items"] });
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
      <DestructiveConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete Item"
        description={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
```

### Key Points

**State Management:**
- Store both the dialog state and the item/context for the action
- When user triggers action, set the context and open the dialog
- On confirm: execute the mutation and clean up state on success
- On cancel: just close the dialog and reset state

**Loading State:**
- Pass `isLoading={mutation.isPending}` to the dialog
- Button shows spinner and loading text while pending
- Both buttons are disabled during operation to prevent multiple clicks
- Dialog closes automatically on success or error

**Description Format:**
- Always include "This action cannot be undone." for irreversible operations
- Include the item/context name for clarity
- Use template literals for dynamic descriptions

**Mutation Handling:**
- Use React Query's `useMutation` for operations
- Handle both `onError` and `onSuccess` to close dialog
- Invalidate relevant queries on success
- Navigate away from deleted item's detail page if needed

### Examples in Codebase

**Delete Entity:**
```tsx
<DestructiveConfirmationDialog
  open={deleteDialogOpen}
  onOpenChange={setDeleteDialogOpen}
  onConfirm={handleConfirmDelete}
  onCancel={handleCancelDelete}
  title="Delete Entity"
  description={`Are you sure you want to delete "${entity?.name}"? This will remove the entity and all its relationships. This action cannot be undone.`}
  isLoading={deleteMutation.isPending}
/>
```

**Cancel Task Execution:**
```tsx
<DestructiveConfirmationDialog
  open={cancelDialogOpen}
  onOpenChange={setCancelDialogOpen}
  onConfirm={handleConfirmCancel}
  onCancel={() => setCancelDialogOpen(false)}
  title="Cancel Task Execution"
  description={`Are you sure you want to cancel "${taskName}"? This action cannot be undone.`}
  isLoading={cancelMutation.isPending}
  confirmText="Cancel Task"
  confirmLoadingText="Cancelling..."
  confirmVariant="destructive"
/>
```

**Clear Scratchpad:**
```tsx
<DestructiveConfirmationDialog
  open={clearDialogOpen}
  onOpenChange={setClearDialogOpen}
  onConfirm={handleConfirmClear}
  onCancel={() => setClearDialogOpen(false)}
  title="Clear Scratchpad"
  description="Are you sure you want to clear the scratchpad? This action cannot be undone and all scratchpad data will be permanently deleted."
  isLoading={clearMutation.isPending}
  confirmText="Clear"
  confirmLoadingText="Clearing..."
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

Hover-reveal actions must always be visible on mobile — there is no hover state on touch devices.

```tsx
const isMobile = useIsMobile();

<div className="group relative">
  {/* Main content */}
  <div className="flex items-center justify-between">
    <span>{item.name}</span>

    {/* Actions: always visible on mobile, reveal on hover on desktop */}
    <div className={isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"}>
      <Button size="icon" variant="ghost">
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  </div>
</div>
```

**Rule:** Any action hidden behind `opacity-0 group-hover:opacity-100` must use `useIsMobile()` and render at full opacity on mobile. Without this, touch users have no way to access the action.

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
