import { useState, useEffect } from "react";
import { ExcerptMarkdown } from "@/components/markdown/ExcerptMarkdown";
import type { Todo } from "@/types/todos";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarDays, X, FolderOpen } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, parseISO } from "date-fns";


// eslint-disable-next-line react-refresh/only-export-components
export function formatScheduledDate(dateStr: string): string {
  try {
    // Extract just the date portion (YYYY-MM-DD) to avoid timezone issues
    const datePart = dateStr.split('T')[0];
    const date = parseISO(datePart);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd"))
      return "Today";
    if (format(date, "yyyy-MM-dd") === format(tomorrow, "yyyy-MM-dd"))
      return "Tomorrow";
    return format(date, "MMM d");
  } catch {
    return dateStr;
  }
}

interface TodoRowProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete?: () => void;
  onOpen?: (todo: Todo) => void;
  showProject?: boolean;
}

export function TodoRow({
  todo,
  onToggle,
  onDelete,
  onOpen,
  showProject = false,
}: TodoRowProps) {
  const isMobile = useIsMobile();
  const [optimisticCompleted, setOptimisticCompleted] = useState(todo.completed);

  // Sync with server state when it changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOptimisticCompleted(todo.completed);
  }, [todo.completed]);

  const handleToggle = (checked: boolean) => {
    // Update optimistic state immediately
    setOptimisticCompleted(checked);
    // Call the parent's toggle handler
    onToggle(todo.id, checked);
  };

  return (
    <div
      className={`group flex items-start gap-3 px-4 py-3 rounded-lg hover:bg-accent/30 transition-colors -mx-4 ${onOpen ? "cursor-pointer" : ""}`}
      onClick={() => onOpen?.(todo)}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          id={`todo-${todo.id}`}
          checked={optimisticCompleted}
          onCheckedChange={(checked) => handleToggle(checked as boolean)}
          className="mt-1 h-5 w-5 shrink-0 border-white/50 data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-gray-900"
        />
      </div>
      <div className="flex-1 min-w-0">
        <span
          className={`text-base font-semibold leading-snug block mt-[3px] ${
            optimisticCompleted
              ? "line-through text-muted-foreground"
              : "text-foreground"
          }`}
        >
          {todo.title}
        </span>
        {todo.body && (
          <ExcerptMarkdown content={todo.body} inline className="mt-0.5 line-clamp-2" />
        )}
        <div className="flex flex-wrap items-center gap-3 mt-1">
          {showProject && todo.projectName && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <FolderOpen className="h-3.5 w-3.5" />
              {todo.projectName}
            </span>
          )}
          {todo.scheduledDate && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatScheduledDate(todo.scheduledDate)}
            </span>
          )}
        </div>
      </div>
      {onDelete && (
        <div onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onDelete}
            className={`shrink-0 h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-white hover:bg-muted-foreground/30 transition-all ${
              isMobile ? "" : "opacity-0 group-hover:opacity-100"
            }`}
            title="Delete todo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
