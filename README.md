# Graphiti Browser

A React-based web interface for browsing and managing [Graphiti](https://github.com/getzep/graphiti) knowledge graphs. Graphiti extracts entities, relationships, and facts from conversational data to build a temporal knowledge graph.

## Features

- **Search** - Query facts across your knowledge graph with semantic search
- **Entities** - Browse extracted entities (people, organizations, locations, projects) with filtering and pagination
- **Episodes** - View raw interaction history grouped by session and date
- **Sessions** - Track conversation sessions with stats and episode counts
- **Add Memory** - Manually add new memories to the knowledge graph
- **Chat** - Interactive chat interface with live WebSocket updates (if enabled)

## Source Format

When adding memories (episodes), each message includes a `source_description` field that identifies where the data originated:

**Format:** `<APP>: <FOLDER>`

**Examples:**
- `"Claude Code: contactcenter"` - Messages from Claude Code working on the contactcenter project
- `"CLI: graphiti-browser"` - Messages from a CLI tool working on graphiti-browser
- `"Web Chat: general"` - Messages from a web chat interface in the general context

This format allows you to track which application and project/folder generated each piece of data, making it easier to filter and organize episodes.

## Quick Start

### Prerequisites

- Node.js 18+
- Graphiti server running on `http://localhost:8000`
  - See `../graphiti-server/` for server setup
  - Or use Docker: `docker run -p 8000:8000 getzep/graphiti`

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and set VITE_GROUP_ID to your group ID
   ```

3. **Start dev server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   ```
   http://localhost:5173
   ```

## Development

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npx tsc -b

# Lint code
npm run lint
```

## Tech Stack

- **React 18** with TypeScript
- **Vite 7** for build tooling with Fast Refresh
- **TanStack Query (React Query)** for server state management
- **React Router** for client-side routing
- **ShadCN UI** (Radix UI + Tailwind CSS) for components
- **Tailwind CSS** for styling
- **React Hook Form + Zod** for form validation

## Configuration

### Environment Variables

Create a `.env` file with:

```env
# Required: Your Graphiti group ID
VITE_GROUP_ID=your-group-id
```

### Graphiti Server

The app expects the Graphiti server at `http://localhost:8000`. In development, Vite proxies `/api` requests to this address (configured in `vite.config.ts`).

For production, update the proxy target or set environment variables as needed.

## Project Structure

```
src/
├── api/              # GraphitiService - centralized API client
├── components/       # Reusable UI components
│   ├── ui/          # ShadCN UI component library
│   ├── search/      # Search result components
│   ├── entities/    # Entity browsing components
│   ├── episodes/    # Episode list components
│   └── chat/        # Chat interface components (WebSocket)
├── context/         # GraphitiContext - global state
├── hooks/           # Custom React hooks
├── layout/          # Router, Layout, Container
├── lib/             # Utilities (cn, lazyImportComponent, parseSourceDescription)
├── pages/           # Route pages
└── types/           # TypeScript interfaces
```

## API Integration

All Graphiti API calls go through the `GraphitiService` singleton (`src/api/graphitiService.ts`), which handles:

- Request/response formatting
- Error handling with toast notifications
- TypeScript types for all endpoints
- Automatic retry logic via React Query

## Data Model

- **Episodes** - Raw interaction data (messages, conversations) with source tracking
- **Entities** - Extracted people, organizations, locations, projects, etc.
- **Facts** - Searchable knowledge units connecting entities and episodes
- **Entity Edges** - Relationships between entities with temporal validity
- **Sessions** - Groups of related episodes with metadata

All data is scoped by `group_id` for multi-tenancy.

## More Information

For detailed architecture, development patterns, and API documentation, see [CLAUDE.md](./CLAUDE.md).

## License

MIT
