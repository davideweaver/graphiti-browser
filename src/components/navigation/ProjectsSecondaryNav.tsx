import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "@/context/GraphitiContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface ProjectsSecondaryNavProps {
  selectedProject: string | null;
  onNavigate: (path: string) => void;
  onProjectSelect?: (path: string) => void; // Optional: for user clicks that should close sidebar
}

export function ProjectsSecondaryNav({ selectedProject, onNavigate, onProjectSelect }: ProjectsSecondaryNavProps) {
  const { groupId } = useGraphiti();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  // Fetch projects with search filter
  const { data, isLoading } = useQuery({
    queryKey: ["projects-nav-list", groupId, debouncedSearch],
    queryFn: async () => {
      return await graphitiService.listProjects(
        groupId,
        100, // Get more projects for the nav
        undefined,
        debouncedSearch || undefined,
        undefined,
        "desc" // Sort by last episode date
      );
    },
    select: (data) => ({
      ...data,
      // Filter out '_general' project from list
      projects: data.projects.filter((p) => p.name !== "_general"),
    }),
  });

  const projects = data?.projects || [];

  // Auto-select first project if none selected
  useEffect(() => {
    if (!selectedProject && projects.length > 0 && !isLoading) {
      onNavigate(`/project/${encodeURIComponent(projects[0].name)}`);
    }
  }, [selectedProject, projects, isLoading, onNavigate]);

  return (
    <nav className="w-[380px] border-r border-border bg-background flex flex-col">
      {/* Header */}
      <div className="pt-4 md:pt-8 px-6 flex items-center mb-4">
        <h2 className="font-bold" style={{ fontSize: 28 }}>Projects</h2>
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
      <div className="flex-1 overflow-auto px-6 pb-4">
        {isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-accent/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            {searchInput ? "No projects found" : "No projects available"}
          </div>
        ) : (
          <div className="space-y-1">
            {projects.map((project) => {
              const isActive = selectedProject === project.name;
              return (
                <Button
                  key={project.name}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-auto py-3 px-4 rounded-lg",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  )}
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
                    <span className="font-medium truncate w-full text-left">
                      {project.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate w-full text-left">
                      {project.episode_count} episodes • {project.session_count} sessions
                    </span>
                  </div>
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
