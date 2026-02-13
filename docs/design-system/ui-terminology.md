# UI Terminology

Naming conventions for UI areas, components, state variables, and files. This guide focuses on **what to call things**, not how to implement them.

## UI Area Names

### Layout Regions

**Desktop Layout (3-column structure):**

```
┌─────┬──────────────┬────────────────────────┐
│ Pri │  Secondary   │         Page           │
│ Nav │     Nav      │                        │
│     │              │                        │
│ 75  │     380      │        flex-1          │
└─────┴──────────────┴────────────────────────┘
```

**Mobile Layout (closed):**

```
┌────────────────────────────┐
│  [☰]  Page Title           │
├────────────────────────────┤
│                            │
│         Page               │
│      (full width)          │
│                            │
└────────────────────────────┘
```

**Mobile Nav Overlay (open):**

```
┌──────────────┬─────────────┐
│ [✕]          │ Secondary   │
│ Primary Nav  │    Nav      │
│              │             │
│ [Dashboard]  │ Section     │
│ [Projects]   │ content     │
│ [Documents]  │ with        │
│ [Memory]     │ filters &   │
│ [Tasks]      │ items       │
│              │             │
│ [User Menu]  │             │
└──────────────┴─────────────┘
     (Sheet overlay combining both navs)
```

**Primary Nav** - The 75px left sidebar with icon-only navigation
- Component: `PrimaryNav`
- See [Layout](layout.md#navigation) for implementation details

**Secondary Nav** - The 380px middle column with contextual navigation
- Components: `SecondaryNav`, `ProjectsSecondaryNav`, `DocumentsSecondaryNav`, etc.
- Context-specific: Changes based on active section
- See [Layout](layout.md#navigation) for implementation details

**Page** - The primary content region on the right
- Uses the `Container` component pattern
- See [Layout](layout.md#container-component) for implementation details

**Mobile Nav** - Combined navigation for mobile devices
- Components: `MobileNavTrigger` (hamburger button), `MobileNavOverlay` (sheet)
- See [Layout](layout.md#responsive-patterns) for mobile patterns

## Component Naming Patterns

### Containers

- `Container` - Base page wrapper
- `ContainerTable` - Table layout wrapper
- `ContainerToolButton` - Toolbar action button

See [Components](components.md#container) for usage examples.

### Navigation

- `PrimaryNav` - Main left sidebar
- `PrimaryNavFooter` - User menu section of primary nav
- `SecondaryNav` - Middle column base component
- `[Section]SecondaryNav` - Section-specific navigation (e.g., `ProjectsSecondaryNav`)
- `MobileNavTrigger` - Mobile menu button
- `MobileNavOverlay` - Mobile navigation sheet

### Cards

- `FactCard` - Search result display
- `EntityCard` - Entity list item
- `EpisodeCard` - Episode list item

See [Data Presentation](data-presentation.md) for card patterns.

### Dialogs

- `DestructiveConfirmationDialog` - Reusable confirmation for destructive actions (delete, cancel, clear, etc.)
- `GraphManagementDialog` - Graph CRUD operations
- `UserProfileMenu` - User settings dropdown

See [Patterns](patterns.md#destructive-confirmation-pattern) for dialog patterns.

## State Naming Conventions

### Boolean States

Use `is[State]` pattern:

```tsx
const [isLoading, setIsLoading] = useState(false);
const [isOpen, setIsOpen] = useState(false);
const [isExpanded, setIsExpanded] = useState(true);
const [isEnabled, setIsEnabled] = useState(true);
const [isDeleting, setIsDeleting] = useState(false);
```

### Event Handlers

**Internal handlers:** Use `handle[Action]` pattern:
```tsx
const handleDelete = () => { /* ... */ };
const handleSubmit = () => { /* ... */ };
```

**Props/callbacks:** Use `on[Action]` pattern:
```tsx
<Component
  onDelete={handleDelete}
  onSubmit={handleSubmit}
/>
```

See [Patterns](patterns.md) for interaction patterns.

### Query Keys

Array format: `[resource, scope, ...params]`

```tsx
["entity", uuid]                      // Single entity
["entities-list", groupId, limit]     // Entity list
["episodes", groupId, 10]             // Episodes
["search", groupId, query]            // Search results
["agent-tasks", enabledFilter]        // Agent tasks
```

## File Naming Conventions

### Components

**PascalCase** matching component name:
```
Container.tsx
EntityCard.tsx
PrimaryNav.tsx
```

### Utilities and Services

**camelCase** describing function/purpose:
```
graphitiService.ts
agentTasksService.ts
cronFormatter.ts
```

### Types

**camelCase** describing domain:
```
graphiti.ts
agentTasks.ts
```

### Directories

**lowercase** with hyphens (if multi-word):
```
src/components/
src/components/ui/
src/components/navigation/
src/components/container/
```

## Folder Organization

```
src/components/
├── ui/              # ShadCN UI library
├── container/       # Container components
├── navigation/      # Navigation components
├── dialogs/         # Dialog components
├── sidebar/         # Sidebar-specific components
├── search/          # Search-related components
├── entities/        # Entity-related components
└── episodes/        # Episode-related components
```

See [Components](components.md) for detailed component documentation.

## Service Naming

### API Services

**Singleton pattern** with descriptive names:

```tsx
graphitiService.search()           // Graphiti API
graphitiService.getEntity()

agentTasksService.listTasks()      // Agent tasks API
agentTasksService.getTask()
```

## Quick Reference

| Concept | Name | Example |
|---------|------|---------|
| Left sidebar | Primary Nav | `PrimaryNav` |
| Middle column | Secondary Nav | `SecondaryNav` |
| Right content | Page | `Container` |
| Mobile menu | Mobile Nav | `MobileNavTrigger`, `MobileNavOverlay` |
| Page wrapper | Container | `<Container title="...">` |
| Toolbar button | ContainerToolButton | `<ContainerToolButton>` |
| Boolean state | is[State] | `isLoading`, `isOpen` |
| Event handler | handle[Action] | `handleSubmit` |
| Callback prop | on[Action] | `onSubmit` |
| Query key | [resource, ...] | `["entity", uuid]` |
| Component file | PascalCase | `EntityCard.tsx` |
| Utility file | camelCase | `cronFormatter.ts` |

## See Also

- [Layout](layout.md) - Implementation details for UI regions
- [Components](components.md) - Component usage and props
- [Patterns](patterns.md) - Common UI patterns and interactions
- [Foundations](foundations.md) - Colors, spacing, typography
