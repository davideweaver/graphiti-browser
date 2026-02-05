import { useQuery } from "@tanstack/react-query";
import { graphitiService } from "@/api/graphitiService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  value: string | null;
  onChange: (projectName: string | null) => void;
  groupId: string;
}

export default function ProjectSelector({ value, onChange, groupId }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["projects", groupId],
    queryFn: () => graphitiService.listProjects(groupId, 100),
  });

  // Filter out '_general' project from list
  const projects = data?.projects.filter((p) => p.name !== "_general") || [];

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        Failed to load projects: {(error as Error).message}
      </div>
    );
  }

  return (
    <Select
      value={value || "__no_project__"}
      onValueChange={(val) => onChange(val === "__no_project__" ? null : val)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a project" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__no_project__">
          <span className="text-muted-foreground">No project (General)</span>
        </SelectItem>
        {projects.map((project) => (
          <SelectItem key={project.uuid} value={project.name}>
            <div className="flex flex-col">
              <span>{project.name}</span>
              <span className="text-xs text-muted-foreground">
                {project.episode_count} episode{project.episode_count !== 1 ? "s" : ""}
              </span>
            </div>
          </SelectItem>
        ))}
        {projects.length === 0 && (
          <SelectItem value="__empty__" disabled>
            <span className="text-muted-foreground">No projects found</span>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
