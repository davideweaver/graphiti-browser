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

**Base URL**: Configured via `VITE_GRAPHITI_SERVER` environment variable (default: `http://localhost:8000`)

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

- Graphiti server must be running (default: `http://localhost:8000`, configurable via `VITE_GRAPHITI_SERVER`)
- See `../graphiti-server/` for server setup and Docker instructions
- Copy `.env.example` to `.env` and configure environment variables (at minimum, set `VITE_GROUP_ID` and `VITE_GRAPHITI_SERVER`)

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

**Server Configuration:**

All backend services are configured via environment variables:

- `VITE_GRAPHITI_SERVER` - Graphiti server base URL (default: `http://localhost:8000`)
  - HTTP API automatically derived from this URL
  - WebSocket URL automatically derived by replacing `http://` with `ws://` (or `https://` with `wss://`) and appending `/ws`
- `VITE_LLAMACPP_URL` - LlamaCPP inference server (default: `http://localhost:9004`)
- `VITE_CHAT_API_URL` - Chat backend service (default: `http://localhost:3001`)
- `VITE_GROUP_ID` - Graphiti group ID (required, no default)

**Setup:**

1. Copy `.env.example` to `.env`
2. Set your `VITE_GROUP_ID` (required)
3. Set `VITE_GRAPHITI_SERVER` to your Graphiti server URL (e.g., `http://172.16.0.14:3060`)
4. Optionally override other service URLs if using non-default configurations
5. Restart dev server after changing `.env` for changes to take effect

**Proxy Configuration:**

- Development: Vite proxy forwards `/api` to `VITE_GRAPHITI_SERVER` and `/llamacpp` to `VITE_LLAMACPP_URL`
- Production: Configure proxy targets via environment variables

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

- the inspiration for this web site design, UI, UX, architecture and components comes from this project: /Users/dweaver/Projects/davideweaver/section-shaper-single-page. when implementing new features, pages, etc look at that project.
- The Graphiti API performs **asynchronous processing** for message ingestion - facts/entities may not appear immediately after adding memories
- **Entity data model**:
  - Entity types stored in `labels` array (e.g., `["Person", "Entity"]`)
  - Legacy `entity_type` field maintained for backward compatibility
  - Additional metadata in `attributes` object
- **Entity pagination**: Use cursor-based pagination for large entity lists (limit: 1-500 entities per request)
- Entity edges (relationships) have `valid_at` and `invalid_at` timestamps for temporal reasoning
- The Graphiti server must be running for the app to function (configure URL via `VITE_GRAPHITI_SERVER`)
- All data operations require a `group_id` (multi-tenant design)
- Search results are limited by `max_facts` parameter (default: 10)
