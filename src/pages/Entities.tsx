import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "@/context/GraphitiContext";
import Container from "@/layout/Container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import type { Entity } from "@/types/graphiti";

export default function Entities() {
  const { groupId } = useGraphiti();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read state from URL params with defaults
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);
  const searchTerm = searchParams.get("search") || "";
  const filterLabel = searchParams.get("label") || "all";
  const sortBy = (searchParams.get("sortBy") || "created_at") as 'name' | 'created_at';
  const sortOrder = (searchParams.get("sortOrder") || "desc") as 'asc' | 'desc';

  // Local state for input (before debounce)
  const [searchInput, setSearchInput] = useState(searchTerm);
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);

  // Debounce search input before updating URL
  const debouncedSearchInput = useDebounce(searchInput, 500);

  // Update URL when debounced search changes
  useEffect(() => {
    if (debouncedSearchInput !== searchTerm) {
      updateParams({ search: debouncedSearchInput, page: 1 });
      setCursors([undefined]);
    }
  }, [debouncedSearchInput]);

  // Sync input with URL on mount
  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  // Helper to update URL params
  const updateParams = (updates: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "" || value === "all" || (key === "page" && value === 1) || (key === "pageSize" && value === 50)) {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });
    setSearchParams(newParams);
  };

  // Reset cursors when filters or page size change
  useEffect(() => {
    setCursors([undefined]);
  }, [searchTerm, filterLabel, sortBy, sortOrder, pageSize]);

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

  // Fetch all entity types (separate query without filters)
  const { data: allTypesData } = useQuery({
    queryKey: ["entities-all-types", groupId],
    queryFn: async () => {
      return await graphitiService.listEntities(
        groupId,
        500, // Fetch a large sample to get all types
        undefined,
        'created_at',
        'desc'
      );
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Extract unique entity types for filter dropdown from all entities
  const entityTypes = useMemo(() => {
    if (!allTypesData?.entities) return [];
    const types = new Set<string>();
    allTypesData.entities.forEach((entity) => {
      entity.labels
        .filter((label) => label !== "Entity")
        .forEach((label) => types.add(label));
    });
    return Array.from(types).sort();
  }, [allTypesData?.entities]);

  // Fetch entities with server-side filtering, sorting, and pagination
  const { data, isLoading } = useQuery({
    queryKey: ["entities-list", groupId, page, pageSize, searchTerm, filterLabel, sortBy, sortOrder],
    queryFn: async () => {
      return await graphitiService.listEntities(
        groupId,
        pageSize,
        currentCursor,
        sortBy,
        sortOrder,
        searchTerm || undefined,
        filterLabel !== 'all' ? filterLabel : undefined
      );
    },
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
  const handleSort = (field: 'name' | 'created_at') => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same column
      updateParams({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc', page: 1 });
    } else {
      // Set new sort field with default desc order
      updateParams({ sortBy: field, sortOrder: 'desc', page: 1 });
    }
  };

  // Render sortable header with indicator
  const renderSortableHeader = (label: string, field: 'name' | 'created_at') => {
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
  const columns: Column<Entity>[] = [
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
      header: "TYPE",
      accessor: "labels",
      render: (row) => {
        const displayLabels = row.labels.filter(l => l !== "Entity");
        return (
          <span className="text-sm">
            {displayLabels.length > 0 ? displayLabels.join(", ") : "Entity"}
          </span>
        );
      },
    },
    {
      header: "SUMMARY",
      accessor: "summary",
      render: (row) => (
        <div className="max-w-md truncate text-sm">{row.summary}</div>
      ),
    },
    {
      header: renderSortableHeader("CREATED", "created_at"),
      accessor: "created_at",
      render: (row) => (
        <span className="text-sm">{formatDate(row.created_at)}</span>
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
        value={filterLabel}
        onValueChange={(v) => updateParams({ label: v, page: 1 })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {entityTypes.map((type) => (
            <SelectItem key={type} value={type}>{type}</SelectItem>
          ))}
        </SelectContent>
      </Select>
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
      title="Entities"
      tools={tools}
      description="Browse entities extracted from your memories"
      content={isMobile ? "full" : "fixed"}
      bodyHorzPadding={isMobile ? 0 : 24}
    >
      <ContainerTable
        data={data?.entities || []}
        columns={columns}
        loading={isLoading}
        totalCount={data?.total || 0}
        page={page}
        setPage={(newPage) => updateParams({ page: newPage })}
        itemsPerPage={pageSize}
        onRowClick={(row) => navigate(`/entity/${row.uuid}`)}
      />
    </Container>
  );
}
