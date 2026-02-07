# States

Interactive states, loading patterns, transitions, and feedback mechanisms.

## Loading States

### Page Loading

Use the Container component's `loading` prop:

```tsx
<Container title="Page Title" loading={isLoading}>
  {/* Content hidden while loading */}
</Container>
```

Shows a spinner next to the title and hides content until loading completes.

### Button Loading States

```tsx
import { Loader2 } from "lucide-react";

<Button disabled={isLoading}>
  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
  {isLoading ? "Saving..." : "Save"}
</Button>
```

**Pattern:**
- Disable button during loading
- Show spinner icon with `animate-spin`
- Change button text to reflect action ("Saving...", "Loading...", etc.)

### Skeleton Loaders

#### Card Skeleton

```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

<Card>
  <CardContent className="p-5">
    <div className="flex items-start gap-4">
      {/* Avatar skeleton */}
      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />

      {/* Content skeleton */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  </CardContent>
</Card>
```

#### List Skeleton

```tsx
<div className="space-y-3">
  {[...Array(5)].map((_, i) => (
    <Card key={i}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

#### Grid Skeleton

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {[...Array(6)].map((_, i) => (
    <Card key={i}>
      <CardContent className="p-5">
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  ))}
</div>
```

#### Table Row Skeleton

```tsx
<div className="space-y-2">
  {[...Array(10)].map((_, i) => (
    <Skeleton key={i} className="h-12 w-full" />
  ))}
</div>
```

### Conditional Loading

Show skeleton while loading, actual content when ready:

```tsx
{isLoading ? (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-5">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
) : (
  <div className="space-y-3">
    {items.map(item => (
      <ItemCard key={item.id} item={item} />
    ))}
  </div>
)}
```

### Spinner States

```tsx
import { Loader2 } from "lucide-react";

// Inline spinner
<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />

// Centered spinner
<div className="flex items-center justify-center h-64">
  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
</div>

// Spinner with text
<div className="flex items-center gap-2">
  <Loader2 className="h-4 w-4 animate-spin" />
  <span className="text-sm text-muted-foreground">Loading...</span>
</div>
```

## Disabled States

### Disabled Buttons

```tsx
// Automatically styled with reduced opacity
<Button disabled>Disabled Button</Button>

// During mutation
<Button disabled={mutation.isPending}>
  {mutation.isPending ? "Saving..." : "Save"}
</Button>
```

### Disabled Inputs

```tsx
<Input
  disabled={isProcessing}
  placeholder="Enter value"
/>

<Textarea
  disabled={isProcessing}
  placeholder="Enter description"
/>

<Select disabled={isProcessing}>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

### Disabled State Styling

ShadCN components automatically apply these styles when disabled:
- `pointer-events-none` - Prevents interaction
- `opacity-50` - Visual indication of disabled state

## Hover States

### Card Hover

```tsx
<Card className="cursor-pointer hover:shadow-md transition-shadow">
  <CardContent className="p-5">
    {/* Card content */}
  </CardContent>
</Card>
```

**Pattern:**
- `cursor-pointer` - Shows hand cursor
- `hover:shadow-md` - Elevation on hover
- `transition-shadow` - Smooth shadow transition

### Button Hover

Built into ShadCN Button component:
- Default variant: Darker background on hover
- Outline variant: Accent background on hover
- Ghost variant: Accent background on hover
- Destructive variant: Darker red on hover

### Badge Hover (Interactive)

```tsx
<Badge className="cursor-pointer hover:bg-blue-500/20 transition-colors">
  {entityType}
</Badge>
```

### Link Hover

```tsx
<a
  href="#"
  className="text-primary hover:underline"
>
  Learn more
</a>
```

## Focus States

### Built-in Focus Rings

All ShadCN components have built-in focus states:

```tsx
// Focus visible with ring
<Button>Click Me</Button>
// Automatically adds: focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

### Custom Focus Styles

```tsx
<div
  tabIndex={0}
  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
>
  Focusable content
</div>
```

### Focus Within

```tsx
<div className="border border-input focus-within:ring-2 focus-within:ring-ring">
  <Input className="border-0 focus-visible:ring-0" />
</div>
```

## Transitions and Animations

### Color Transitions

```tsx
<Button className="transition-colors">
  {/* Smooth color changes on hover/focus */}
</Button>

<Card className="transition-colors hover:border-primary">
  {/* Smooth border color change */}
</Card>
```

### Shadow Transitions

```tsx
<Card className="hover:shadow-md transition-shadow">
  {/* Smooth shadow change on hover */}
</Card>
```

### Transform Transitions

```tsx
// Rotate icon on expand
<ChevronDown
  className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
/>

// Scale on hover
<div className="transition-transform hover:scale-105">
  {/* Content */}
</div>
```

### Opacity Transitions

```tsx
// Fade in/out
<div className="opacity-0 group-hover:opacity-100 transition-opacity">
  {/* Hidden actions */}
</div>

// Fade between states
<div className={`transition-opacity ${isVisible ? "opacity-100" : "opacity-0"}`}>
  {/* Conditional content */}
</div>
```

### Combined Transitions

```tsx
<Card className="transition-all hover:shadow-lg hover:-translate-y-1">
  {/* Lift and shadow on hover */}
</Card>
```

### Spin Animation

```tsx
import { Loader2, RefreshCw } from "lucide-react";

// Loading spinner
<Loader2 className="h-6 w-6 animate-spin" />

// Refresh button animation
<Button onClick={handleRefresh}>
  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
  Refresh
</Button>
```

## Mutation Feedback

### During Mutation

```tsx
const mutation = useMutation({
  mutationFn: () => api.updateItem(item),
});

<Button
  onClick={() => mutation.mutate()}
  disabled={mutation.isPending}
>
  {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
  {mutation.isPending ? "Saving..." : "Save"}
</Button>
```

### After Success

```tsx
import { toast } from "@/hooks/use-toast";

const mutation = useMutation({
  mutationFn: () => api.updateItem(item),
  onSuccess: () => {
    toast({
      title: "Success",
      description: "Item updated successfully",
    });
  },
});
```

### After Error

```tsx
const mutation = useMutation({
  mutationFn: () => api.updateItem(item),
  onError: (error) => {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  },
});
```

### Optimistic Updates

```tsx
const mutation = useMutation({
  mutationFn: () => api.updateItem(item),
  onMutate: async (newItem) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["items"] });

    // Snapshot previous value
    const previousItems = queryClient.getQueryData(["items"]);

    // Optimistically update
    queryClient.setQueryData(["items"], (old) => {
      return old.map((item) =>
        item.id === newItem.id ? newItem : item
      );
    });

    return { previousItems };
  },
  onError: (err, newItem, context) => {
    // Rollback on error
    queryClient.setQueryData(["items"], context.previousItems);
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries({ queryKey: ["items"] });
  },
});
```

## Data Fetching States

### With React Query

```tsx
const { data, isLoading, isError, error, refetch } = useQuery({
  queryKey: ["items"],
  queryFn: () => api.getItems(),
});

if (isLoading) {
  return <LoadingSkeleton />;
}

if (isError) {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
        <p className="text-lg font-semibold mb-2">Error Loading Data</p>
        <p className="text-sm text-muted-foreground mb-4">
          {error.message}
        </p>
        <Button onClick={refetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

return (
  <div className="space-y-3">
    {data.map(item => (
      <ItemCard key={item.id} item={item} />
    ))}
  </div>
);
```

### Loading More Data

```tsx
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ["items"],
  queryFn: ({ pageParam }) => api.getItems(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

<Button
  onClick={() => fetchNextPage()}
  disabled={!hasNextPage || isFetchingNextPage}
>
  {isFetchingNextPage ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Loading more...
    </>
  ) : hasNextPage ? (
    "Load More"
  ) : (
    "No more items"
  )}
</Button>
```

## Empty States

### No Data

```tsx
if (data.length === 0) {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <FileX className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-semibold mb-2">No items found</p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or create a new item.
        </p>
      </CardContent>
    </Card>
  );
}
```

### No Search Results

```tsx
if (searchQuery && filteredItems.length === 0) {
  return (
    <Card>
      <CardContent className="p-12 text-center text-muted-foreground">
        <p>No results found for "{searchQuery}"</p>
      </CardContent>
    </Card>
  );
}
```

See [patterns.md](./patterns.md#empty-states) for more empty state patterns.

## Active/Selected States

### Active Tab

```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
</Tabs>
```

TabsTrigger automatically styles the active tab with `data-state="active"`.

### Selected Item

```tsx
<Card
  className={cn(
    "cursor-pointer hover:shadow-md transition-shadow",
    isSelected && "ring-2 ring-primary"
  )}
  onClick={() => setSelected(item.id)}
>
  <CardContent className="p-5">
    {/* Card content */}
  </CardContent>
</Card>
```

### Active Navigation Item

```tsx
<a
  href={path}
  className={cn(
    "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
    isActive
      ? "bg-secondary text-foreground"
      : "text-muted-foreground hover:bg-accent hover:text-foreground"
  )}
>
  <Icon className="h-4 w-4" />
  {label}
</a>
```

## Toggle States

### Boolean Toggle

```tsx
<Toggle
  pressed={isEnabled}
  onPressedChange={setIsEnabled}
  aria-label="Toggle feature"
>
  {isEnabled ? "Enabled" : "Disabled"}
</Toggle>
```

### Icon Toggle

```tsx
<Toggle
  pressed={isFavorite}
  onPressedChange={setIsFavorite}
  aria-label="Toggle favorite"
>
  <Star className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
</Toggle>
```

## Validation States

### Field Error

```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className={error ? "border-destructive" : ""}
  />
  {error && (
    <p className="text-xs text-destructive">
      {error.message}
    </p>
  )}
</div>
```

### Field Success

```tsx
<div className="space-y-2">
  <Label htmlFor="username">Username</Label>
  <Input
    id="username"
    value={username}
    onChange={(e) => setUsername(e.target.value)}
    className={isAvailable ? "border-green-500" : ""}
  />
  {isAvailable && (
    <p className="text-xs text-green-600 flex items-center gap-1">
      <CheckCircle className="h-3 w-3" />
      Username available
    </p>
  )}
</div>
```

## Progress Indicators

### Linear Progress

```tsx
import { Progress } from "@/components/ui/progress";

<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span>Uploading...</span>
    <span>{progress}%</span>
  </div>
  <Progress value={progress} />
</div>
```

### Step Indicator

```tsx
<div className="flex items-center gap-2">
  {[1, 2, 3].map((step) => (
    <div
      key={step}
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
        currentStep === step
          ? "bg-primary text-primary-foreground"
          : currentStep > step
            ? "bg-green-500 text-white"
            : "bg-muted text-muted-foreground"
      )}
    >
      {currentStep > step ? <Check className="h-4 w-4" /> : step}
    </div>
  ))}
</div>
```

## Transition Duration

Standard transition durations:

```css
/* Fast transitions (hover, focus) */
transition-colors     /* 150ms */
transition-opacity    /* 150ms */

/* Medium transitions (shadows, transforms) */
transition-shadow     /* 150ms */
transition-transform  /* 150ms */

/* Combined transitions */
transition-all        /* 150ms for all properties */
```

Custom durations:

```tsx
<div className="transition-opacity duration-300">
  {/* 300ms fade */}
</div>

<div className="transition-transform duration-500">
  {/* 500ms transform */}
</div>
```

## Implementation Notes

### Prevent Layout Shift

When showing loading states, maintain the same layout dimensions:

```tsx
// Bad: Content jumps
{isLoading ? <Spinner /> : <ContentList />}

// Good: Maintains height
<div className="min-h-[400px]">
  {isLoading ? <Skeleton /> : <ContentList />}
</div>
```

### Debounce User Input

Debounce search and filter inputs to reduce API calls:

```tsx
import { useState, useEffect } from "react";

const [query, setQuery] = useState("");
const [debouncedQuery, setDebouncedQuery] = useState("");

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(query);
  }, 300);

  return () => clearTimeout(timer);
}, [query]);

// Use debouncedQuery for API calls
const { data } = useQuery({
  queryKey: ["search", debouncedQuery],
  queryFn: () => api.search(debouncedQuery),
  enabled: debouncedQuery.length > 0,
});
```

### Optimistic UI Updates

For better perceived performance, update UI before server confirms:

```tsx
const mutation = useMutation({
  mutationFn: updateItem,
  onMutate: async (newItem) => {
    // Update UI immediately
    queryClient.setQueryData(["item", newItem.id], newItem);
  },
  onError: (error, newItem, context) => {
    // Rollback on error
    queryClient.setQueryData(["item", newItem.id], context.previousItem);
  },
});
```
