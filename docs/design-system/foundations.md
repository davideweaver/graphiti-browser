# Foundations

The fundamental building blocks of the design system: typography, colors, spacing, and visual effects.

## Typography

### Font Family

**Inter** - Modern, highly legible sans-serif designed for user interfaces.

```css
@import url("//fonts.googleapis.com/css2?family=Inter:wght@400..700&display=swap");

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

Applied via Tailwind's `font-inter` class (configure in `tailwind.config.js`).

### Font Sizes

**Page Titles (H1):**
- Size: 28px
- Line height: 1.2
- Weight: 700 (bold)
- Top margin: 6px (for optical alignment)

```tsx
<h1
  className="font-bold flex items-center"
  style={{ fontSize: 28, lineHeight: 1.2, marginTop: 6 }}
>
  {title}
</h1>
```

**Card Titles (H3):**
- Size: 18px (text-lg)
- Weight: 600 (semibold)

```tsx
<h3 className="font-semibold text-lg truncate">
  {entity.name}
</h3>
```

**Body Text:**
- Default: 16px (base)
- Small: 14px (text-sm)
- Extra small: 12px (text-xs)

**Labels:**
- Size: 14px (text-sm)
- Weight: 500 (medium)

### Font Weights

- 400: Regular text
- 500: Medium (labels, subtle emphasis)
- 600: Semibold (card titles, section headers)
- 700: Bold (page titles, strong emphasis)

## Color System

### CSS Variables

The color system uses HSL values in CSS variables for easy theme switching.

**Light Mode (`:root`):**

```css
:root {
  /* Backgrounds */
  --background: 0 0% 100%;              /* Pure white page background */
  --card: 0 0% 100%;                    /* White card background */
  --popover: 0 0% 100%;                 /* White popover background */

  /* Foregrounds (text colors) */
  --foreground: 222.2 84% 4.9%;         /* Near-black primary text */
  --card-foreground: 222.2 84% 4.9%;    /* Card text */
  --muted-foreground: 0 0% 57%;         /* Gray secondary text */

  /* Semantic colors */
  --primary: 220 10% 95%;               /* Light gray primary */
  --primary-foreground: 222.2 47.4% 11.2%; /* Dark text on primary */
  --destructive: 0 84.2% 60.2%;         /* Red for delete actions */
  --destructive-foreground: 210 40% 98%; /* Light text on red */

  /* UI elements */
  --border: 214.3 31.8% 91.4%;          /* Light gray borders */
  --input: 200 12% 95.1%;               /* Light input background */
  --ring: 222.2 84% 4.9%;               /* Focus ring (dark) */

  /* Additional */
  --card-border: 200 12% 85%;           /* Card border color */
  --radius: 0.5rem;                     /* Border radius (8px) */
}
```

**Dark Mode (`.dark`):**

```css
.dark {
  /* Backgrounds */
  --background: 228 10.64% 9.22%;       /* Very dark blue-gray */
  --card: 210 11% 13%;                  /* Dark card background */
  --popover: 216 8.2% 11.96%;           /* Dark popover background */

  /* Foregrounds */
  --foreground: 210 40% 98%;            /* Near-white text */
  --card-foreground: 210 40% 98%;       /* Card text */
  --muted-foreground: 215 10.2% 65.1%;  /* Gray secondary text */

  /* Semantic colors */
  --primary: 217.2 91.2% 59.8%;         /* Bright blue primary */
  --primary-foreground: 210 40% 98%;    /* Light text on primary */
  --destructive: 0 62.8% 30.6%;         /* Dark red for delete */
  --destructive-foreground: 210 40% 98%; /* Light text on red */

  /* UI elements */
  --border: 210 9.8% 20%;               /* Dark borders */
  --input: 210 11% 22%;                 /* Dark input background */
  --ring: 212.7 26.8% 83.9%;            /* Focus ring (light) */

  /* Additional */
  --card-border: 210 11% 10%;           /* Darker card border */
}
```

### Semantic Color Tokens

**Usage in Tailwind:**

```tsx
// Background colors
<div className="bg-background">       // Page background
<div className="bg-card">             // Card background
<div className="bg-primary">          // Primary button background
<div className="bg-destructive">      // Delete button background
<div className="bg-muted">            // Subtle background

// Text colors
<p className="text-foreground">       // Primary text
<p className="text-muted-foreground"> // Secondary text
<p className="text-primary">          // Primary accent text
<p className="text-destructive">      // Error/danger text

// Border colors
<div className="border-border">       // Default borders
<div className="border-input">        // Input borders
```

### Entity Type Colors

Special colors for entity type badges:

```tsx
const getEntityTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case "person":
      return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
    case "organization":
      return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20";
    case "location":
      return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
  }
};
```

Uses alpha transparency (`/10`, `/20`) for subtle colored backgrounds.

### Sidebar Colors

Sidebar has its own color tokens for visual separation:

```css
/* Light mode sidebar */
--sidebar-background: 0 0% 98.04%;    /* Off-white */
--sidebar-foreground: 240 5.3% 26.1%; /* Dark gray text */
--sidebar-border: 220 13% 91%;        /* Light border */

/* Dark mode sidebar */
--sidebar-background: 216 14% 7%;     /* Very dark */
--sidebar-foreground: 212 9% 66%;     /* Light gray text */
--sidebar-border: 216 14% 7%;         /* Matches background */
```

## Spacing Scale

### Padding

**Container default padding:** 24px (on desktop)

```tsx
const DEFAULT_PADDING = 24;

// Applied to Container header and content
style={{ paddingLeft: DEFAULT_PADDING, paddingRight: DEFAULT_PADDING }}
```

**Mobile adjustments:**
- Title left margin: 40px (to accommodate hamburger menu)
- Content horizontal padding: 0px on mobile (for edge-to-edge cards)

**Card padding:**
- Standard: 20px (`p-5` in Tailwind)
- Compact: 16px (`p-4`)

```tsx
<CardContent className="p-5">  // Standard card content
<CardHeader className="p-6">   // Card header (slightly more padding)
```

### Margins and Gaps

**Vertical spacing:**
- Between major sections: 40px (`mb-10`)
- Between cards in a list: 12px (`space-y-3`)
- Between form fields: 16px (`space-y-4`)
- Between header and content: 16-24px (`mb-4` to `mb-6`)

**Horizontal spacing:**
- Between toolbar buttons: 8px (`gap-2`)
- Between icon and text: 8px (`mr-2`)
- Between card avatar and content: 16px (`gap-4`)

```tsx
// Toolbar buttons
<div className="flex gap-2">

// Card layout
<div className="flex items-start gap-4">

// Form fields
<div className="space-y-4">
```

### Top Offsets

**Container body top offset:** 40px (default)

```tsx
// Space between header and body content
bodyTopOffset?: number;  // Defaults to 40
```

Can be adjusted per-page for tighter layouts.

## Border Radius

**Constant:** 8px (`--radius: 0.5rem`)

Applied consistently across all components:

```tsx
<Button className="rounded-md">     // 8px radius
<Card className="rounded-lg">       // 8px radius (lg = 0.5rem in Tailwind)
<Avatar className="rounded-full">   // Fully rounded for circles
```

**Scrollbar thumb:** 4px radius (half of standard radius)

## Shadows

**Card hover shadow:**

```tsx
<Card className="hover:shadow-md transition-shadow">
```

Subtle elevation on hover for interactive cards.

**Dialog/Popover shadows:**

Built into ShadCN components - uses Tailwind's default shadow scale.

## Scrollbar Styling

Custom scrollbar for both light and dark modes:

```css
*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

*::-webkit-scrollbar-track {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  background: hsl(var(--border) / 0.4);  /* 40% opacity */
  border-radius: 4px;
}

*::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--border) / 0.7);  /* 70% opacity on hover */
}

*::-webkit-scrollbar-corner {
  background: transparent;
}
```

**Key features:**
- 8px width (thin, unobtrusive)
- Transparent track (blends with background)
- Uses `--border` color with alpha transparency
- Darker on hover for feedback
- 4px rounded corners (matches design language)

## Visual Effects

### Transitions

**Color transitions:** Standard for interactive elements

```tsx
<Button className="transition-colors">  // Smooth color changes
<Card className="transition-shadow">    // Smooth shadow changes
```

**Animation classes:**

```tsx
<Loader2 className="animate-spin">  // Loading spinner rotation
```

### Opacity

**Disabled states:** 50% opacity

```tsx
<Button disabled className="disabled:opacity-50">
```

**Subtle backgrounds:** 10-20% opacity

```tsx
<Badge className="bg-blue-500/10">  // 10% blue background
<Badge className="bg-blue-500/20">  // 20% on hover
```

## Implementation Notes

### Applying Base Styles

Add to your global CSS file (e.g., `src/index.css`):

```css
@import url("//fonts.googleapis.com/css2?family=Inter:wght@400..700&display=swap");

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Insert CSS variables here */
  }

  .dark {
    /* Insert dark mode variables here */
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground font-inter;
  }

  /* Insert scrollbar styles here */
}
```

### Tailwind Configuration

Configure Inter font in `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
}
```

### Theme Switching

Use `next-themes` for dark mode:

```tsx
import { ThemeProvider } from "next-themes"

<ThemeProvider attribute="class" defaultTheme="system">
  <App />
</ThemeProvider>
```

The `.dark` class is automatically applied to the root element when dark mode is active.
