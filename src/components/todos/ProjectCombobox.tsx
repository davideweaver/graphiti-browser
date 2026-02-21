import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { graphitiService } from "@/api/graphitiService";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  value: string;
  onChange: (projectName: string) => void;
  groupId: string;
  disabled?: boolean;
}

export function ProjectCombobox({ value, onChange, groupId, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["projects", groupId],
    queryFn: () => graphitiService.listProjects(groupId, 100),
  });

  // Filter out '_general' project from list
  const projects = data?.projects.filter((p) => p.name !== "_general") || [];

  // When value changes externally, update search field if combobox is closed
  useEffect(() => {
    if (!open) {
      setSearch(value);
    }
  }, [value, open]);

  const handleSelect = (projectName: string) => {
    onChange(projectName);
    setSearch(projectName);
    setOpen(false);
  };

  const handleSearchChange = (searchValue: string) => {
    setSearch(searchValue);
    // Allow typing custom project names
    onChange(searchValue);
  };

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        Failed to load projects
      </div>
    );
  }

  // Filter projects by search query
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase())
  );

  // Check if search matches an existing project exactly
  const exactMatch = projects.some(
    (p) => p.name.toLowerCase() === search.toLowerCase()
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="truncate">
            {value || "Select or type project..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0 z-[1004]"
        align="start"
        side="bottom"
        sideOffset={4}
        collisionPadding={8}
        avoidCollisions={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or type new project..."
            value={search}
            onValueChange={handleSearchChange}
          />
          <CommandList
            className="max-h-[200px] overflow-y-scroll overscroll-contain touch-pan-y"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <CommandEmpty>
              {search ? (
                <div className="py-2 px-2 text-sm">
                  <div className="font-medium">Create new project:</div>
                  <div className="text-muted-foreground mt-1">"{search}"</div>
                </div>
              ) : (
                "No projects found."
              )}
            </CommandEmpty>
            {filteredProjects.length > 0 && (
              <CommandGroup heading="Existing Projects">
                {filteredProjects.map((project) => (
                  <CommandItem
                    key={project.uuid}
                    value={project.name}
                    onSelect={() => handleSelect(project.name)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === project.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{project.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {project.episode_count} episode{project.episode_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {search && !exactMatch && filteredProjects.length > 0 && (
              <CommandGroup heading="Create New">
                <CommandItem
                  value={search}
                  onSelect={() => handleSelect(search)}
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  <div className="flex flex-col">
                    <span>Create "{search}"</span>
                    <span className="text-xs text-muted-foreground">
                      New project
                    </span>
                  </div>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
