import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { agentTasksService } from "@/api/agentTasksService";
import type { ToolInfo } from "@/types/agentTasks";

interface ToolsMultiSelectProps {
  selectedTools: string[];
  onChange: (tools: string[]) => void;
  disabled?: boolean;
}

export function ToolsMultiSelect({
  selectedTools,
  onChange,
  disabled = false,
}: ToolsMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const { data: toolsData, isLoading } = useQuery({
    queryKey: ["tools"],
    queryFn: () => agentTasksService.getTools(),
  });

  const tools = toolsData?.tools || [];
  const categories = toolsData?.categories || {};

  const handleToggleTool = (toolName: string) => {
    const newSelected = selectedTools.includes(toolName)
      ? selectedTools.filter((t) => t !== toolName)
      : [...selectedTools, toolName];
    onChange(newSelected);
  };

  const handleRemoveTool = (toolName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedTools.filter((t) => t !== toolName));
  };

  // Group tools by category
  const toolsByCategory = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, ToolInfo[]>);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between min-h-[2.5rem] h-auto"
          disabled={disabled || isLoading}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedTools.length === 0 ? (
              <span className="text-muted-foreground">Select tools...</span>
            ) : (
              selectedTools.map((toolName) => (
                <Badge
                  key={toolName}
                  variant="secondary"
                  className="gap-1"
                >
                  {toolName}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-foreground"
                    onClick={(e) => handleRemoveTool(toolName, e)}
                  />
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search tools..." />
          <CommandList>
            <CommandEmpty>No tools found.</CommandEmpty>
            {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
              <CommandGroup
                key={category}
                heading={categories[category]?.label || category}
              >
                {categoryTools.map((tool) => (
                  <CommandItem
                    key={tool.name}
                    value={tool.name}
                    onSelect={() => handleToggleTool(tool.name)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedTools.includes(tool.name)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {tool.description}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
