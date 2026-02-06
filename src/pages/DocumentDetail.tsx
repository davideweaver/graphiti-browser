import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { documentsService } from "@/api/documentsService";
import Container from "@/layout/Container";
import { Button } from "@/components/ui/button";
import { Copy, ChevronLeft, FolderOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { getSearchQuery } from "@/lib/documentsSearchStorage";
import { setCurrentFolderPath, clearLastDocumentPath } from "@/lib/documentsStorage";

export default function DocumentDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const documentPath = params["*"] || "";

  const { data: document, isLoading } = useQuery({
    queryKey: ["document", documentPath],
    queryFn: () => documentsService.getDocument(documentPath),
    enabled: !!documentPath,
  });

  // Check if we came from search
  const hasActiveSearch = !!getSearchQuery();

  const handleCopyContent = () => {
    if (document?.content) {
      navigator.clipboard.writeText(document.content);
      toast.success("Content copied to clipboard");
    }
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
        })
      );
      toast.success("Showing folder in sidebar");
    }
  };

  // Extract filename
  const pathSegments = documentPath.split("/");
  const fileName = pathSegments[pathSegments.length - 1];

  // Format modified date
  const modifiedDate = document?.modified
    ? new Date(document.modified).toLocaleString()
    : "";

  return (
    <Container
      title={fileName || "Document"}
      description={
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">{documentPath}</span>
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToSearch}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={handleShowInFolder}
            disabled={!documentPath}
          >
            <FolderOpen className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopyContent}
            disabled={!document}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      {/* Frontmatter Display */}
      {document?.frontmatter && Object.keys(document.frontmatter).length > 0 && (
        <div className="mb-6 p-4 bg-accent/50 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">Metadata</h3>
          <div className="grid gap-2 text-sm">
            {Object.entries(document.frontmatter).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <span className="font-medium text-muted-foreground">{key}:</span>
                <span>{String(value)}</span>
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
        <article className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {document.content}
          </ReactMarkdown>
        </article>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Document not found</p>
        </div>
      )}
    </Container>
  );
}
