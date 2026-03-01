import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import type { CreateTodoInput } from "@/types/todos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BaseDialog } from "@/components/BaseDialog";
import ProjectSelector from "@/components/memory/ProjectSelector";
import { useGraphiti } from "@/context/GraphitiContext";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface CreateTodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateTodoInput) => void;
  isSubmitting: boolean;
  defaultProjectName?: string;
  projectNameDisabled?: boolean;
}

export function CreateTodoDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  defaultProjectName,
  projectNameDisabled,
}: CreateTodoDialogProps) {
  const { groupId } = useGraphiti();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [projectName, setProjectName] = useState<string | null>(defaultProjectName || null);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle("");
      setBody("");
      setProjectName(defaultProjectName || null);
      setScheduledDate(undefined);
      setCalendarOpen(false);
    }
  }, [open, defaultProjectName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const input: CreateTodoInput = { title: title.trim() };
    if (body.trim()) input.body = body.trim();
    if (projectName) input.projectName = projectName;
    if (scheduledDate) {
      const d = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate());
      input.scheduledDate = d.toISOString();
    }
    onSubmit(input);
  };

  const footer = (
    <div className="flex gap-2 justify-end">
      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={isSubmitting || !title.trim()}
        onClick={handleSubmit}
      >
        {isSubmitting ? "Creating..." : "Create"}
      </Button>
    </div>
  );

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New Todo"
      footer={footer}
      footerHeight={64}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="todo-title" className="text-base">Title</Label>
          <Input
            id="todo-title"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
            className="text-lg"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="todo-body" className="text-base">Notes</Label>
          <Textarea
            id="todo-body"
            placeholder="Add any additional notes or details..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[100px] resize-y text-lg md:text-sm"
          />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="todo-project" className="text-base">Project</Label>
            <ProjectSelector
              value={projectName}
              onChange={setProjectName}
              groupId={groupId}
              disabled={projectNameDisabled}
              className="text-lg md:text-sm bg-input"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base">Scheduled date</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex h-10 w-full items-center rounded-md border border-input bg-input px-3 py-2 font-sans text-lg md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
                    !scheduledDate && "text-muted-foreground"
                  )}
                >
                  <span className="flex-1 text-left">
                    {scheduledDate ? format(scheduledDate, "MMMM d, yyyy") : "Pick a date"}
                  </span>
                  {scheduledDate ? (
                    <span
                      role="button"
                      aria-label="Clear date"
                      onClick={(e) => { e.stopPropagation(); setScheduledDate(undefined); }}
                      className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted-foreground/20 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </span>
                  ) : (
                    <CalendarIcon className="h-4 w-4 opacity-50" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[1010]" align="start">
                <Calendar
                  mode="single"
                  selected={scheduledDate}
                  onSelect={(date) => { setScheduledDate(date); setCalendarOpen(false); }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </form>
    </BaseDialog>
  );
}
