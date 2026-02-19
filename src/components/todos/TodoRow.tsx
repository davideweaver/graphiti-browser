import ReactMarkdown from "react-markdown";
import type { Todo } from "@/types/todos";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Trash2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, parseISO } from "date-fns";

// Inline-only components so line-clamp works on the container
const mdComponents = {
  p: ({ children }: { children: React.ReactNode }) => <span>{children} </span>,
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong>{children}</strong>
  ),
  em: ({ children }: { children: React.ReactNode }) => <em>{children}</em>,
  code: ({ children }: { children: React.ReactNode }) => (
    <code className="text-xs bg-white/10 rounded px-0.5">{children}</code>
  ),
  // Collapse block elements to inline
  h1: ({ children }: { children: React.ReactNode }) => (
    <span className="font-bold">{children} </span>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <span className="font-bold">{children} </span>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <span className="font-bold">{children} </span>
  ),
  ul: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  ol: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  li: ({ children }: { children: React.ReactNode }) => (
    <span>• {children} </span>
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <span className="italic opacity-75">{children}</span>
  ),
};

export function formatScheduledDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
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
  onDelete?: (id: string) => void;
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

  return (
    <div
      className={`group flex items-start gap-3 px-4 py-3 rounded-lg hover:bg-accent/30 transition-colors ${onOpen ? "cursor-pointer" : ""}`}
      onClick={() => onOpen?.(todo)}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          id={`todo-${todo.id}`}
          checked={todo.completed}
          onCheckedChange={(checked) => onToggle(todo.id, checked as boolean)}
          className="mt-1 h-5 w-5 shrink-0 border-white/50 data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-gray-900"
        />
      </div>
      <div className="flex-1 min-w-0">
        <span
          className={`text-base font-semibold leading-snug block mt-[3px] ${
            todo.completed
              ? "line-through text-muted-foreground"
              : "text-foreground"
          }`}
        >
          {todo.title}
        </span>
        {todo.body && (
          <div className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            <ReactMarkdown components={mdComponents}>{todo.body}</ReactMarkdown>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {showProject && todo.projectName && (
            <Badge variant="secondary" className="text-sm">
              {todo.projectName}
            </Badge>
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
            onClick={() => onDelete(todo.id)}
            className={`shrink-0 h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all ${
              isMobile ? "" : "opacity-0 group-hover:opacity-100"
            }`}
            title="Delete todo"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
