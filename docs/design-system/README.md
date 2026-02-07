# Design System

A comprehensive design system for building modern React applications with ShadCN UI and Tailwind CSS.

## Overview

This design system provides a complete set of patterns, components, and guidelines for creating consistent, accessible, and visually appealing user interfaces. It's built on industry-standard tools and follows modern best practices.

## Technology Stack

**UI Framework:**
- [ShadCN UI](https://ui.shadcn.com/) - Beautifully designed components built with Radix UI primitives
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible component primitives
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

**Typography:**
- [Inter](https://fonts.google.com/specimen/Inter) - Modern, highly readable sans-serif font from Google Fonts

**Icons:**
- [Lucide React](https://lucide.dev/) - Beautiful, consistent icon library

**Theme Management:**
- [next-themes](https://github.com/pacocoursey/next-themes) - Perfect dark mode support

## Prerequisites

Before using this design system in your project, ensure you have:

1. **ShadCN UI installed** - Follow the [ShadCN installation guide](https://ui.shadcn.com/docs/installation)
2. **Tailwind CSS configured** - With the ShadCN color scheme (CSS variables)
3. **Inter font loaded** - Add to your global CSS:
   ```css
   @import url("//fonts.googleapis.com/css2?family=Inter:wght@400..700&display=swap");
   ```
4. **Path alias configured** - `@/*` mapping to `src/*` in your build tool

## Quick Start

### 1. Install ShadCN Components

```bash
npx shadcn-ui@latest init
```

### 2. Add Global Styles

Copy the CSS variables and base styles from [foundations.md](./foundations.md#css-variables) to your `src/index.css` or equivalent global stylesheet.

### 3. Install Custom Components

The design system includes three custom components not part of ShadCN:

- **Container** - Main page layout component ([layout.md](./layout.md#container-component))
- **ContainerToolButton** - Specialized toolbar buttons ([components.md](./components.md#containertoolbutton))
- **DeleteConfirmationDialog** - Reusable delete confirmation ([patterns.md](./patterns.md#delete-confirmation-pattern))

Copy the full component code from the respective documentation files.

### 4. Follow the Patterns

Browse the documentation to understand the established patterns and conventions:

- Color usage and semantic tokens
- Component composition patterns
- Responsive design approaches
- Accessibility requirements

## Documentation Structure

### [UI Terminology](./ui-terminology.md)
Naming conventions for UI areas, components, state patterns, and file organization. Essential reference for consistent terminology.

### [Foundations](./foundations.md)
Typography, colors, spacing, border radius, shadows, and scrollbar styling. These are the building blocks of the design system.

### [Layout](./layout.md)
Page structure, Container component, responsive breakpoints, and content types. Learn how to structure pages consistently.

### [Components](./components.md)
Component usage patterns with examples. Covers buttons, cards, forms, dialogs, and more. Includes full code for custom components.

### [Patterns](./patterns.md)
Common UI patterns like toolbars, back buttons, delete confirmations, icon usage, and hover behaviors.

### [States](./states.md)
Interactive states including loading, hover, focus, transitions, and mutation feedback patterns.

### [Data Presentation](./data-presentation.md)
Grids, lists, tables, entity type coloring, skeleton loaders, and grouped content patterns.

### [Accessibility](./accessibility.md)
ARIA patterns, focus management, semantic HTML, keyboard navigation, and screen reader considerations.

## Key Design Principles

**Consistency** - Use established patterns throughout your application. Don't reinvent common UI elements.

**Simplicity** - Keep interfaces clean and uncluttered. Remove unnecessary visual elements.

**Responsiveness** - Design mobile-first, enhance for larger screens. Test on multiple devices.

**Accessibility** - Build for all users. Use semantic HTML, proper ARIA labels, and keyboard navigation.

**Performance** - Optimize bundle size with lazy loading. Use skeleton loaders for perceived performance.

**Maintainability** - Follow naming conventions. Use TypeScript for type safety. Document custom patterns.

## Using This Design System

### For New Projects

1. Set up your React project with Vite or Next.js
2. Install and configure ShadCN UI
3. Copy the CSS variables and base styles
4. Add the three custom components
5. Reference the documentation as you build features

### For Existing Projects

1. Compare your current setup with the prerequisites
2. Gradually adopt patterns where they improve consistency
3. Update components to match the design system conventions
4. Use the accessibility guidelines to improve existing features

### When Building Features

1. **Review UI terminology** - Use consistent naming for components and UI areas ([ui-terminology.md](./ui-terminology.md))
2. **Check the patterns first** - See if there's an established pattern for what you're building
3. **Use existing components** - Don't recreate what's already available
4. **Follow the conventions** - Match the spacing, sizing, and color usage
5. **Consider accessibility** - Use semantic HTML and ARIA labels
6. **Test responsively** - Verify mobile, tablet, and desktop layouts

## Color System Quick Reference

The design system uses CSS variables for theming:

- `--background` / `--foreground` - Page background and primary text
- `--card` / `--card-foreground` - Card backgrounds and text
- `--primary` / `--primary-foreground` - Primary actions and brand colors
- `--destructive` / `--destructive-foreground` - Delete/remove actions
- `--muted` / `--muted-foreground` - Secondary text and subtle elements
- `--border` - Borders, dividers, and separators

See [foundations.md](./foundations.md#color-system) for complete color documentation.

## Responsive Breakpoints

Tailwind's default breakpoints:

- `sm`: 640px (small tablets)
- `md`: 768px (tablets)
- `lg`: 1024px (desktops) - **Max content width**
- `xl`: 1280px (large desktops)

Most layouts use `max-w-screen-lg` (1024px) for optimal reading width.

See [layout.md](./layout.md#responsive-patterns) for responsive design patterns.

## Common Questions

**Q: Do I need to use all the patterns?**
A: No, use what's relevant for your project. The documentation provides options, not requirements.

**Q: Can I customize the color scheme?**
A: Yes! Modify the CSS variables in your global stylesheet. Keep the semantic token structure.

**Q: What if I need a pattern not documented here?**
A: Create it following the established conventions, then document it for future reference.

**Q: Is this design system framework-agnostic?**
A: The patterns and guidelines are universal. The code examples are React-specific but adaptable.

**Q: How do I handle dark mode?**
A: The CSS variables automatically support dark mode through the `.dark` class. Use `next-themes` for theme switching.

## Getting Help

If you have questions or need clarification on any pattern:

1. Search the documentation for keywords
2. Look at similar examples in the codebase
3. Check the ShadCN UI documentation for component-specific details
4. Review the Tailwind CSS docs for utility classes

## Contributing

When you establish new patterns or modify existing ones:

1. Update the relevant documentation file
2. Include clear code examples
3. Document responsive behavior
4. Note any accessibility considerations
5. Add screenshots or diagrams if helpful

Keep the documentation in sync with the implementation.
