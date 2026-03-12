import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen } from "lucide-react";
import { xerroProjectsService } from "@/api/xerroProjectsService";
import type { XerroProject } from "@/types/xerroProjects";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  value: string;
  onChange: (path: string) => void;
  disabled?: boolean;
}

const CUSTOM_PATH_VALUE = "__CUSTOM__";
const XERRO_AGENT_PATH = "/Users/dweaver/Projects/ai/xerro-agent";
const CLAUDE_ASSIST_PATH = "/Users/dweaver/Projects/ai/claude-assist";

export function WorkingDirectoryCombobox({ value, onChange, disabled }: Props) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customPath, setCustomPath] = useState("");

  // Calculate "last 10 days" timestamp for recent projects filter
  const getLast10DaysISO = () => {
    const date = new Date();
    date.setDate(date.getDate() - 10);
    return date.toISOString();
  };

  // Fetch recent projects from the last 10 days, excluding preset directories
  const { data, isLoading } = useQuery({
    queryKey: ["working-directory-projects"],
    queryFn: async () => {
      const result = await xerroProjectsService.listProjects({ after: getLast10DaysISO(), limit: 50 });
      // Filter out exact matches for preset paths AND preset names
      return {
        ...result,
        items: result.items.filter(
          (p: XerroProject) =>
            p.folder !== XERRO_AGENT_PATH &&
            p.folder !== CLAUDE_ASSIST_PATH &&
            p.name !== "xerro-agent" &&
            p.name !== "claude-assist"
        ),
      };
    },
  });

  const recentProjects = data?.items || [];

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === CUSTOM_PATH_VALUE) {
      setShowCustomInput(true);
      setCustomPath("");
    } else {
      onChange(selectedValue);
    }
  };

  const handleCustomPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const path = e.target.value;
    setCustomPath(path);
    onChange(path);
  };

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  // If showing custom input, display input field
  if (showCustomInput) {
    return (
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="/path/to/directory"
          value={customPath}
          onChange={handleCustomPathChange}
          disabled={disabled}
          className="w-full"
        />
        <button
          type="button"
          onClick={() => {
            setShowCustomInput(false);
            setCustomPath("");
            onChange(XERRO_AGENT_PATH);
          }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Select from list
        </button>
      </div>
    );
  }

  // Otherwise show dropdown
  return (
    <Select value={value} onValueChange={handleSelectChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <div className="flex items-center gap-2 truncate">
          <FolderOpen className="h-4 w-4 shrink-0 opacity-50" />
          <SelectValue placeholder="Select directory..." />
        </div>
      </SelectTrigger>
      <SelectContent>
        {/* Presets */}
        <SelectItem value={XERRO_AGENT_PATH}>xerro-agent</SelectItem>
        <SelectItem value={CLAUDE_ASSIST_PATH}>claude-assist</SelectItem>

        {/* Recent Projects */}
        {recentProjects.filter((p: XerroProject) => p.path).map((project: XerroProject) => (
          <SelectItem key={project.name} value={project.path!}>
            {project.name}
          </SelectItem>
        ))}

        {/* Custom Path Option */}
        <SelectItem value={CUSTOM_PATH_VALUE}>Custom path...</SelectItem>
      </SelectContent>
    </Select>
  );
}
