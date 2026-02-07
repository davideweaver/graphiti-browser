import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { agentTasksService } from "@/api/agentTasksService";
import { Input } from "@/components/ui/input";
import { SecondaryNavItem } from "@/components/navigation/SecondaryNavItem";
import {
  SecondaryNavItemTitle,
  SecondaryNavItemSubtitle,
} from "@/components/navigation/SecondaryNavItemContent";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface AgentTasksSecondaryNavProps {
  selectedTaskId: string | null;
  onNavigate: (path: string) => void;
  onTaskSelect?: (path: string) => void; // Optional: for user clicks that should close sidebar
}

export function AgentTasksSecondaryNav({
  selectedTaskId,
  onNavigate,
  onTaskSelect,
}: AgentTasksSecondaryNavProps) {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  // Fetch all tasks
  const { data, isLoading } = useQuery({
    queryKey: ["agent-tasks-nav", debouncedSearch],
    queryFn: () => agentTasksService.listTasks(),
  });

  const tasks = data?.tasks || [];

  // Filter by search
  const filteredTasks = tasks.filter((task) =>
    task.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  // Auto-select first task if none selected
  useEffect(() => {
    if (!selectedTaskId && filteredTasks.length > 0 && !isLoading) {
      onNavigate(`/agent-tasks/${filteredTasks[0].id}`);
    }
  }, [selectedTaskId, filteredTasks, isLoading, onNavigate]);

  return (
    <nav className="w-full md:w-[380px] bg-card flex flex-col min-w-0">
      {/* Header */}
      <div className="pt-4 md:pt-8 px-6 flex items-center mb-4">
        <h2 className="font-bold" style={{ fontSize: 28 }}>
          Agent Tasks
        </h2>
      </div>

      {/* Search */}
      <div className="px-6 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {/* Task List */}
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
        ) : filteredTasks.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            {searchInput ? "No tasks found" : "No tasks available"}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTasks.map((task) => {
              const isActive = selectedTaskId === task.id;
              return (
                <SecondaryNavItem
                  key={task.id}
                  isActive={isActive}
                  onClick={() => {
                    const path = `/agent-tasks/${task.id}`;
                    // Use onTaskSelect for user clicks (closes sidebar), or onNavigate as fallback
                    if (onTaskSelect) {
                      onTaskSelect(path);
                    } else {
                      onNavigate(path);
                    }
                  }}
                >
                  <div className="flex flex-col items-start w-full gap-1">
                    <div className="flex items-start gap-2 w-full">
                      <SecondaryNavItemTitle className="flex-1">
                        {task.name}
                      </SecondaryNavItemTitle>
                      <Badge
                        variant={task.enabled ? "default" : "secondary"}
                        className="text-xs flex-shrink-0"
                      >
                        {task.enabled ? "On" : "Off"}
                      </Badge>
                    </div>
                    {task.description && (
                      <SecondaryNavItemSubtitle className="break-words line-clamp-2">
                        {task.description}
                      </SecondaryNavItemSubtitle>
                    )}
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
