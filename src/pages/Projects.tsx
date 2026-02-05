import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "@/context/GraphitiContext";
import Container from "@/layout/Container";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { ContainerTable, type Column } from "@/components/ContainerTable";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDebounce } from "@/hooks/use-debounce";
import type { Project } from "@/types/graphiti";

type SortField = 'name' | 'episode_count' | 'session_count' | 'first_episode_date' | 'last_episode_date';

export default function Projects() {
  const { groupId } = useGraphiti();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read state from URL params with defaults
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);
  const searchTerm = searchParams.get("search") || "";
  const sortBy = (searchParams.get("sortBy") || "last_episode_date") as SortField;
  const sortOrder = (searchParams.get("sortOrder") || "desc") as 'asc' | 'desc';

  // Local state for input (before debounce)
  const [searchInput, setSearchInput] = useState(searchTerm);
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);

  // Helper to update URL params
  const updateParams = useCallback((updates: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "" || (key === "page" && value === 1) || (key === "pageSize" && value === 50) || (key === "sortBy" && value === "last_episode_date") || (key === "sortOrder" && value === "desc")) {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Debounce search input before updating URL
  const debouncedSearchInput = useDebounce(searchInput, 500);

  // Update URL when debounced search changes
  useEffect(() => {
    if (debouncedSearchInput !== searchTerm) {
      updateParams({ search: debouncedSearchInput, page: 1 });
      setCursors([undefined]);
    }
  }, [debouncedSearchInput, searchTerm, updateParams]);

  // Sync input with URL on mount
  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  // Reset cursors when filters or page size change
  useEffect(() => {
    setCursors([undefined]);
  }, [searchTerm, sortBy, sortOrder, pageSize]);

  // Reset everything when graph changes
  useEffect(() => {
    setCursors([undefined]);
    // Reset to page 1 without using updateParams to avoid dependency issues
    if (page !== 1) {
      setSearchParams(new URLSearchParams({ page: "1" }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // Get current cursor for pagination
  const currentCursor = cursors[page - 1];

  // Fetch projects with server-side filtering, sorting, and pagination
  const { data, isLoading } = useQuery({
    queryKey: ["projects-list", groupId, page, pageSize, searchTerm, sortBy, sortOrder],
    queryFn: async () => {
      return await graphitiService.listProjects(
        groupId,
        pageSize,
        currentCursor,
        searchTerm || undefined,
        undefined,
        sortOrder
      );
    },
    select: (data) => ({
      ...data,
      // Filter out '_general' project from list
      projects: data.projects.filter((p) => p.name !== "_general"),
      // Adjust total count if _general was in the results
      total: data.projects.some((p) => p.name === "_general")
        ? data.total - 1
        : data.total,
    }),
  });

  // Store cursor for next page navigation
  useEffect(() => {
    if (data?.cursor && data.has_more) {
      setCursors(prev => {
        const newCursors = [...prev];
        newCursors[page] = data.cursor ?? undefined;
        return newCursors;
      });
    }
  }, [data, page]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same column
      updateParams({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc', page: 1 });
    } else {
      // Set new sort field with default desc order
      updateParams({ sortBy: field, sortOrder: 'desc', page: 1 });
    }
  };

  // Render sortable header with indicator
  const renderSortableHeader = (label: string, field: SortField) => {
    const isSorted = sortBy === field;
    return (
      <div
        className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors select-none"
        onClick={() => handleSort(field)}
      >
        <span>{label}</span>
        {isSorted ? (
          sortOrder === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </div>
    );
  };

  // Table column definitions
  const columns: Column<Project>[] = [
    {
      header: renderSortableHeader("NAME", "name"),
      accessor: "name",
      render: (row) => (
        <div className="max-w-[200px]">
          <div className="font-medium truncate" title={row.name}>
            {row.name}
          </div>
        </div>
      ),
    },
    {
      header: renderSortableHeader("EPISODES", "episode_count"),
      accessor: "episode_count",
      render: (row) => (
        <span className="text-sm">{row.episode_count}</span>
      ),
    },
    {
      header: renderSortableHeader("SESSIONS", "session_count"),
      accessor: "session_count",
      render: (row) => (
        <span className="text-sm">{row.session_count}</span>
      ),
    },
    {
      header: renderSortableHeader("FIRST EPISODE", "first_episode_date"),
      accessor: "first_episode_date",
      render: (row) => (
        <span className="text-sm">{formatDate(row.first_episode_date)}</span>
      ),
    },
    {
      header: renderSortableHeader("LAST EPISODE", "last_episode_date"),
      accessor: "last_episode_date",
      render: (row) => (
        <span className="text-sm">{formatDate(row.last_episode_date)}</span>
      ),
    },
  ];

  // Toolbar with filters
  const tools = (
    <div className="flex gap-2 items-center flex-wrap">
      <div className="relative flex-1 md:min-w-[250px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          className="pl-9"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>
      <Select
        value={String(pageSize)}
        onValueChange={(v) => updateParams({ pageSize: parseInt(v, 10), page: 1 })}
      >
        <SelectTrigger className="w-[80px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="25">25</SelectItem>
          <SelectItem value="50">50</SelectItem>
          <SelectItem value="100">100</SelectItem>
          <SelectItem value="200">200</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Container
      title="Projects"
      tools={tools}
      description="Browse projects and their associated memories"
      content={isMobile ? "full" : "fixed"}
      bodyHorzPadding={isMobile ? 0 : 24}
    >
      <ContainerTable
        data={data?.projects || []}
        columns={columns}
        loading={isLoading}
        totalCount={data?.total || 0}
        page={page}
        setPage={(newPage) => updateParams({ page: newPage })}
        itemsPerPage={pageSize}
        onRowClick={(row) => navigate(`/project/${encodeURIComponent(row.name)}`)}
      />
    </Container>
  );
}
