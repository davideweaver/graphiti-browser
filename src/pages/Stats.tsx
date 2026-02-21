import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "@/context/GraphitiContext";
import Container from "@/components/container/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search as SearchIcon,
  Users,
  Clock,
  Database,
  MessageSquare,
  FolderKanban,
} from "lucide-react";
import { format } from "date-fns";
import type { Episode } from "@/types/graphiti";
import PeriodSelector from "@/components/dashboard/PeriodSelector";
import SessionActivityChart from "@/components/dashboard/SessionActivityChart";

export default function Stats() {
  const { groupId } = useGraphiti();
  const navigate = useNavigate();
  const [quickSearch, setQuickSearch] = useState("");

  // Fetch recent episodes
  const { data: episodes, isLoading: isLoadingEpisodes } = useQuery({
    queryKey: ["episodes", groupId, 10],
    queryFn: () => graphitiService.getEpisodes(groupId, 10),
  });

  // TODO: Entity discovery - API doesn't currently return entities in search results
  // Keeping this commented out until the Graphiti API supports entity listing
  // const { data: entities, isLoading: isLoadingEntities } = useQuery({
  //   queryKey: ["entities-discovery", groupId],
  //   queryFn: async () => {
  //     // Would need a dedicated /entities endpoint
  //     return [];
  //   },
  // });

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/memory/search?q=${encodeURIComponent(quickSearch)}`);
    }
  };

  return (
    <Container
      title="Stats"
      description="Overview of your Graphiti memories"
      tools={<PeriodSelector />}
    >
      <div className="space-y-8">
        {/* Quick Search */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleQuickSearch}>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="quick-search"
                    name="quick-search"
                    type="text"
                    placeholder="Quick search your memories..."
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit">Search</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Activity
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingEpisodes ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {episodes?.length || 0}+
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Last 10 messages
              </p>
            </CardContent>
          </Card>

          {/* TODO: Entities card - disabled until API supports entity listing */}
          {/* <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Entities
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Coming soon
              </p>
            </CardContent>
          </Card> */}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Memory Graph
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Active</div>
              <p className="text-xs text-muted-foreground">
                Group: {groupId}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <SessionActivityChart />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate("/memory/add")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Memory
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate("/memory/search")}
              >
                <SearchIcon className="h-4 w-4 mr-2" />
                Search Memories
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate("/projects")}
              >
                <FolderKanban className="h-4 w-4 mr-2" />
                Browse Projects
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate("/memory/entities")}
              >
                <Users className="h-4 w-4 mr-2" />
                Browse Entities
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate("/memory/sessions")}
              >
                <Clock className="h-4 w-4 mr-2" />
                View Sessions
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate("/memory/chat")}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat with AI
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/memory/sessions")}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingEpisodes && (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {!isLoadingEpisodes && episodes && episodes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No activity yet. Add your first memory to get started!</p>
                <Button
                  className="mt-4"
                  onClick={() => navigate("/memory/add")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Memory
                </Button>
              </div>
            )}

            {!isLoadingEpisodes && episodes && episodes.length > 0 && (
              <div className="space-y-3">
                {episodes.slice(0, 5).map((episode) => (
                  <div
                    key={episode.uuid}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate("/episodes")}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {episode.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(
                            new Date(episode.created_at),
                            "MMM d, yyyy 'at' h:mm a"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
