import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { todosService } from "@/api/todosService";
import type { Todo } from "@/types/todos";
import DestructiveConfirmationDialog from "@/components/dialogs/DestructiveConfirmationDialog";

interface UseDeleteTodoConfirmationOptions {
  /**
   * Optional callback invoked after successful deletion
   */
  onSuccess?: (deletedTodoId: string) => void;
}

interface UseDeleteTodoConfirmationResult {
  /**
   * Opens the confirmation dialog for the given todo
   */
  confirmDelete: (todo: Todo) => void;

  /**
   * The confirmation dialog component - render this in your component
   */
  DeleteConfirmationDialog: React.FC;

  /**
   * Whether a delete mutation is currently in progress
   */
  isDeleting: boolean;
}

/**
 * Centralized hook for handling todo deletion with confirmation.
 *
 * Usage:
 * ```tsx
 * const { confirmDelete, DeleteConfirmationDialog } = useDeleteTodoConfirmation({
 *   onSuccess: () => console.log("Todo deleted!")
 * });
 *
 * // In your JSX:
 * <button onClick={() => confirmDelete(todo)}>Delete</button>
 * <DeleteConfirmationDialog />
 * ```
 */
export function useDeleteTodoConfirmation(
  options: UseDeleteTodoConfirmationOptions = {}
): UseDeleteTodoConfirmationResult {
  const { onSuccess } = options;
  const queryClient = useQueryClient();
  const [todoToDelete, setTodoToDelete] = useState<Todo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => todosService.deleteTodo(id),
    onSuccess: (_, deletedId) => {
      // Invalidate all todo-related queries
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      queryClient.invalidateQueries({ queryKey: ["todos-projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-todos"] });

      // Close dialog
      setDialogOpen(false);
      setTodoToDelete(null);

      // Call optional success callback
      onSuccess?.(deletedId);
    },
  });

  const confirmDelete = useCallback((todo: Todo) => {
    setTodoToDelete(todo);
    setDialogOpen(true);
  }, []);

  const handleConfirmDelete = () => {
    if (todoToDelete) {
      deleteMutation.mutate(todoToDelete.id);
    }
  };

  const handleCancelDelete = () => {
    setDialogOpen(false);
    setTodoToDelete(null);
  };

  const DeleteConfirmationDialog = useCallback(() => {
    if (!todoToDelete) return null;

    return (
      <DestructiveConfirmationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete Todo"
        description={`Are you sure you want to delete "${todoToDelete.title}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
        confirmText="Delete"
        confirmLoadingText="Deleting..."
      />
    );
  }, [todoToDelete, dialogOpen, deleteMutation.isPending]);

  return {
    confirmDelete,
    DeleteConfirmationDialog,
    isDeleting: deleteMutation.isPending,
  };
}
