import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { todosService } from "@/api/todosService";
import type {
  Todo,
  CreateTodoInput,
  UpdateTodoInput,
  TodoListFilter,
  TodoListResult,
} from "@/types/todos";
import Container from "@/components/container/Container";
import { ContainerToolButton } from "@/components/container/ContainerToolButton";
import { ContainerToolToggle } from "@/components/container/ContainerToolToggle";
import { useXerroWebSocketContext } from "@/context/XerroWebSocketContext";
import { TodoRow } from "@/components/todos/TodoRow";
import { TodoEditSheet } from "@/components/todos/TodoEditSheet";
import { CreateTodoDialog } from "@/components/todos/CreateTodoDialog";
import { useDeleteTodoConfirmation } from "@/hooks/use-delete-todo-confirmation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Plus, Check, FolderTree, FolderKanban, ChevronDown } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupTodosByProject(todos: Todo[]): { project: string; todos: Todo[] }[] {
  const groups = new Map<string, Todo[]>();
  for (const todo of todos) {
    const key = todo.projectName || "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(todo);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => {
      if (a === "" && b === "") return 0;
      if (a === "") return 1;
      if (b === "") return -1;
      return a.localeCompare(b);
    })
    .map(([project, todos]) => ({ project, todos }));
}

async function fetchTodayTodos(search?: string): Promise<TodoListResult> {
  const today = new Date().toISOString().split("T")[0];
  const [scheduled, unscheduled] = await Promise.all([
    todosService.listTodos({
      scheduledDate: today,
      completed: false,
      search,
      limit: 200,
    }),
    todosService.listTodos({
      unscheduled: true,
      completed: false,
      search,
      limit: 200,
    }),
  ]);
  const todos = [...scheduled.todos, ...unscheduled.todos];
  return { todos, total: todos.length, limit: 200, offset: 0 };
}

function buildQueryFilter(filter: string, search?: string): TodoListFilter {
  const result: TodoListFilter = {};
  if (filter.startsWith("project:")) result.projectName = filter.slice(8);
  if (search) result.search = search;
  return result;
}

function getFilterLabel(filter: string): string {
  if (filter === "today") return "Today";
  if (filter === "all") return "All";
  if (filter.startsWith("project:")) return filter.slice(8);
  return "Todos";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Todos() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTodo, setEditTodo] = useState<Todo | null>(null);
  const [showCompleted, setShowCompleted] = useState(
    () => localStorage.getItem("todos-show-completed") === "true",
  );
  const [groupByProject, setGroupByProject] = useState(
    () => localStorage.getItem("todos-group-by-project") === "true",
  );

  const [closedProjects, setClosedProjects] = useState<Set<string>>(new Set());

  const { confirmDelete, DeleteConfirmationDialog } = useDeleteTodoConfirmation();

  const handleToggleCompleted = (val: boolean) => {
    setShowCompleted(val);
    localStorage.setItem("todos-show-completed", String(val));
  };

  const handleToggleGroupByProject = (val: boolean) => {
    setGroupByProject(val);
    localStorage.setItem("todos-group-by-project", String(val));
  };

  const toggleProject = (key: string) => {
    setClosedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filter = searchParams.get("filter") || "today";
  const isProjectFilter = filter.startsWith("project:");
  const search = searchParams.get("search") || undefined;
  const queryFilter = buildQueryFilter(filter, search);
  const filterLabel = getFilterLabel(filter);
  const defaultProjectName = isProjectFilter ? filter.slice(8) : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ["todos", filter, search],
    queryFn: () =>
      filter === "today"
        ? fetchTodayTodos(search)
        : todosService.listTodos(queryFilter),
  });

  const allTodos = data?.todos || [];
  const todos = showCompleted ? allTodos : allTodos.filter((t) => !t.completed);

  const groupedTodos = useMemo(() => {
    if (!groupByProject || isProjectFilter) return null;
    return groupTodosByProject(todos);
  }, [todos, groupByProject, isProjectFilter]);

  const {
    subscribeToTodoCreated,
    subscribeToTodoUpdated,
    subscribeToTodoDeleted,
  } = useXerroWebSocketContext();

  useEffect(() => {
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      queryClient.invalidateQueries({ queryKey: ["todos-projects"] });
    };
    const unsubCreated = subscribeToTodoCreated(invalidate);
    const unsubUpdated = subscribeToTodoUpdated(invalidate);
    const unsubDeleted = subscribeToTodoDeleted(invalidate);
    return () => {
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
    };
  }, [
    queryClient,
    subscribeToTodoCreated,
    subscribeToTodoUpdated,
    subscribeToTodoDeleted,
  ]);

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      todosService.updateTodo(id, { completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateTodoInput) => todosService.createTodo(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      queryClient.invalidateQueries({ queryKey: ["todos-projects"] });
      setCreateOpen(false);
    },
  });

  const handleSave = async (id: string, input: UpdateTodoInput) => {
    await todosService.updateTodo(id, input);
    queryClient.invalidateQueries({ queryKey: ["todos"] });
  };

  const getEmptyMessage = () => {
    if (filter === "today") return "No todos for today";
    if (filter === "all") return "No todos yet";
    if (filter.startsWith("project:")) return `No todos in ${filter.slice(8)}`;
    return "No todos found";
  };

  const tools = (
    <div className="flex items-center gap-2">
      <ContainerToolButton
        variant="primary"
        onClick={() => setCreateOpen(true)}
      >
        <Plus className="mr-1.5" />
        New Todo
      </ContainerToolButton>
      {!isProjectFilter && (
        <ContainerToolToggle
          pressed={groupByProject}
          onPressedChange={handleToggleGroupByProject}
          aria-label="Group by project"
        >
          <FolderTree strokeWidth={groupByProject ? 2.5 : 1.5} className={groupByProject ? undefined : "opacity-40"} />
        </ContainerToolToggle>
      )}
      <ContainerToolToggle
        pressed={showCompleted}
        onPressedChange={handleToggleCompleted}
        aria-label="Toggle completed todos"
      >
        <Check strokeWidth={showCompleted ? 5 : 1.5} className={showCompleted ? undefined : "opacity-40"} />
      </ContainerToolToggle>
    </div>
  );

  return (
    <>
      <Container
        title={filterLabel}
        description="Manage your tasks and to-dos"
        tools={tools}
        loading={isLoading}
      >
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : todos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">{getEmptyMessage()}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Todo
            </Button>
          </div>
        ) : groupByProject && !isProjectFilter && groupedTodos ? (
          <div className="space-y-6">
            {groupedTodos.map(({ project, todos: groupTodos }) => {
              const key = project || "__none__";
              const isOpen = !closedProjects.has(key);
              const displayName = project || "No Project";
              return (
                <Collapsible
                  key={key}
                  open={isOpen}
                  onOpenChange={() => toggleProject(key)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-pointer hover:bg-muted/30 px-2 py-1.5 -mx-2 rounded-md transition-colors text-muted-foreground">
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`}
                      />
                      <FolderKanban className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {displayName}
                      </span>
                      <span className="text-xs font-normal opacity-60">
                        ({groupTodos.length})
                      </span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-0.5 mt-2">
                      {groupTodos.map((todo: Todo) => (
                        <TodoRow
                          key={todo.id}
                          todo={todo}
                          showProject={false}
                          onToggle={(id, completed) =>
                            toggleMutation.mutate({ id, completed })
                          }
                          onDelete={() => confirmDelete(todo)}
                          onOpen={setEditTodo}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        ) : (
          <div className="space-y-0.5">
            {todos.map((todo: Todo) => (
              <TodoRow
                key={todo.id}
                todo={todo}
                showProject={!isProjectFilter}
                onToggle={(id, completed) =>
                  toggleMutation.mutate({ id, completed })
                }
                onDelete={() => confirmDelete(todo)}
                onOpen={setEditTodo}
              />
            ))}
          </div>
        )}
      </Container>

      <TodoEditSheet
        todo={editTodo}
        onClose={() => setEditTodo(null)}
        onSave={handleSave}
      />

      <CreateTodoDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(input) => createMutation.mutate(input)}
        isSubmitting={createMutation.isPending}
        defaultProjectName={defaultProjectName}
      />

      <DeleteConfirmationDialog />
    </>
  );
}
