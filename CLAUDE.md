# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A React-based web interface for browsing and managing Graphiti memory graphs. Graphiti is a knowledge graph system that extracts entities, relationships, and facts from conversational data. This browser provides a visual interface to search facts, browse entities, view episodes (raw interactions), and add new memories.

## Architecture

### Core Data Model

The application works with four main data types from the Graphiti API:

- **Episodes** - Raw interaction data (messages, conversations)
- **Entities** - Extracted people, organizations, locations, projects, etc.
- **Facts** - Searchable knowledge units connecting entities and episodes
- **Entity Edges** - Relationships between entities with temporal validity

All data is scoped by `group_id` (configured via `VITE_GROUP_ID` env var) and stored in an external Graphiti server.

### API Integration

**Base URL**: `http://localhost:8000` (configured via Vite proxy in `vite.config.ts`)

The `GraphitiService` singleton provides methods for all API operations:

**Search & Episodes:**
- `search()` - Search for facts by query
- `getEpisodes()` - List recent episodes
- `addMessages()` - Add new memories (async processing)

**Entity Operations:**
- `getEntity(uuid)` - Get single entity by UUID
- `listEntities(groupId, limit, cursor)` - List entities with pagination
- `getEntitiesByUuids(uuids)` - Batch entity retrieval

**Relationships:**
- `getEntityEdge(uuid)` - Get entity edge details
- `deleteEntityEdge(uuid)` - Remove relationships

**Management:**
- `createEntity()` - Create entity nodes
- `deleteEpisode()` - Remove episodes
- `healthcheck()` - Server status

API errors are automatically shown to users via toast notifications.

### Application Structure

```
src/
├── api/              # GraphitiService - centralized API client
├── components/       # Reusable UI components
│   ├── ui/          # ShadCN UI component library (complete)
│   ├── search/      # FactCard for search results
│   ├── entities/    # EntityCard for entity browsing
│   └── episodes/    # EpisodeCard for episode lists
├── context/         # GraphitiContext - global state (baseUrl, groupId)
├── hooks/           # Custom React hooks (debounce, scroll, toast, breakpoints)
├── layout/          # Router, Layout, Container components
├── lib/             # Utilities (cn, lazyImportComponent)
├── pages/           # Route pages (Dashboard, Search, Entities, etc.)
└── types/           # TypeScript interfaces for Graphiti data model
```

### State Management

- **TanStack Query (React Query)** - Server state, caching, and data fetching
  - Configured with 5-minute stale time and 1 retry
  - Query keys follow pattern: `[resource, groupId, ...params]`
- **GraphitiContext** - Global configuration (baseUrl, groupId)
- **React Router** - Client-side routing with lazy-loaded pages

### UI Components

Built with **ShadCN UI** (Radix UI + Tailwind CSS):
- Complete component library in `src/components/ui/`
- Theming via CSS variables and `next-themes`
- Responsive design with Tailwind breakpoints
- Form handling with `react-hook-form` + Zod validation

## Development Commands

**Prerequisites:**
- Graphiti server must be running on `http://localhost:8000`
- See `../graphiti-server/` for server setup and Docker instructions
- Copy `.env.example` to `.env` and configure `VITE_GROUP_ID` (required)

```bash
# Setup environment
cp .env.example .env
# Edit .env to set your group ID

# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Lint TypeScript/React code
npm run lint

# Preview production build
npm run preview

# Type check
npx tsc -b
```

## Configuration

### Path Aliases

`@/*` maps to `src/*` (configured in `vite.config.ts` and `tsconfig.app.json`)

### TypeScript

Uses TypeScript 5.9.3 with project references:
- `tsconfig.app.json` - Application code
- `tsconfig.node.json` - Build tooling (Vite, Tailwind)
- `tsconfig.json` - Root references

### Build Tool

**Vite 7** with `@vitejs/plugin-react-swc` for fast HMR and Fast Refresh

### Environment

**Graphiti Server Configuration:**
- Development: Vite proxy forwards `/api` requests to `http://localhost:8000` (configured in `vite.config.ts`)
- The Graphiti server must be running on port 8000 for the app to function
- Production: Update proxy target or use environment variables

**Group ID Configuration:**
- Configured via `VITE_GROUP_ID` environment variable (required)
- Copy `.env.example` to `.env` and set your group ID
- Restart dev server after changing `.env` for changes to take effect

## Key Implementation Patterns

### Data Fetching

Use React Query hooks in page components:

```tsx
const { data: episodes, isLoading } = useQuery({
  queryKey: ["episodes", groupId, 10],
  queryFn: () => graphitiService.getEpisodes(groupId, 10),
});
```

### API Calls

Use the `graphitiService` singleton - it handles errors and displays toast notifications automatically:

```tsx
await graphitiService.addMessages(messages, groupId);
// Success toast shown automatically
```

### Routing

Pages are lazy-loaded via `lazyImportComponent` utility to minimize initial bundle size.

### Entity Management

**Entity Data Model:**
- Entities use a `labels` array for type classification (e.g., `["Person", "Entity"]`)
- Legacy `entity_type` field supported for backward compatibility
- Additional metadata stored in `attributes` object
- All entities scoped by `group_id` for multi-tenancy

**Entity Listing:**
- The Entities page uses the direct `listEntities()` endpoint
- Supports pagination via cursor-based navigation
- Filters by entity type using the `labels` array
- Search filters by name and summary fields

**Entity Types:**
- Extracted dynamically from entity `labels` array
- Generic "Entity" label filtered out from type dropdown
- Falls back to legacy `entity_type` if present

## Working with This Codebase

### Adding a New Page

1. Create component in `src/pages/[PageName].tsx`
2. Add route in `src/layout/Router.tsx` using `lazyImportComponent`
3. Add navigation link if needed (e.g., in Layout or Dashboard)

### Adding API Methods

1. Define TypeScript types in `src/types/graphiti.ts`
2. Add method to `GraphitiService` class in `src/api/graphitiService.ts`
3. Include error handling and toast notifications

### Modifying the Data Model

When Graphiti API changes:
1. Update interfaces in `src/types/graphiti.ts`
2. Update `GraphitiService` methods if needed
3. Update consuming components to handle new fields

### Working with Entity Endpoints

**Single Entity Retrieval:**
```tsx
const { data: entity } = useQuery({
  queryKey: ["entity", uuid],
  queryFn: () => graphitiService.getEntity(uuid),
});
```

**List Entities with Pagination:**
```tsx
const { data } = useQuery({
  queryKey: ["entities-list", groupId, limit],
  queryFn: () => graphitiService.listEntities(groupId, limit),
});
// Returns: { entities: Entity[], total: number, has_more: boolean, cursor: string | null }
```

**Batch Entity Retrieval:**
```tsx
const { data } = useQuery({
  queryKey: ["entities-batch", uuids],
  queryFn: () => graphitiService.getEntitiesByUuids(uuids),
});
```

### Styling

- Use existing ShadCN components from `src/components/ui/`
- Follow Tailwind utility-first approach
- Use `cn()` helper for conditional classes
- Icons from `lucide-react`

## Important Notes

- The Graphiti API performs **asynchronous processing** for message ingestion - facts/entities may not appear immediately after adding memories
- **Entity data model**:
  - Entity types stored in `labels` array (e.g., `["Person", "Entity"]`)
  - Legacy `entity_type` field maintained for backward compatibility
  - Additional metadata in `attributes` object
- **Entity pagination**: Use cursor-based pagination for large entity lists (limit: 1-500 entities per request)
- Entity edges (relationships) have `valid_at` and `invalid_at` timestamps for temporal reasoning
- The server must be running at `localhost:8000` for the app to function
- All data operations require a `group_id` (multi-tenant design)
- Search results are limited by `max_facts` parameter (default: 10)
