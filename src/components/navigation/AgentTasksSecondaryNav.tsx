import { useState, useEffect } from "react";
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
import { SecondaryNavToolToggle } from "@/components/navigation/SecondaryNavToolToggle";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, RefreshCw, Activity, Bot, BotOff } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useTaskConfigUpdates } from "@/hooks/use-task-config-updates";
import { useTasksRunning } from "@/hooks/use-tasks-running";
import { toast } from "sonner";

interface AgentTasksSecondaryNavProps {
  selectedTaskId: string | null;
  currentView: "history" | "task" | "activity";
  onNavigate: (path: string) => void;
  onTaskSelect?: (path: string) => void; // Optional: for user clicks that should close sidebar
}

const STORAGE_KEY = "agent-tasks-show-disabled";

export function AgentTasksSecondaryNav({
  selectedTaskId,
  currentView,
  onNavigate,
  onTaskSelect,
}: AgentTasksSecondaryNavProps) {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const isTasksRunning = useTasksRunning();

  // Initialize showDisabled from localStorage
  const [showDisabled, setShowDisabled] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : false;
  });

  // Persist showDisabled to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(showDisabled));
  }, [showDisabled]);

  // Listen for real-time task configuration updates
  useTaskConfigUpdates();

  // Fetch all tasks
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["agent-tasks-nav", debouncedSearch],
    queryFn: () => agentTasksService.listTasks(),
  });

  const tasks = data?.tasks || [];

  // Filter by search and enabled status
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.name
      .toLowerCase()
      .includes(debouncedSearch.toLowerCase());
    const matchesEnabled = showDisabled || task.enabled;
    return matchesSearch && matchesEnabled;
  });

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
        <>
          <SecondaryNavToolToggle
            pressed={showDisabled}
            onPressedChange={setShowDisabled}
            title={showDisabled ? "Hide disabled tasks" : "Show disabled tasks"}
          >
            {showDisabled ? <BotOff size={22} /> : <Bot size={22} />}
          </SecondaryNavToolToggle>
          <SecondaryNavToolButton onClick={handleRefresh}>
            <RefreshCw size={20} />
          </SecondaryNavToolButton>
        </>
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
            {isTasksRunning && (
              <div className="relative flex-shrink-0 ml-auto">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75" />
              </div>
            )}
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
                  className={!task.enabled ? "opacity-50" : ""}
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
