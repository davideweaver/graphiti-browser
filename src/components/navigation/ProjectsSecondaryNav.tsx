import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "@/context/GraphitiContext";
import { Input } from "@/components/ui/input";
import { SecondaryNavItem } from "@/components/navigation/SecondaryNavItem";
import { SecondaryNavItemTitle, SecondaryNavItemSubtitle } from "@/components/navigation/SecondaryNavItemContent";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface ProjectsSecondaryNavProps {
  selectedProject: string | null;
  onNavigate: (path: string) => void;
  onProjectSelect?: (path: string) => void; // Optional: for user clicks that should close sidebar
}

export function ProjectsSecondaryNav({
  selectedProject,
  onNavigate,
  onProjectSelect,
}: ProjectsSecondaryNavProps) {
  const { groupId } = useGraphiti();
  const [searchInput, setSearchInput] = useState("");
  const [viewMode, setViewMode] = useState<"recent" | "all">("recent");
  const debouncedSearch = useDebounce(searchInput, 300);

  // Note: WebSocket is managed globally in Layout.tsx

  // Fetch projects with search filter
  const { data, isLoading } = useQuery({
    queryKey: ["projects-nav-list", groupId, debouncedSearch],
    queryFn: () =>
      graphitiService.listProjects(
        groupId,
        100,
        undefined,
        debouncedSearch || undefined,
        undefined,
        "desc",
      ),
    select: (data) => ({
      ...data,
      // Filter out '_general' project from list
      projects: data.projects.filter((p) => p.name !== "_general"),
    }),
  });

  // Filter projects based on view mode
  const projects = useMemo(() => {
    const allProjects = data?.projects || [];

    if (viewMode === "all") {
      return allProjects;
    }

    // Filter to show only recent projects (last 5 days)
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    return allProjects.filter((project) => {
      const lastEpisodeDate = new Date(project.last_episode_date);
      return lastEpisodeDate >= fiveDaysAgo;
    });
  }, [data?.projects, viewMode]);

  // Auto-select first project if none selected
  useEffect(() => {
    if (!selectedProject && projects.length > 0 && !isLoading) {
      onNavigate(`/project/${encodeURIComponent(projects[0].name)}`);
    }
  }, [selectedProject, projects, isLoading, onNavigate]);

  return (
    <nav className="w-full md:w-[380px] bg-card flex flex-col min-w-0">
      {/* Header */}
      <div className="pt-4 md:pt-8 px-6 flex items-center justify-between mb-4">
        <h2 className="font-bold" style={{ fontSize: 28 }}>
          Projects
        </h2>
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => {
            if (value) setViewMode(value as "recent" | "all");
          }}
          size="sm"
        >
          <ToggleGroupItem value="recent" aria-label="Show recent projects">
            Recent
          </ToggleGroupItem>
          <ToggleGroupItem value="all" aria-label="Show all projects">
            All
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Search */}
      <div className="px-6 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        {isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 bg-accent/50 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            {searchInput
              ? "No projects found"
              : viewMode === "recent"
                ? "No recent projects (last 5 days)"
                : "No projects available"}
          </div>
        ) : (
          <div className="space-y-1">
            {projects.map((project) => {
              const isActive = selectedProject === project.name;
              return (
                <SecondaryNavItem
                  key={project.name}
                  isActive={isActive}
                  onClick={() => {
                    const path = `/project/${encodeURIComponent(project.name)}`;
                    // Use onProjectSelect for user clicks (closes sidebar), or onNavigate as fallback
                    if (onProjectSelect) {
                      onProjectSelect(path);
                    } else {
                      onNavigate(path);
                    }
                  }}
                >
                  <div className="flex flex-col items-start w-full">
                    <SecondaryNavItemTitle>{project.name}</SecondaryNavItemTitle>
                    <SecondaryNavItemSubtitle>
                      {project.session_count} sessions • {project.episode_count}{" "}
                      episodes
                    </SecondaryNavItemSubtitle>
                  </div>
                </SecondaryNavItem>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
