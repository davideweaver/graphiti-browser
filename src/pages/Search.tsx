import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "@/context/GraphitiContext";
import Container from "@/layout/Container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { FactCard } from "@/components/search/FactCard";

export default function Search() {
  const { groupId } = useGraphiti();
  const [searchQuery, setSearchQuery] = useState("");
  const [maxFacts, setMaxFacts] = useState(10);
  const debouncedQuery = useDebounce(searchQuery, 500);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["search", debouncedQuery, maxFacts, groupId],
    queryFn: () =>
      graphitiService.search(debouncedQuery, groupId, maxFacts),
    enabled: debouncedQuery.length > 0,
  });

  const showLoading = (isLoading || isFetching) && debouncedQuery.length > 0;
  const showEmpty =
    !isLoading &&
    !isFetching &&
    debouncedQuery.length > 0 &&
    (!data?.facts || data.facts.length === 0);
  const showResults =
    !isLoading && !isFetching && data?.facts && data.facts.length > 0;

  return (
    <Container
      title="Search Memories"
      description="Search your Graphiti memories using semantic search"
      loading={showLoading}
    >
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Search Input */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Query</Label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="search"
              type="text"
              placeholder="Search for memories, facts, or entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Max Facts Slider */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="maxFacts">Maximum Results</Label>
            <span className="text-sm text-muted-foreground">{maxFacts}</span>
          </div>
          <Slider
            id="maxFacts"
            min={1}
            max={50}
            step={1}
            value={[maxFacts]}
            onValueChange={(value) => setMaxFacts(value[0])}
          />
        </div>

        {/* Results Area */}
        <div className="mt-8">
          {/* Loading State */}
          {showLoading && (
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
          {showEmpty && (
            <Card>
              <CardContent className="p-12 text-center">
                <SearchIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search query or increasing the maximum
                  results.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {showResults && (
            <div>
              <div className="mb-4 text-sm text-muted-foreground">
                Found {data.facts.length} result{data.facts.length !== 1 ? "s" : ""}
              </div>
              <div className="space-y-4">
                {data.facts.map((fact) => (
                  <FactCard key={fact.uuid} fact={fact} />
                ))}
              </div>
            </div>
          )}

          {/* Initial State */}
          {!debouncedQuery && (
            <Card>
              <CardContent className="p-12 text-center">
                <SearchIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  Start searching your memories
                </h3>
                <p className="text-muted-foreground">
                  Enter a search query above to find facts, entities, and
                  episodes.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Container>
  );
}
