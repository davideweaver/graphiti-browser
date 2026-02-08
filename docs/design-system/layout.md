# Layout

Page structure, Container component, responsive patterns, and content layout strategies.

## Container Component

The **Container** component is the foundational layout element for all pages. It provides a consistent header/content structure with responsive behavior and flexible content modes.

### Full Component Code

```tsx
import { useEffect } from "react";
import useScrollToTop from "@/hooks/use-scroll-to-top";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const DEFAULT_PADDING = 24;

type Props = {
  children: React.ReactNode;
  title: React.ReactNode;
  description?: string;
  tools?: React.ReactNode;
  bodyHorzPadding?: number;
  bodyTopOffset?: number;
  maintainScrollPosition?: boolean;
  loading?: boolean;
  content?: ContentType;
};

export type ContentType = "fixed" | "full" | "fixedWithScroll";

const Container: React.FC<Props> = ({
  children,
  title,
  description,
  tools = null,
  bodyHorzPadding: bodyPadding,
  bodyTopOffset: topOffset = 40,
  maintainScrollPosition = false,
  loading = false,
  content = "full",
}) => {
  useScrollToTop(!maintainScrollPosition);
  const bodyHorzPadding = bodyPadding ?? DEFAULT_PADDING;
  const isMobile = useIsMobile();

  // fixedWithScroll is the same as fixed, but has scrollbars
  const isScrollable = content === "fixedWithScroll";
  const isFixed = content === "fixed" || content === "fixedWithScroll";

  useEffect(() => {
    if (isFixed) {
      document.documentElement.style.overflowY = "hidden";
      return () => {
        document.documentElement.style.overflowY = "auto";
      };
    }
  }, [isFixed]);

  // Container classes and styles based on fullHeight prop
  const containerClasses = isFixed
    ? "h-screen flex flex-col p-0 ml-0 pt-4 md:pt-8 overflow-hidden"
    : "h-screen p-0 ml-0 pt-4 md:pt-8";

  // Header classes and styles based on fullHeight prop
  const headerClasses = isFixed
    ? "flex max-w-screen-lg flex-col lg:flex-row justify-between items-start w-auto mb-4 lg:mb-6 lg:flex-shrink-0"
    : "flex max-w-screen-lg flex-col lg:flex-row justify-between items-start w-auto mb-4 lg:mb-10";

  const headerStyle = isFixed
    ? {
        paddingLeft: DEFAULT_PADDING,
        paddingRight: DEFAULT_PADDING,
      }
    : {
        paddingLeft: DEFAULT_PADDING,
        paddingRight: DEFAULT_PADDING,
        marginBottom: topOffset,
      };

  const titleClasses = isFixed ? "pb-2 lg:pb-0" : "pb-2 lg:pb-0";
  const titleStyle = isMobile ? { marginLeft: 40 } : {};

  // Content area classes and styles based on fullHeight prop
  const contentClasses = isFixed
    ? "max-w-screen-lg flex-1 min-h-0 overflow-hidden"
    : "max-w-screen-lg";

  const contentStyle = isFixed
    ? {
        paddingLeft: isMobile ? 0 : bodyHorzPadding,
        paddingRight: isMobile ? 0 : bodyHorzPadding,
        paddingBottom: isMobile
          ? isScrollable
            ? 0
            : 80
          : isScrollable
            ? 0
            : 50,
        marginBottom: isMobile ? 64 : 20, // Add bottom margin for mobile navbar (64px)
        overflow: "hidden",
      }
    : {
        paddingLeft: bodyHorzPadding,
        paddingRight: bodyHorzPadding,
        paddingBottom: isMobile ? 64 : 50, // Add bottom padding for mobile navbar (64px + 16px margin)
        width: isMobile ? "100vw" : "100%",
        overflow: "hidden",
      };

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className={headerClasses} style={headerStyle}>
        <div className={titleClasses} style={titleStyle}>
          <h1
            className="font-bold flex items-center"
            style={{ fontSize: 28, lineHeight: 1.2, marginTop: 6 }}
          >
            {title}{" "}
            {loading && (
              <Loader2 className="h-6 w-6 ml-2 animate-spin text-muted-foreground" />
            )}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              {description}
            </p>
          )}
        </div>
        <div className="flex flex-col md:flex-row gap-2 h-full items-center">
          {tools}
        </div>
      </div>

      {/* Main content area */}
      {!loading && (
        <div className={contentClasses} style={contentStyle}>
          {isFixed && (
            <div
              style={{
                height: "100%",
                width: "100%",
                overflow: isScrollable ? "auto" : "hidden",
              }}
            >
              {children}
            </div>
          )}
          {!isFixed && children}
        </div>
      )}
    </div>
  );
};

export default Container;
```

### Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | Required | Page content to render |
| `title` | `ReactNode` | Required | Page title (can be string or JSX) |
| `description` | `string` | `undefined` | Optional subtitle/description |
| `tools` | `ReactNode` | `null` | Toolbar buttons (usually ContainerToolButton components) |
| `bodyHorzPadding` | `number` | `24` | Horizontal padding for content area (px) |
| `bodyTopOffset` | `number` | `40` | Extra space between header and content (px) |
| `maintainScrollPosition` | `boolean` | `false` | Don't auto-scroll to top on mount |
| `loading` | `boolean` | `false` | Show loading spinner next to title |
| `content` | `ContentType` | `"full"` | Content layout mode (see below) |

### Content Types

**`"full"` (default)** - Standard scrollable page

- Content flows naturally with page scroll
- No height constraints
- Best for: Lists, forms, long content

```tsx
<Container title="Entities" content="full">
  <div className="space-y-4">
    {entities.map(entity => <EntityCard key={entity.id} entity={entity} />)}
  </div>
</Container>
```

**`"fixed"` - Fixed height with no scrolling**

- Takes full viewport height
- Disables page-level scrolling
- Content must fit in available space or handle its own scrolling
- Best for: Dashboards, grids with known size

```tsx
<Container title="Dashboard" content="fixed">
  <div className="grid grid-cols-3 gap-4 h-full">
    <Card>...</Card>
    <Card>...</Card>
    <Card>...</Card>
  </div>
</Container>
```

**`"fixedWithScroll"` - Fixed height with content scrolling**

- Takes full viewport height
- Disables page-level scrolling
- Content area has its own scrollbar
- Best for: Tables, chat interfaces, infinite scroll

```tsx
<Container title="Messages" content="fixedWithScroll">
  <div className="h-full overflow-auto">
    {messages.map(msg => <MessageCard key={msg.id} message={msg} />)}
  </div>
</Container>
```

### Mobile Behavior

**Title Padding:**
- Desktop: No extra margin
- Mobile: 40px left margin to accommodate hamburger menu

**Content Padding:**
- Desktop: 24px horizontal padding (default)
- Mobile: 0px horizontal padding (edge-to-edge for cards)

**Bottom Spacing:**
- Desktop: 50px bottom padding
- Mobile: 64px bottom padding (for mobile navigation bar)

### Loading State

Pass `loading={true}` to show a spinner next to the title:

```tsx
<Container title="Loading..." loading={isLoading}>
  {/* Content only renders when loading=false */}
</Container>
```

The content is hidden while loading to prevent layout shift.

### Toolbar Integration

Use the `tools` prop to add action buttons in the header:

```tsx
import { ContainerToolButton } from "@/components/container/ContainerToolButton";

const tools = (
  <div className="flex gap-2">
    <ContainerToolButton size="sm" onClick={handleAdd}>
      <Plus className="h-4 w-4 mr-2" />
      Add New
    </ContainerToolButton>
  </div>
);

<Container title="Entities" tools={tools}>
  {/* content */}
</Container>
```

See [patterns.md](./patterns.md#tool-button-hierarchy) for toolbar button patterns.

## SecondaryNavContainer Component

The **SecondaryNavContainer** component provides a consistent layout structure for secondary navigation sidebars. It follows the same title + tools + children pattern as the Container component but is specifically designed for navigation contexts.

### Component Code

```tsx
import type { ReactNode } from "react";

interface SecondaryNavContainerProps {
  title: string;
  tools?: ReactNode;
  children: ReactNode;
}

export function SecondaryNavContainer({
  title,
  tools,
  children,
}: SecondaryNavContainerProps) {
  return (
    <nav className="w-full md:w-[380px] bg-card flex flex-col min-w-0">
      {/* Header */}
      <div className="pt-4 md:pt-8 px-6 flex items-center justify-between mb-4">
        <h2 className="font-bold" style={{ fontSize: 28 }}>
          {title}
        </h2>
        {tools && <div className="flex items-center gap-1">{tools}</div>}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-auto">{children}</div>
    </nav>
  );
}
```

### Props

- **title** (string, required) - Navigation section title displayed in header
- **tools** (ReactNode, optional) - Toolbar buttons or controls for the header
- **children** (ReactNode, required) - Scrollable navigation content

### Key Features

1. **Fixed Width on Desktop** - 380px width on md+ breakpoints, full width on mobile
2. **Consistent Header** - Title + tools layout with responsive padding
3. **Scrollable Content** - Content area uses flex-1 overflow-auto for scrolling
4. **Tool Buttons** - Uses gap-1 (4px) between toolbar items for compact spacing
5. **Responsive Padding** - pt-4 on mobile, pt-8 on desktop

### Usage Example

```tsx
import { SecondaryNavContainer } from "@/components/navigation/SecondaryNavContainer";
import { SecondaryNavToolButton } from "@/components/navigation/SecondaryNavToolButton";
import { SecondaryNavItem } from "@/components/navigation/SecondaryNavItem";
import { RefreshCw, Search } from "lucide-react";

export function DocumentsSecondaryNav() {
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
        </>
      }
    >
      {/* Navigation items */}
      <div className="px-4 pb-4">
        <SecondaryNavItem isActive={false} onClick={handleClick}>
          Item content
        </SecondaryNavItem>
      </div>
    </SecondaryNavContainer>
  );
}
```

### Comparison with Container Component

| Feature | Container | SecondaryNavContainer |
|---------|-----------|----------------------|
| **Purpose** | Primary page content | Secondary navigation sidebar |
| **Width** | Full width (max-width constraints) | Fixed 380px on desktop, full on mobile |
| **Title Type** | ReactNode (can be JSX) | String only |
| **Tool Button Gap** | gap-2 (8px) | gap-1 (4px) |
| **Tool Button Component** | ContainerToolButton | SecondaryNavToolButton |
| **Content Scrolling** | Configurable (full/fixed/fixedWithScroll) | Always scrollable |

### Content Structure

SecondaryNavContainer children typically include:

1. **Breadcrumbs** (optional) - Navigation breadcrumb trail
2. **Back Button** (optional) - Return to parent navigation
3. **Items List** - Scrollable list of navigation items using SecondaryNavItem

```tsx
<SecondaryNavContainer title="Documents" tools={tools}>
  {/* Breadcrumbs */}
  {breadcrumbs.length > 0 && (
    <div className="px-6 pb-2">
      {/* Breadcrumb content */}
    </div>
  )}

  {/* Back Button */}
  {canGoBack && (
    <div className="px-6 pb-2">
      <Button onClick={handleBack}>Back</Button>
    </div>
  )}

  {/* Items List */}
  <div className="flex-1 overflow-auto px-4 pb-4">
    {items.map(item => (
      <SecondaryNavItem key={item.id} {...item} />
    ))}
  </div>
</SecondaryNavContainer>
```

See [patterns.md](./patterns.md#secondary-navigation-tool-buttons) for toolbar button patterns.

## Page Structure

### Standard Page Template

```tsx
import Container from "@/components/container/Container";
import { ContainerToolButton } from "@/components/container/ContainerToolButton";
import { Card, CardContent } from "@/components/ui/card";

export default function MyPage() {
  const tools = (
    <div className="flex gap-2">
      <ContainerToolButton size="sm" onClick={handleAction}>
        Action
      </ContainerToolButton>
    </div>
  );

  return (
    <Container
      title="Page Title"
      description="Optional description"
      tools={tools}
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="p-5">
            {/* Card content */}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
```

### List Page Pattern

For paginated lists of items:

```tsx
<Container title="Entities">
  <div className="space-y-3">
    {items.map(item => (
      <ItemCard key={item.id} item={item} />
    ))}
  </div>

  {/* Pagination */}
  <div className="flex justify-between mt-6">
    <Button onClick={handlePrevious}>Previous</Button>
    <Button onClick={handleNext}>Next</Button>
  </div>
</Container>
```

### Grid Layout Pattern

For grid-based content:

```tsx
<Container title="Dashboard" content="fixed">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {items.map(item => (
      <Card key={item.id}>
        <CardContent className="p-5">
          {/* Card content */}
        </CardContent>
      </Card>
    ))}
  </div>
</Container>
```

### Detail Page Pattern

For single-item detail pages:

```tsx
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const tools = (
    <div className="flex gap-2">
      <ContainerToolButton size="sm" onClick={() => navigate(-1)}>
        <ChevronLeft className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline">Back</span>
      </ContainerToolButton>
      <ContainerToolButton variant="destructive" size="sm" onClick={handleDelete}>
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </ContainerToolButton>
    </div>
  );

  return (
    <Container title={item.name} tools={tools}>
      <Card>
        <CardContent className="p-6">
          {/* Item details */}
        </CardContent>
      </Card>
    </Container>
  );
}
```

## Responsive Patterns

### Breakpoints

Using Tailwind's default breakpoints:

| Breakpoint | Min Width | Use Case |
|------------|-----------|----------|
| `sm` | 640px | Small tablets |
| `md` | 768px | Tablets, small laptops |
| `lg` | 1024px | Desktops |
| `xl` | 1280px | Large desktops |
| `2xl` | 1536px | Extra large screens |

**Max content width:** `max-w-screen-lg` (1024px) for optimal readability.

### Responsive Grid Columns

```tsx
// 1 column on mobile, 2 on tablet, 3 on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Responsive Flex Direction

```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col md:flex-row gap-4">
```

### Responsive Spacing

```tsx
// Tighter spacing on mobile, wider on desktop
<div className="space-y-3 md:space-y-4">
```

### Responsive Text

```tsx
// Hide text on mobile, show on desktop
<span className="hidden md:inline">Back</span>

// Smaller text on mobile
<p className="text-sm md:text-base">
```

### Responsive Padding

```tsx
// Less padding on mobile
<div className="p-4 md:p-6">
```

### Mobile-First Approach

Design for mobile first, enhance for larger screens:

```tsx
// ✅ Good: Mobile first
<div className="p-4 md:p-6 lg:p-8">

// ❌ Bad: Desktop first
<div className="p-8 lg:p-6 md:p-4">
```

## Layout Utilities

### Max Width Constraint

```tsx
<div className="max-w-screen-lg mx-auto">
  {/* Content constrained to 1024px, centered */}
</div>
```

### Full Width on Mobile

```tsx
<div className="w-full md:w-auto">
  {/* Full width on mobile, auto on desktop */}
</div>
```

### Horizontal Centering

```tsx
<div className="mx-auto max-w-2xl">
  {/* Centered with max width */}
</div>
```

### Vertical Centering

```tsx
<div className="flex items-center justify-center min-h-screen">
  {/* Vertically and horizontally centered */}
</div>
```

### Aspect Ratio

```tsx
<div className="aspect-video">
  {/* Maintains 16:9 aspect ratio */}
</div>

<div className="aspect-square">
  {/* Maintains 1:1 aspect ratio */}
</div>
```

## Content Area Patterns

### Scrollable Content

```tsx
<div className="h-full overflow-auto">
  {/* Content scrolls independently */}
</div>
```

### Two-Column Layout

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div>{/* Left column */}</div>
  <div>{/* Right column */}</div>
</div>
```

### Sidebar Layout

```tsx
<div className="flex gap-6">
  <aside className="w-64 flex-shrink-0">
    {/* Sidebar */}
  </aside>
  <main className="flex-1 min-w-0">
    {/* Main content */}
  </main>
</div>
```

### Sticky Header

```tsx
<div className="sticky top-0 z-10 bg-background">
  {/* Stays at top when scrolling */}
</div>
```

## Mobile Navigation

Account for mobile navigation bar at bottom:

```tsx
// Add bottom padding to prevent content from being hidden
<div className="pb-16 md:pb-0">
  {/* Content */}
</div>
```

The Container component automatically handles this with:
- Mobile: 64px bottom padding
- Desktop: 50px bottom padding

## Z-Index Layers

Establish z-index hierarchy for overlapping elements:

| Layer | Z-Index | Use Case |
|-------|---------|----------|
| Base | `z-0` | Default content |
| Sticky | `z-10` | Sticky headers |
| Dropdown | `z-20` | Dropdowns, tooltips |
| Overlay | `z-30` | Overlays, modals |
| Toast | `z-50` | Toast notifications |

```tsx
<div className="sticky top-0 z-10">  // Sticky header
<Dialog className="z-30">            // Modal dialog
```

## Implementation Notes

### Required Hooks

The Container component uses two custom hooks:

**useScrollToTop** - Scrolls to top on mount (unless disabled)

```tsx
import { useEffect } from "react";

export default function useScrollToTop(enabled = true) {
  useEffect(() => {
    if (enabled) {
      window.scrollTo(0, 0);
    }
  }, [enabled]);
}
```

**useIsMobile** - Detects mobile viewport

```tsx
import { useEffect, useState } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}
```

### Mobile Hamburger Menu

If your app has a hamburger menu on mobile, the 40px left margin on the title accommodates it:

```tsx
// Title automatically adjusts
const titleStyle = isMobile ? { marginLeft: 40 } : {};
```

If you don't have a hamburger menu, you can remove this adjustment.

### Content Edge-to-Edge on Mobile

Cards and lists go edge-to-edge on mobile for better use of screen space:

```tsx
// Container removes horizontal padding on mobile
paddingLeft: isMobile ? 0 : bodyHorzPadding,
paddingRight: isMobile ? 0 : bodyHorzPadding,
```

Individual cards should still have internal padding (`p-5`).
