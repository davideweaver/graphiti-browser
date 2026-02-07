# Data Presentation

Patterns for displaying data in grids, lists, tables, and other structured formats.

## Grid Layouts

### Responsive Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id}>
      <CardContent className="p-5">
        {/* Card content */}
      </CardContent>
    </Card>
  ))}
</div>
```

**Pattern:**
- 1 column on mobile (`grid-cols-1`)
- 2 columns on tablet (`md:grid-cols-2`)
- 3 columns on desktop (`lg:grid-cols-3`)
- 16px gap between items (`gap-4`)

### Auto-Fit Grid

```tsx
<div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
  {items.map(item => (
    <Card key={item.id}>
      <CardContent className="p-5">
        {/* Card content */}
      </CardContent>
    </Card>
  ))}
</div>
```

Automatically fits as many columns as possible with minimum 250px width.

### Fixed Column Grid

```tsx
// Always 4 columns
<div className="grid grid-cols-4 gap-4">

// 2 columns on mobile, 4 on desktop
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
```

## List Layouts

### Vertical List

```tsx
<div className="space-y-3">
  {items.map(item => (
    <ItemCard key={item.id} item={item} />
  ))}
</div>
```

**Spacing:**
- `space-y-2` - 8px gap (compact lists)
- `space-y-3` - 12px gap (standard lists)
- `space-y-4` - 16px gap (spacious lists)

### List with Separators

```tsx
<div className="divide-y divide-border">
  {items.map(item => (
    <div key={item.id} className="py-4">
      {/* List item content */}
    </div>
  ))}
</div>
```

### Horizontal List

```tsx
<div className="flex gap-2 overflow-x-auto">
  {items.map(item => (
    <Card key={item.id} className="flex-shrink-0 w-64">
      <CardContent className="p-5">
        {/* Card content */}
      </CardContent>
    </Card>
  ))}
</div>
```

**Key features:**
- `overflow-x-auto` - Horizontal scrolling
- `flex-shrink-0` - Prevents cards from shrinking
- Fixed width (e.g., `w-64`) - Maintains consistent card size

### Grouped Lists

```tsx
<div className="space-y-6">
  {groups.map(group => (
    <div key={group.id}>
      <h3 className="font-semibold text-lg mb-3">{group.name}</h3>
      <div className="space-y-2">
        {group.items.map(item => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  ))}
</div>
```

## Entity Type Coloring

Color-code entities by type for quick visual identification.

### Entity Type Color Function

```tsx
function getEntityTypeColor(type: string) {
  switch (type.toLowerCase()) {
    case "person":
      return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
    case "organization":
      return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20";
    case "location":
      return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
    case "project":
      return "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20";
    case "event":
      return "bg-pink-500/10 text-pink-500 hover:bg-pink-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
  }
}
```

**Color scheme:**
- Person: Blue
- Organization: Purple
- Location: Green
- Project: Orange
- Event: Pink
- Default/Unknown: Gray

### Usage in Badges

```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="secondary" className={getEntityTypeColor(entityType)}>
  {entityType}
</Badge>
```

### Usage in Avatars

```tsx
function getEntityAvatarColor(type: string) {
  switch (type.toLowerCase()) {
    case "person":
      return "bg-blue-500/20 text-blue-600";
    case "organization":
      return "bg-purple-500/20 text-purple-600";
    case "location":
      return "bg-green-500/20 text-green-600";
    default:
      return "bg-gray-500/20 text-gray-600";
  }
}

<div className={cn("w-12 h-12 rounded-full flex items-center justify-center", getEntityAvatarColor(type))}>
  <span className="text-lg font-semibold">
    {getInitials(name)}
  </span>
</div>
```

### Alpha Transparency Pattern

Uses `/10` (10% opacity) for background and full color for text:

- `bg-blue-500/10` - Very subtle blue background
- `text-blue-500` - Full blue text
- `hover:bg-blue-500/20` - Darker blue on hover (20% opacity)

This creates a subtle colored background while keeping text highly readable.

## Table Patterns

### Basic Table

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Type</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map(item => (
      <TableRow key={item.id}>
        <TableCell className="font-medium">{item.name}</TableCell>
        <TableCell>{item.type}</TableCell>
        <TableCell>
          <Badge>{item.status}</Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button size="sm" variant="ghost">Edit</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Sortable Table

```tsx
const [sortBy, setSortBy] = useState("name");
const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

<TableHead
  className="cursor-pointer hover:bg-accent"
  onClick={() => {
    if (sortBy === "name") {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy("name");
      setSortOrder("asc");
    }
  }}
>
  <div className="flex items-center gap-2">
    Name
    {sortBy === "name" && (
      <ChevronDown className={`h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""}`} />
    )}
  </div>
</TableHead>
```

### Empty Table State

```tsx
<Table>
  <TableHeader>{/* Headers */}</TableHeader>
  <TableBody>
    {items.length === 0 ? (
      <TableRow>
        <TableCell colSpan={4} className="h-32 text-center">
          <div className="flex flex-col items-center gap-2">
            <FileX className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No items found</p>
          </div>
        </TableCell>
      </TableRow>
    ) : (
      items.map(item => (
        <TableRow key={item.id}>
          {/* Cells */}
        </TableRow>
      ))
    )}
  </TableBody>
</Table>
```

## Card Layouts

### Standard Entity Card

```tsx
<Card
  className="cursor-pointer hover:shadow-md transition-shadow"
  onClick={() => navigate(`/entity/${entity.uuid}`)}
>
  <CardContent className="p-5">
    <div className="flex items-start gap-4">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-lg font-semibold text-primary">
            {getInitials(entity.name)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg truncate">
            {entity.name}
          </h3>
          <Badge variant="secondary" className={getEntityTypeColor(entity.type)}>
            {entity.type}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {entity.summary}
        </p>
      </div>
    </div>
  </CardContent>
</Card>
```

**Key features:**
- Avatar with initials (12x12 circle)
- Truncated title (single line)
- Line-clamped description (2 lines)
- Colored badge for entity type
- Hover shadow for interactivity

### Compact Card

```tsx
<Card className="cursor-pointer hover:shadow-md transition-shadow">
  <CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <Badge>{status}</Badge>
    </div>
  </CardContent>
</Card>
```

### Info Card (Non-Interactive)

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">Label:</span>
        <span className="text-sm font-medium">{value}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">Label:</span>
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  </CardContent>
</Card>
```

## Collapsible Sections

### Basic Collapsible

```tsx
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

const [isOpen, setIsOpen] = useState(false);

<Collapsible open={isOpen} onOpenChange={setIsOpen}>
  <CollapsibleTrigger className="flex items-center gap-2 font-semibold w-full">
    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
    Section Title ({items.length})
  </CollapsibleTrigger>
  <CollapsibleContent className="mt-2">
    <div className="space-y-2">
      {items.map(item => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  </CollapsibleContent>
</Collapsible>
```

### Collapsible with Badge

```tsx
<CollapsibleTrigger className="flex items-center gap-2 w-full">
  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
  <span className="font-semibold">Section Title</span>
  <Badge variant="secondary">{items.length}</Badge>
</CollapsibleTrigger>
```

## Grouped Content

### Grouped by Date

```tsx
interface GroupedData {
  date: string;
  items: Item[];
}

<div className="space-y-6">
  {groupedData.map(group => (
    <div key={group.date}>
      <h3 className="font-semibold text-lg mb-3">{group.date}</h3>
      <div className="space-y-2">
        {group.items.map(item => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  ))}
</div>
```

### Grouped with Collapsible

```tsx
<div className="space-y-4">
  {groups.map(group => (
    <Collapsible key={group.id} defaultOpen={group.id === defaultOpenGroup}>
      <Card>
        <CardHeader className="p-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              <span className="font-semibold">{group.name}</span>
            </div>
            <Badge variant="secondary">{group.items.length}</Badge>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2">
              {group.items.map(item => (
                <div key={item.id} className="p-3 rounded-md bg-accent">
                  {/* Item content */}
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  ))}
</div>
```

## Skeleton Loaders

### Grid Skeleton

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {[...Array(6)].map((_, i) => (
    <Card key={i}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

### List Skeleton

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

### Table Skeleton

```tsx
<div className="space-y-2">
  {[...Array(10)].map((_, i) => (
    <Skeleton key={i} className="h-12 w-full" />
  ))}
</div>
```

## Badge Display Patterns

### Count Badge

```tsx
<div className="flex items-center gap-2">
  <span className="font-medium">Related Items</span>
  <Badge variant="secondary">{items.length}</Badge>
</div>
```

### Status Badge

```tsx
function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return <Badge className="bg-green-500/10 text-green-600">Active</Badge>;
    case "pending":
      return <Badge className="bg-yellow-500/10 text-yellow-600">Pending</Badge>;
    case "inactive":
      return <Badge className="bg-gray-500/10 text-gray-600">Inactive</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}
```

### Multiple Badges

```tsx
<div className="flex flex-wrap gap-2">
  {tags.map(tag => (
    <Badge key={tag} variant="secondary">
      {tag}
    </Badge>
  ))}
</div>
```

## Pagination Display

### Page Info

```tsx
<div className="flex items-center justify-between text-sm text-muted-foreground">
  <span>
    Showing {startIndex + 1} to {Math.min(endIndex, total)} of {total} results
  </span>
  <span>Page {currentPage} of {totalPages}</span>
</div>
```

### Items Per Page Selector

```tsx
<div className="flex items-center gap-2">
  <span className="text-sm text-muted-foreground">Items per page:</span>
  <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
    <SelectTrigger className="w-[70px]">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="10">10</SelectItem>
      <SelectItem value="25">25</SelectItem>
      <SelectItem value="50">50</SelectItem>
      <SelectItem value="100">100</SelectItem>
    </SelectContent>
  </Select>
</div>
```

## Data Density

### Compact Mode

Reduce padding and spacing for more data on screen:

```tsx
// Standard
<CardContent className="p-5">

// Compact
<CardContent className="p-3">

// Standard spacing
<div className="space-y-4">

// Compact spacing
<div className="space-y-2">
```

### Comfortable Mode (Default)

Standard padding and spacing for easy reading:

```tsx
<CardContent className="p-5">
<div className="space-y-4">
```

### Spacious Mode

Extra padding and spacing for focus:

```tsx
<CardContent className="p-6">
<div className="space-y-6">
```

## Overflow Handling

### Text Overflow

```tsx
// Single line truncate
<h3 className="truncate">{longTitle}</h3>

// Multi-line clamp
<p className="line-clamp-2">{longDescription}</p>
<p className="line-clamp-3">{longerContent}</p>
```

### Horizontal Scroll

```tsx
<div className="overflow-x-auto">
  <Table>
    {/* Wide table content */}
  </Table>
</div>
```

### Vertical Scroll with Fixed Height

```tsx
<div className="h-96 overflow-y-auto">
  <div className="space-y-2">
    {longList.map(item => (
      <ItemCard key={item.id} item={item} />
    ))}
  </div>
</div>
```

## Empty List Messages

### No Results

```tsx
{items.length === 0 && (
  <Card>
    <CardContent className="p-12 text-center text-muted-foreground">
      <FileX className="h-12 w-12 mx-auto mb-4" />
      <p>No items found</p>
    </CardContent>
  </Card>
)}
```

### No Search Results

```tsx
{searchQuery && filteredItems.length === 0 && (
  <Card>
    <CardContent className="p-12 text-center text-muted-foreground">
      <p>No results found for "{searchQuery}"</p>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSearchQuery("")}
        className="mt-4"
      >
        Clear search
      </Button>
    </CardContent>
  </Card>
)}
```

## Implementation Notes

### Performance Considerations

**Virtualization for long lists:**
Consider using `react-window` or `react-virtual` for lists with 100+ items to maintain smooth scrolling performance.

**Pagination vs Infinite Scroll:**
- Pagination: Better for known data size, easier to navigate to specific items
- Infinite scroll: Better for discovery, continuous browsing experience

**Skeleton loaders:**
Show skeleton loaders matching the actual content structure for better perceived performance.

### Accessibility

**Semantic HTML:**
- Use `<ul>` and `<li>` for lists
- Use `<table>` for tabular data
- Proper heading hierarchy

**Keyboard navigation:**
- Interactive cards should be keyboard accessible
- Use proper button/link elements for actions

**Screen readers:**
- Add ARIA labels for sortable columns
- Announce loading states
- Provide context for icon-only actions
