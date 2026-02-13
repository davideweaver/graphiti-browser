import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { documentsService } from "@/api/documentsService";
import Container from "@/components/container/Container";
import { ContainerToolButton } from "@/components/container/ContainerToolButton";
import { Badge } from "@/components/ui/badge";
import { Copy, ChevronLeft, FolderOpen, RefreshCw, Trash2, AlertCircle, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { getSearchQuery } from "@/lib/documentsSearchStorage";
import { setCurrentFolderPath, clearLastDocumentPath } from "@/lib/documentsStorage";
import DestructiveConfirmationDialog from "@/components/dialogs/DestructiveConfirmationDialog";
import { useState } from "react";
import { MarkdownViewer, ExcalidrawViewer } from "@/components/document-viewers";
import { getFileType, DocumentFileType } from "@/lib/fileTypeUtils";
import { isExcalidrawMarkdown, parseExcalidrawMarkdown } from "@/lib/excalidrawParser";
import { useDocumentChanges } from "@/hooks/use-document-changes";

export default function DocumentDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const documentPath = params["*"] || "";
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  // Delete mutation (defined early so we can use isPending in query)
  const deleteDocumentMutation = useMutation({
    mutationFn: () => documentsService.deleteDocument(documentPath),
    onError: (error) => {
      console.error("Failed to delete document:", error);
      setDeleteDialogOpen(false);
    },
    onSuccess: () => {
      // Mark as deleted to prevent query from re-enabling
      setIsDeleted(true);

      // Close dialog immediately
      setDeleteDialogOpen(false);

      // Remove document query from cache to prevent refetch
      queryClient.removeQueries({ queryKey: ["document", documentPath] });

      // Extract parent folder path
      const pathSegments = documentPath.split("/");
      const parentPath = pathSegments.slice(0, -1).join("/");

      // Invalidate folder structure with correct query key to refresh secondary nav
      queryClient.invalidateQueries({ queryKey: ["documents-nav", parentPath] });
      queryClient.invalidateQueries({ queryKey: ["documents-nav"] });

      // Clear last document from localStorage to prevent auto-restore
      clearLastDocumentPath();

      toast.success("Document deleted successfully");

      // Navigate immediately to documents root
      navigate("/documents");
    },
  });

  // Real-time document change notifications
  const { isConnected } = useDocumentChanges({
    onAdded: (event) => {
      toast.success(`Document added: ${event.path}`);
      // Invalidate navigation to show new document
      queryClient.invalidateQueries({ queryKey: ["documents-nav"] });
    },
    onUpdated: (event) => {
      // If the current document was updated, auto-refresh silently
      if (event.path === documentPath || event.absolutePath.endsWith(documentPath)) {
        refetch();
        // Also invalidate navigation in case filename changed
        queryClient.invalidateQueries({ queryKey: ["documents-nav"] });
      } else {
        // For other documents, just refresh navigation
        queryClient.invalidateQueries({ queryKey: ["documents-nav"] });
      }
    },
    onRemoved: (event) => {
      // If the current document was deleted, navigate away
      if (event.path === documentPath || event.absolutePath.endsWith(documentPath)) {
        toast.error(`This document was deleted: ${event.path}`, {
          description: "Redirecting to documents...",
        });
        setIsDeleted(true);
        clearLastDocumentPath();
        queryClient.invalidateQueries({ queryKey: ["documents-nav"] });
        setTimeout(() => navigate("/documents"), 1000);
      } else {
        toast.error(`Document removed: ${event.path}`);
        queryClient.invalidateQueries({ queryKey: ["documents-nav"] });
      }
    },
  });

  // Disable query during and after deletion to prevent 500 error
  const {
    data: document,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["document", documentPath],
    queryFn: () => documentsService.getDocument(documentPath),
    enabled: !!documentPath && !deleteDocumentMutation.isPending && !isDeleted,
  });

  // Check if we came from search
  const hasActiveSearch = !!getSearchQuery();

  // Detect file type
  const fileType = getFileType(documentPath);

  const handleCopyContent = () => {
    if (document?.content) {
      let contentToCopy = document.content;
      let contentType = "content";

      // For Excalidraw files, copy the decompressed JSON
      if (fileType === DocumentFileType.EXCALIDRAW) {
        try {
          if (isExcalidrawMarkdown(document.content)) {
            const parsed = parseExcalidrawMarkdown(document.content);
            contentToCopy = JSON.stringify(parsed, null, 2);
            contentType = "Excalidraw JSON";
          } else {
            // Already JSON, just prettify it
            const parsed = JSON.parse(document.content);
            contentToCopy = JSON.stringify(parsed, null, 2);
            contentType = "Excalidraw JSON";
          }
        } catch (error) {
          // If parsing fails, copy raw content
          console.error("Failed to parse Excalidraw content:", error);
          contentType = "raw content";
        }
      }

      navigator.clipboard.writeText(contentToCopy);
      toast.success(`${contentType} copied to clipboard`);
    }
  };

  const handleExcalidrawError = (error: Error) => {
    toast.error("Failed to load Excalidraw diagram", {
      description: error.message,
    });
  };

  const handleBackToSearch = () => {
    navigate("/documents/search");
  };

  const handleShowInFolder = () => {
    // Extract parent folder from document path
    const pathSegments = documentPath.split("/");
    const parentPath = pathSegments.slice(0, -1).join("/");

    if (parentPath) {
      // Update folder path in localStorage
      setCurrentFolderPath(parentPath);
      // Dispatch custom event to notify Layout of folder change
      window.dispatchEvent(
        new CustomEvent("documents-folder-change", {
          detail: { folderPath: parentPath },
        }),
      );
      toast.success("Showing folder in sidebar");
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Document refreshed");
  };

  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteDocumentMutation.mutate();
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
  };

  // Extract filename and clean up extension
  const pathSegments = documentPath.split("/");
  const rawFileName = pathSegments[pathSegments.length - 1];
  let fileName = rawFileName;

  if (fileType === DocumentFileType.EXCALIDRAW) {
    // Remove .excalidraw.md or .excalidraw extension
    fileName = rawFileName.replace(/\.excalidraw\.md$/, "").replace(/\.excalidraw$/, "");
  } else if (fileType === DocumentFileType.MARKDOWN) {
    // Remove .md extension for markdown files
    fileName = rawFileName.replace(/\.md$/, "");
  }

  // Format modified date
  const modifiedDate = document?.modified
    ? new Date(document.modified).toLocaleString()
    : "";

  return (
    <Container
      title={fileName || "Document"}
      description={
        <div className="flex flex-col gap-1 min-w-0 w-full">
          <span className="text-sm text-muted-foreground truncate block">
            {documentPath}
          </span>
          {modifiedDate && (
            <span className="text-xs text-muted-foreground">
              Modified: {modifiedDate}
            </span>
          )}
        </div>
      }
      tools={
        <div className="flex items-center gap-2">
          {hasActiveSearch && (
            <ContainerToolButton size="sm" onClick={handleBackToSearch}>
              <ChevronLeft className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Back</span>
            </ContainerToolButton>
          )}
          {!isConnected && (
            <Badge variant="secondary" className="flex items-center gap-1.5">
              <WifiOff className="h-3 w-3" />
              <span>Offline</span>
            </Badge>
          )}
          <ContainerToolButton
            size="icon"
            onClick={handleRefresh}
            disabled={!documentPath}
          >
            <RefreshCw className="h-4 w-4" />
          </ContainerToolButton>
          <ContainerToolButton
            size="icon"
            onClick={handleShowInFolder}
            disabled={!documentPath}
          >
            <FolderOpen className="h-4 w-4" />
          </ContainerToolButton>
          <ContainerToolButton
            size="icon"
            onClick={handleCopyContent}
            disabled={!document}
          >
            <Copy className="h-4 w-4" />
          </ContainerToolButton>
          <ContainerToolButton
            size="icon"
            onClick={handleOpenDeleteDialog}
            disabled={!documentPath}
            variant="destructive"
          >
            <Trash2 className="h-4 w-4" />
          </ContainerToolButton>
        </div>
      }
    >
      {/* Frontmatter Display - hide for Excalidraw files */}
      {fileType !== DocumentFileType.EXCALIDRAW &&
        document?.frontmatter &&
        Object.keys(document.frontmatter).length > 0 && (
          <div className="mb-6 p-4 bg-accent/50 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Metadata</h3>
            <div className="grid gap-2 text-sm">
              {Object.entries(document.frontmatter).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="font-medium text-muted-foreground shrink-0">
                    {key}:
                  </span>
                  <span className="break-all overflow-hidden">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Document Content */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-accent/50 rounded animate-pulse"
              style={{ width: `${Math.random() * 40 + 60}%` }}
            />
          ))}
        </div>
      ) : document ? (
        <>
          {fileType === DocumentFileType.MARKDOWN && (
            <MarkdownViewer content={document.content} documentPath={documentPath} />
          )}
          {fileType === DocumentFileType.EXCALIDRAW && (
            <ExcalidrawViewer
              content={document.content}
              onError={handleExcalidrawError}
            />
          )}
          {fileType === DocumentFileType.UNKNOWN && (
            <div className="flex items-center justify-center h-96 border rounded-lg">
              <div className="text-center p-6">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold mb-2">Unsupported File Type</p>
                <p className="text-sm text-muted-foreground">
                  This file type cannot be previewed in the browser.
                </p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Document not found</p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DestructiveConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete Document"
        description={`Are you sure you want to delete "${fileName}"? This action cannot be undone.`}
        isLoading={deleteDocumentMutation.isPending}
      />
    </Container>
  );
}
