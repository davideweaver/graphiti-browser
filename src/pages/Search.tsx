import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "@/context/GraphitiContext";
import Container from "@/layout/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Segments, SegmentsList, SegmentsTrigger } from "@/components/ui/segments";
import { Search as SearchIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { FactCard } from "@/components/search/FactCard";
import { SessionCard } from "@/components/sessions/SessionCard";
import { NodeDetailSheet } from "@/components/shared/NodeDetailSheet";
import type { Fact } from "@/types/graphiti";

type SearchMode = "facts" | "sessions";
type NodeType = "fact" | "session" | "entity";

export default function Search() {
  const { groupId } = useGraphiti();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get mode from URL or default to "facts"
  const urlMode = (searchParams.get("mode") || "facts") as SearchMode;
  const [mode, setMode] = useState<SearchMode>(urlMode);

  // Facts mode state
  const urlQuery = searchParams.get("q") || "";
  const urlLimit = parseInt(searchParams.get("limit") || "10", 10);
  const [searchInput, setSearchInput] = useState(urlQuery);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [limit, setLimit] = useState(urlLimit);

  // Node detail sheet state (shared across all modes)
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeDetailOpen, setNodeDetailOpen] = useState(false);

  // Sessions mode state
  const urlPage = parseInt(searchParams.get("page") || "1", 10);
  const urlSessionSearch = searchParams.get("search") || "";
  const urlSortOrder = (searchParams.get("sort") || "desc") as 'asc' | 'desc';
  const [sessionSearchInput, setSessionSearchInput] = useState(urlSessionSearch);
  const [sessionSearchQuery, setSessionSearchQuery] = useState(urlSessionSearch);
  const [sessionSearchPerformed, setSessionSearchPerformed] = useState(urlSessionSearch !== "" || urlPage > 1);
  const [page, setPage] = useState(urlPage);
  const [sessionLimit, setSessionLimit] = useState(urlLimit);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(urlSortOrder);
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);

  // Update URL params helper
  const updateParams = useCallback((updates: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      // Remove default values to keep URL clean
      if ((key === "mode" && value === "facts") ||
          (key === "page" && value === 1) ||
          (key === "sort" && value === "desc") ||
          (key === "limit" && value === 10) ||
          value === "") {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Sync state with URL params
  useEffect(() => {
    const urlMode = (searchParams.get("mode") || "facts") as SearchMode;
    const urlQuery = searchParams.get("q") || "";
    const urlLimit = parseInt(searchParams.get("limit") || "10", 10);
    const urlPage = parseInt(searchParams.get("page") || "1", 10);
    const urlSortOrder = (searchParams.get("sort") || "desc") as 'asc' | 'desc';
    const urlSessionSearch = searchParams.get("search") || "";
    const hasSessionParams = searchParams.has("search") || urlPage > 1;

    setMode(urlMode);
    setSearchInput(urlQuery);
    setSearchQuery(urlQuery);
    setLimit(urlLimit);
    setSessionLimit(urlLimit);
    setPage(urlPage);
    setSortOrder(urlSortOrder);
    setSessionSearchInput(urlSessionSearch);
    setSessionSearchQuery(urlSessionSearch);
    setSessionSearchPerformed(hasSessionParams);
  }, [searchParams]);

  // Reset cursors when sort or limit changes
  useEffect(() => {
    setCursors([undefined]);
  }, [sortOrder, sessionLimit]);

  // Reset everything when graph changes
  useEffect(() => {
    setCursors([undefined]);
    setPage(1);
    setSearchQuery("");
    setSearchInput("");
    setSessionSearchQuery("");
    setSessionSearchInput("");
    setSessionSearchPerformed(false);
    // Clear URL params when switching graphs
    setSearchParams(new URLSearchParams());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // Handle mode change
  const handleModeChange = (newMode: string) => {
    setMode(newMode as SearchMode);
    updateParams({ mode: newMode, page: 1 });
    setCursors([undefined]);
  };

  // Facts mode: Search handler
  const handleFactsSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const query = searchInput.trim();
      setSearchQuery(query);
      updateParams({ q: query, limit });
    }
  };

  // Facts mode: Limit change
  const handleFactsLimitChange = (value: string) => {
    const newLimit = parseInt(value, 10);
    setLimit(newLimit);
    if (searchQuery) {
      updateParams({ q: searchQuery, limit: newLimit });
    }
  };

  // Sessions mode: Search handler
  const handleSessionsSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSessionSearchQuery(sessionSearchInput.trim());
    setSessionSearchPerformed(true);
    setPage(1);
    setCursors([undefined]);
    updateParams({ search: sessionSearchInput.trim(), page: 1, limit: sessionLimit });
  };

  // Sessions mode: Limit change
  const handleSessionsLimitChange = (value: string) => {
    const newLimit = parseInt(value, 10);
    setSessionLimit(newLimit);
    setPage(1);
    setCursors([undefined]);
    updateParams({ limit: newLimit, page: 1 });
  };

  // Open node detail sheet (works for facts, sessions, entities)
  const handleOpenNodeDetail = (nodeType: NodeType, nodeId: string) => {
    setSelectedNodeType(nodeType);
    setSelectedNodeId(nodeId);
    setNodeDetailOpen(true);
  };

  // Facts mode: Query
  const factsQuery = useQuery({
    queryKey: ["search", searchQuery, limit, groupId],
    queryFn: () => graphitiService.search(searchQuery, groupId, limit),
    enabled: mode === "facts" && searchQuery.length > 0,
  });

  // Sessions mode: Query
  const currentCursor = cursors[page - 1];
  const sessionsQuery = useQuery({
    queryKey: ["sessions-search", groupId, page, sessionLimit, sessionSearchQuery, sortOrder],
    queryFn: async () => {
      return await graphitiService.listSessions(
        groupId,
        sessionLimit,
        currentCursor,
        sessionSearchQuery || undefined,
        undefined, // projectName - can add later
        undefined, // createdAfter
        undefined, // createdBefore
        undefined, // validAfter
        undefined, // validBefore
        sortOrder
      );
    },
    enabled: mode === "sessions" && sessionSearchPerformed,
  });

  // Store cursor for next page
  useEffect(() => {
    if (sessionsQuery.data?.cursor && sessionsQuery.data.has_more) {
      setCursors(prev => {
        const newCursors = [...prev];
        newCursors[page] = sessionsQuery.data.cursor ?? undefined;
        return newCursors;
      });
    }
  }, [sessionsQuery.data, page]);

  // Sessions mode: Pagination handlers
  const handlePreviousPage = () => {
    if (page > 1) {
      const newPage = page - 1;
      setPage(newPage);
      updateParams({ page: newPage });
    }
  };

  const handleNextPage = () => {
    if (sessionsQuery.data?.has_more) {
      const newPage = page + 1;
      setPage(newPage);
      updateParams({ page: newPage });
    }
  };

  // Sessions mode: Sort change
  const handleSortChange = (value: string) => {
    setSortOrder(value as 'asc' | 'desc');
    setPage(1);
    setCursors([undefined]);
    updateParams({ sort: value, page: 1 });
  };

  // Determine loading and content states
  const factsLoading = (factsQuery.isLoading || factsQuery.isFetching) && searchQuery.length > 0;
  const factsEmpty = !factsQuery.isLoading && !factsQuery.isFetching && searchQuery.length > 0 &&
    (!factsQuery.data?.facts || factsQuery.data.facts.length === 0);
  const factsResults = !factsQuery.isLoading && !factsQuery.isFetching && factsQuery.data?.facts && factsQuery.data.facts.length > 0;

  const sessionsLoading = (sessionsQuery.isLoading || sessionsQuery.isFetching) && sessionSearchPerformed;
  const sessionsEmpty = !sessionsQuery.isLoading && !sessionsQuery.isFetching && sessionSearchPerformed &&
    (!sessionsQuery.data?.sessions || sessionsQuery.data.sessions.length === 0);
  const sessionsResults = !sessionsQuery.isLoading && !sessionsQuery.isFetching && sessionSearchPerformed &&
    sessionsQuery.data?.sessions && sessionsQuery.data.sessions.length > 0;

  return (
    <Container
      title="Search"
      description={mode === "facts" ? "Search your Graphiti memories using semantic search" : "Browse conversation sessions"}
      loading={mode === "facts" ? factsLoading : sessionsLoading}
    >
      <div className="space-y-6">
        {/* Mode Selector and Controls */}
        <div className="flex items-center justify-between gap-4">
          <Segments value={mode} onValueChange={handleModeChange}>
            <SegmentsList>
              <SegmentsTrigger value="facts">Facts</SegmentsTrigger>
              <SegmentsTrigger value="sessions">Sessions</SegmentsTrigger>
            </SegmentsList>
          </Segments>

          {/* Facts Controls */}
          {mode === "facts" && (
            <div className="flex items-center gap-2">
              <Label htmlFor="factsLimit" className="text-sm">Limit:</Label>
              <Select value={limit.toString()} onValueChange={handleFactsLimitChange}>
                <SelectTrigger id="factsLimit" className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Sessions Controls */}
          {mode === "sessions" && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="sessionsLimit" className="text-sm">Limit:</Label>
                <Select value={sessionLimit.toString()} onValueChange={handleSessionsLimitChange}>
                  <SelectTrigger id="sessionsLimit" className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="sort" className="text-sm">Sort:</Label>
                <Select value={sortOrder} onValueChange={handleSortChange}>
                  <SelectTrigger id="sort" className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Facts Mode */}
        {mode === "facts" && (
          <>
            {/* Search Input */}
            <form onSubmit={handleFactsSearch}>
              <div className="space-y-2">
                <Label htmlFor="search">Search Query</Label>
                <div className="flex gap-2">
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search for memories, facts, or entities..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <Button type="submit" size="icon" disabled={!searchInput.trim()}>
                    <SearchIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>

            {/* Facts Results Area */}
            <div className="mt-8">
              {/* Loading State */}
              {factsLoading && (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/4 mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {factsEmpty && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <SearchIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No results found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search query or increasing the maximum results.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Results */}
              {factsResults && factsQuery.data && (
                <div>
                  <div className="mb-4 text-sm text-muted-foreground">
                    Found {factsQuery.data.facts.length} result{factsQuery.data.facts.length !== 1 ? "s" : ""}
                  </div>
                  <div className="space-y-2">
                    {factsQuery.data.facts.map((fact) => (
                      <FactCard
                        key={fact.uuid}
                        fact={fact}
                        onOpenDetails={() => handleOpenNodeDetail("fact", fact.uuid)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Initial State */}
              {!searchQuery && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <SearchIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      Start searching your memories
                    </h3>
                    <p className="text-muted-foreground">
                      Enter a search query and click the search button to find facts.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Sessions Mode */}
        {mode === "sessions" && (
          <>
            {/* Search Input */}
            <form onSubmit={handleSessionsSearch}>
              <div className="space-y-2">
                <Label htmlFor="sessionSearch">Search Sessions</Label>
                <div className="flex gap-2">
                  <Input
                    id="sessionSearch"
                    type="text"
                    placeholder="Search by session ID, summary, or content..."
                    value={sessionSearchInput}
                    onChange={(e) => setSessionSearchInput(e.target.value)}
                  />
                  <Button type="submit" size="icon">
                    <SearchIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>

            {/* Sessions Results Area */}
            <div className="mt-4">
              {/* Loading State */}
              {sessionsLoading && (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/4 mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {sessionsEmpty && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <SearchIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search query or browse all sessions with an empty search.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Results */}
              {sessionsResults && sessionsQuery.data && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {sessionsQuery.data.sessions.length} session{sessionsQuery.data.sessions.length !== 1 ? "s" : ""}
                      {sessionsQuery.data.total && ` of ${sessionsQuery.data.total} total`}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {sessionsQuery.data.sessions.map((session) => (
                      <SessionCard
                        key={session.session_id}
                        session={session}
                        onSessionClick={(sessionId) => handleOpenNodeDetail("session", sessionId)}
                      />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {(page > 1 || sessionsQuery.data.has_more) && (
                    <div className="flex items-center justify-between mt-6">
                      <Button
                        variant="outline"
                        onClick={handlePreviousPage}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {page}
                      </span>
                      <Button
                        variant="outline"
                        onClick={handleNextPage}
                        disabled={!sessionsQuery.data.has_more}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Initial State */}
              {!sessionSearchPerformed && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <SearchIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      Browse conversation sessions
                    </h3>
                    <p className="text-muted-foreground">
                      Enter a search query or click search with an empty field to browse all sessions.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Node Detail Sheet (shared across all modes) */}
        {selectedNodeType && selectedNodeId && (
          <NodeDetailSheet
            nodeType={selectedNodeType}
            nodeId={selectedNodeId}
            open={nodeDetailOpen}
            onOpenChange={setNodeDetailOpen}
          />
        )}
      </div>
    </Container>
  );
}
