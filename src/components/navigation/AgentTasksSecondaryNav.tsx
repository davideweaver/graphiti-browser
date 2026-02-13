import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { agentTasksService } from "@/api/agentTasksService";
import { Input } from "@/components/ui/input";
import { SecondaryNavItem } from "@/components/navigation/SecondaryNavItem";
import {
  SecondaryNavItemTitle,
  SecondaryNavItemSubtitle,
} from "@/components/navigation/SecondaryNavItemContent";
import { SecondaryNavContainer } from "@/components/navigation/SecondaryNavContainer";
import { SecondaryNavToolButton } from "@/components/navigation/SecondaryNavToolButton";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, RefreshCw, Activity } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useTaskConfigUpdates } from "@/hooks/use-task-config-updates";
import { toast } from "sonner";

interface AgentTasksSecondaryNavProps {
  selectedTaskId: string | null;
  currentView: "history" | "task" | "activity";
  onNavigate: (path: string) => void;
  onTaskSelect?: (path: string) => void; // Optional: for user clicks that should close sidebar
}

export function AgentTasksSecondaryNav({
  selectedTaskId,
  currentView,
  onNavigate,
  onTaskSelect,
}: AgentTasksSecondaryNavProps) {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  // Listen for real-time task configuration updates
  useTaskConfigUpdates();

  // Fetch all tasks
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["agent-tasks-nav", debouncedSearch],
    queryFn: () => agentTasksService.listTasks(),
  });

  const tasks = data?.tasks || [];

  // Filter by search
  const filteredTasks = tasks.filter((task) =>
    task.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  const handleNavigation = (path: string) => {
    if (onTaskSelect) {
      onTaskSelect(path);
    } else {
      onNavigate(path);
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Task list refreshed");
  };

  return (
    <SecondaryNavContainer
      title="Agent Tasks"
      tools={
        <SecondaryNavToolButton onClick={handleRefresh}>
          <RefreshCw size={20} />
        </SecondaryNavToolButton>
      }
    >
      {/* Primary Menu Items */}
      <div className="px-4 pb-4 space-y-1">
        <SecondaryNavItem
          isActive={currentView === "activity"}
          onClick={() => handleNavigation("/agent-tasks/activity")}
        >
          <div className="flex items-center gap-2 w-full">
            <Activity className="h-4 w-4" />
            <SecondaryNavItemTitle>Task Activity</SecondaryNavItemTitle>
          </div>
        </SecondaryNavItem>
        <SecondaryNavItem
          isActive={currentView === "history"}
          onClick={() => handleNavigation("/agent-tasks/history")}
        >
          <div className="flex items-center gap-2 w-full">
            <Clock className="h-4 w-4" />
            <SecondaryNavItemTitle>Task History</SecondaryNavItemTitle>
          </div>
        </SecondaryNavItem>
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
                  onClick={() => handleNavigation(`/agent-tasks/${task.id}`)}
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
    </SecondaryNavContainer>
  );
}
