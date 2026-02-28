# Mobile Overflow Menu Pattern

A clean, reusable pattern for handling toolbar overflow on mobile devices with support for secure browser APIs like clipboard access.

## Quick Start

```tsx
import { MobileOverflowMenu } from "@/components/mobile/MobileOverflowMenu";
import { MobileDrawerButton } from "@/components/mobile/MobileBottomDrawer";

<MobileOverflowMenu title="More Options">
  {/* Tools that overflow on mobile */}
  <ContainerToolButton data-drawer-label="Refresh">...</ContainerToolButton>
  <DropdownMenu>...</DropdownMenu>
  <MobileDrawerButton>...</MobileDrawerButton>
</MobileOverflowMenu>
```

## The Problem

1. **Limited mobile toolbar space** - Too many tools don't fit on small screens
2. **Portaled dropdowns break clipboard** - Radix UI's Portal breaks "trusted user gesture" on mobile
3. **Manual responsive logic** - Requires duplicate code for desktop/mobile

## The Solution

**`MobileOverflowMenu`** wrapper that:
- Automatically handles desktop (inline) vs mobile (drawer) rendering
- Uses non-portaled drawer to preserve user gesture context
- Converts icon buttons to labeled menu items
- Flattens nested menus into single list
- Auto-closes drawer after actions

## How It Works

### Desktop (md and up)
```
[Always Visible] [Refresh] [Copy ▼] [Delete]
```
- Renders children inline with `hidden md:contents`
- Shows dropdown menus normally
- No three-dot button

### Mobile (below md)
```
[Always Visible] [⋮]
```
Click ⋮ → Opens drawer:
```
Refresh
Copy content
Copy absolute path
Copy relative path
Delete (red)
```
- Hides children
- Shows three-dot button (MoreVertical icon)
- Opens non-portaled bottom drawer
- Flattens all items into single menu

## Components

### MobileOverflowMenu (Wrapper)

**Location:** `src/components/mobile/MobileOverflowMenu.tsx`

**Props:**
- `title: string` - Drawer header title
- `children: ReactNode` - Tools to overflow
- `disabled?: boolean` - Disable overflow button

**What it processes:**
1. `ContainerToolButton` with `data-drawer-label` → Converts to drawer menu item
2. `MobileDrawerButton` → Passes through (for flattening menus)
3. Other components → Recursively processes children

### MobileBottomDrawer (Low-level)

**Location:** `src/components/mobile/MobileBottomDrawer.tsx`

Non-portaled drawer that renders inline with `fixed` positioning. Used internally by `MobileOverflowMenu`.

**Props:**
- `open: boolean` - Controlled state
- `onOpenChange: (open: boolean) => void` - State callback
- `title: string` - Header title
- `children: ReactNode` - Drawer buttons

### MobileDrawerButton (Menu Item)

**Location:** `src/components/mobile/MobileBottomDrawer.tsx`

**Props:**
- `onClick: () => void` - Click handler
- `icon?: ReactNode` - Optional icon
- `children: ReactNode` - Label text
- `className?: string` - Optional classes

**Styling:**
- Height: `h-12` (48px touch target)
- Padding: `px-4` (16px)
- Icon spacing: `mr-3` (12px)
- Hover: `hover:bg-accent`

## Usage Patterns

### Icon Button → Drawer Item

```tsx
<ContainerToolButton
  size="icon"
  onClick={handleRefresh}
  data-drawer-label="Refresh"  // ← Adds to drawer with text
>
  <RefreshCw className="h-4 w-4" />
</ContainerToolButton>
```

### Dropdown Menu → Flattened Items

Desktop shows dropdown, mobile flattens into drawer:

```tsx
{/* Desktop: Dropdown (inline) */}
<DropdownMenu>
  <DropdownMenuTrigger>Copy ▼</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Copy content</DropdownMenuItem>
    <DropdownMenuItem>Copy path</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

{/* Mobile: Flattened items (in drawer) */}
<MobileDrawerButton onClick={handleCopy1}>Copy content</MobileDrawerButton>
<MobileDrawerButton onClick={handleCopy2}>Copy path</MobileDrawerButton>
```

### Destructive Actions

Buttons with `variant="destructive"` get red text in drawer:

```tsx
<ContainerToolButton
  variant="destructive"
  data-drawer-label="Delete"
>
  <Trash2 />
</ContainerToolButton>
```

## Clipboard Support

The non-portaled drawer preserves "trusted user gesture" context for clipboard operations:

```tsx
const copyToClipboardSync = (text: string): boolean => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  const success = document.execCommand('copy');
  document.body.removeChild(textArea);

  return success;
};
```

Use synchronous `execCommand` first, fall back to async Clipboard API if needed.

## Complete Example

```tsx
<div className="flex gap-2">
  {/* Always visible */}
  <ContainerToolButton size="icon" onClick={handleEdit}>
    <Pencil className="h-4 w-4" />
  </ContainerToolButton>

  {/* Overflow on mobile */}
  <MobileOverflowMenu title="More Options" disabled={!data}>
    <ContainerToolButton
      size="icon"
      onClick={handleRefresh}
      data-drawer-label="Refresh"
    >
      <RefreshCw className="h-4 w-4" />
    </ContainerToolButton>

    {/* Desktop: dropdown */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ContainerToolButton size="sm">
          <Copy className="h-4 w-4" />
          <ChevronDown className="h-3 w-3 ml-1" />
        </ContainerToolButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleCopy1}>Copy content</DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopy2}>Copy path</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    {/* Mobile: flattened */}
    <MobileDrawerButton onClick={handleCopy1} icon={<Copy />}>
      Copy content
    </MobileDrawerButton>
    <MobileDrawerButton onClick={handleCopy2} icon={<Copy />}>
      Copy path
    </MobileDrawerButton>

    <ContainerToolButton
      size="icon"
      onClick={handleDelete}
      variant="destructive"
      data-drawer-label="Delete"
    >
      <Trash2 className="h-4 w-4" />
    </ContainerToolButton>
  </MobileOverflowMenu>
</div>
```

## Design Specifications

### Overflow Button (Mobile)
- Icon: MoreVertical (three dots)
- Size: `h-9 w-9` (matches ContainerToolButton)
- Hover: Standard button hover state

### Drawer Container
- Position: `fixed inset-0 z-50`
- Overlay: `bg-black/80` with fade animation
- Panel: Bottom-anchored with slide-up animation
- Border: `border-t rounded-t-lg`

### Drawer Header
- Padding: `p-4 pb-2`
- Title: `text-lg font-semibold`
- Close button: `h-9 w-9` with `X` icon (h-6 w-6, strokeWidth 2.5)
- Colors: `text-gray-400 hover:text-gray-300`

### Drawer Content
- Padding: `p-2 pb-6` (extra bottom for safe area)
- Layout: Vertical stack of buttons
- Buttons: `h-12` touch targets

## When to Use

✅ **Use this pattern when:**
- Toolbar has 4+ tools on desktop
- Tools include clipboard or secure APIs
- Want clean mobile UX with overflow menu
- Need automatic responsive behavior

❌ **Don't use when:**
- Only 2-3 tools (they fit on mobile)
- Desktop-only features
- Simple navigation links

## See Also

- [Container Tool Buttons](./patterns.md#tool-button-hierarchy)
- [Mobile Bottom Drawer](./patterns.md#mobile-bottom-drawer-pattern)
- [Design System Overview](./README.md)
