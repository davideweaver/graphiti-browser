import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGraphiti } from "@/context/GraphitiContext";
import { graphitiService } from "@/api/graphitiService";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Sun, Moon, ChevronUp, Database, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { GraphManagementDialog } from "./GraphManagementDialog";
import { getPinnedGraphs } from "@/lib/graphStorage";

type Props = {
  onAfterClick?: () => void;
  queueSize?: number;
  isConnected?: boolean;
};

export const UserProfileMenu: React.FC<Props> = ({ onAfterClick, queueSize = 0, isConnected = false }) => {
  const { groupId, setGroupId, baseUrl } = useGraphiti();
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  // Fetch available graphs
  const { data: graphsData } = useQuery({
    queryKey: ["graphs"],
    queryFn: () => graphitiService.listGroups(),
  });

  const allGraphs = graphsData?.groups || [];
  const pinnedGraphIds = getPinnedGraphs();

  // Show pinned graphs if any exist, otherwise show all graphs
  const graphs = pinnedGraphIds.length > 0
    ? allGraphs.filter((g) => pinnedGraphIds.includes(g.group_id))
    : allGraphs;

  const currentGraph = allGraphs.find((g) => g.group_id === groupId);

  const handleAfterClick = () => {
    setOpen(false);
    onAfterClick?.();
  };

  const handleToggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    handleAfterClick();
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer pt-2 -ml-2">
            <div className="flex flex-row items-start space-x-3 cursor-pointer w-full">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Database className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute -top-0.5 -left-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1.5 ${
                    isConnected ? "bg-blue-500" : "bg-orange-500"
                  } text-white text-xs font-semibold rounded-full border-2 border-background`}
                  title={isConnected ? `Connected${queueSize > 0 ? ` - ${queueSize} in queue` : ""}` : "Disconnected"}
                >
                  {queueSize > 0 ? queueSize : ""}
                </div>
              </div>
              <div className="flex flex-col text-left flex-grow">
                <span className="text-foreground truncate font-semibold max-w-[200px] text-sm">
                  {currentGraph?.group_id || groupId}
                </span>
                <span className="text-muted-foreground text-xs truncate max-w-[200px]">
                  {baseUrl}
                </span>
              </div>
              <ChevronUp className="h-5 w-5 text-muted-foreground ml-1 mt-1" />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-72 overflow-hidden" align="center" sideOffset={5}>
          <div className="grid gap-4 overflow-hidden">
            <div className="grid gap-1 overflow-hidden">
              {/* Graph selection list */}
              {graphs.length > 0 ? (
                <div className="space-y-0.5">
                  {graphs.map((g) => (
                    <Button
                      key={g.group_id}
                      variant="ghost"
                      size="sm"
                      className={`w-full justify-start font-normal h-auto py-2 overflow-hidden focus-visible:ring-0 focus-visible:ring-offset-0 text-left ${
                        groupId === g.group_id ? "bg-accent" : ""
                      }`}
                      onClick={() => {
                        setGroupId(g.group_id);
                        handleAfterClick();
                      }}
                    >
                      <div className="flex flex-col items-start min-w-0 max-w-full text-left">
                        <span className="text-sm truncate w-full text-left">{g.group_id}</span>
                        <span className="text-xs text-muted-foreground truncate w-full text-left">
                          {g.entity_count} entities, {g.fact_count} facts
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground px-2 py-2">
                  No graphs available. Create one to get started.
                </div>
              )}

              <hr />

              <Button
                variant="ghost"
                size="sm"
                className="justify-start font-normal"
                onClick={(e) => {
                  e.preventDefault();
                  handleAfterClick();
                  setIsManageDialogOpen(true);
                }}
              >
                <Settings className="h-4 w-4 text-muted-foreground mr-2" />
                Manage Graphs
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="justify-start font-normal"
                onClick={handleToggleTheme}
              >
                {theme === "dark" ? (
                  <Moon className="h-4 w-4 text-muted-foreground mr-2" />
                ) : (
                  <Sun className="h-4 w-4 text-muted-foreground mr-2" />
                )}{" "}
                Toggle Dark Mode
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <GraphManagementDialog
        open={isManageDialogOpen}
        onOpenChange={setIsManageDialogOpen}
      />
    </>
  );
};
