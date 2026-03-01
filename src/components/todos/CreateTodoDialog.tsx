import { useState, useEffect } from "react";
import type { CreateTodoInput } from "@/types/todos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BaseDialog } from "@/components/BaseDialog";
import ProjectSelector from "@/components/memory/ProjectSelector";
import { useGraphiti } from "@/context/GraphitiContext";
import { X } from "lucide-react";

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
  const [scheduledDate, setScheduledDate] = useState("");

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle("");
      setBody("");
      setProjectName(defaultProjectName || null);
      setScheduledDate("");
    }
  }, [open, defaultProjectName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const input: CreateTodoInput = { title: title.trim() };
    if (body.trim()) input.body = body.trim();
    if (projectName) input.projectName = projectName;
    if (scheduledDate)
      input.scheduledDate = new Date(scheduledDate + "T00:00:00").toISOString();
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
            className="min-h-[100px] resize-y text-base"
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="todo-date" className="text-base">Scheduled date</Label>
            <div className="relative">
              <Input
                id="todo-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="h-10 text-base pr-10"
              />
              {scheduledDate && (
                <button
                  type="button"
                  onClick={() => setScheduledDate("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded hover:bg-muted-foreground/20 transition-colors"
                  aria-label="Clear date"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </BaseDialog>
  );
}
