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
import { Sun, Moon, Database, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { getPinnedGraphs } from "@/lib/graphStorage";

type Props = {
  onAfterClick?: () => void;
  onOpenManageDialog?: () => void;
  queueSize?: number;
  isConnected?: boolean;
};

export const PrimaryNavFooter: React.FC<Props> = ({
  onAfterClick,
  onOpenManageDialog,
  queueSize = 0,
  isConnected = false
}) => {
  const { groupId, setGroupId, baseUrl } = useGraphiti();
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
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-lg relative"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <Database className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div
              className={`absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1.5 ${
                isConnected ? "bg-green-500" : "bg-orange-500"
              } text-white text-xs font-semibold rounded-full border-2 border-background`}
              title={isConnected ? `Connected${queueSize > 0 ? ` - ${queueSize} in queue` : ""}` : "Disconnected"}
            >
              {queueSize > 0 ? queueSize : ""}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 overflow-hidden" align="end" side="right" sideOffset={10}>
          <div className="grid gap-4 overflow-hidden">
            <div className="space-y-1">
              <div className="text-sm font-medium">Current Graph</div>
              <div className="text-xs text-muted-foreground truncate">
                {currentGraph?.group_id || groupId}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {baseUrl}
              </div>
            </div>

            <hr />

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
                  setOpen(false); // Close popover
                  onOpenManageDialog?.();
                  // Don't call handleAfterClick() to keep sidebar open on mobile
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
    </>
  );
};
