import { useQuery } from "@tanstack/react-query";
import { documentsService } from "@/api/documentsService";
import { Button } from "@/components/ui/button";
import { SecondaryNavItem } from "@/components/navigation/SecondaryNavItem";
import {
  SecondaryNavItemTitle,
  SecondaryNavItemSubtitle,
} from "@/components/navigation/SecondaryNavItemContent";
import { SecondaryNavContainer } from "@/components/navigation/SecondaryNavContainer";
import { SecondaryNavToolButton } from "@/components/navigation/SecondaryNavToolButton";
import { Search, ChevronLeft, Folder, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface DocumentsSecondaryNavProps {
  currentDocumentPath: string | null;
  currentFolderPath: string;
  onFolderChange: (path: string) => void;
  onNavigate: (path: string) => void;
  onDocumentSelect?: (path: string) => void;
}

export function DocumentsSecondaryNav({
  currentDocumentPath,
  currentFolderPath,
  onFolderChange,
  onNavigate,
  onDocumentSelect,
}: DocumentsSecondaryNavProps) {
  // Folders to hide from the navigation (configured via environment variable)
  const HIDDEN_FOLDERS = import.meta.env.VITE_HIDDEN_FOLDERS
    ? import.meta.env.VITE_HIDDEN_FOLDERS.split(",").map((f: string) => f.trim()).filter(Boolean)
    : [];

  // Fetch folder structure
  const {
    data: rawItems = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["documents-nav", currentFolderPath],
    queryFn: () =>
      documentsService.getFolderStructure(currentFolderPath || undefined),
  });

  // Filter out hidden folders (only if HIDDEN_FOLDERS is configured)
  const items = HIDDEN_FOLDERS.length > 0
    ? rawItems.filter(
        (item) => item.type !== "folder" || !HIDDEN_FOLDERS.includes(item.name)
      )
    : rawItems;

  // Build breadcrumbs (excluding "Documents" which is our root)
  const breadcrumbs = currentFolderPath
    ? currentFolderPath.split("/").filter(Boolean).slice(1) // Skip "Documents"
    : [];

  const handleBackClick = () => {
    if (breadcrumbs.length === 0) return; // Can't go back from Documents root
    const allSegments = currentFolderPath.split("/").filter(Boolean);
    const parentPath = allSegments.slice(0, -1).join("/");
    // Don't allow going back above Documents
    if (parentPath && !parentPath.startsWith("Documents")) {
      onFolderChange("Documents");
    } else {
      onFolderChange(parentPath || "Documents");
    }
  };

  const handleDocumentClick = (documentPath: string) => {
    const path = `/documents/${documentPath}`;
    if (onDocumentSelect) {
      onDocumentSelect(path);
    } else {
      onNavigate(path);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    // Reconstruct path including "Documents" prefix
    const newPath = "Documents/" + breadcrumbs.slice(0, index + 1).join("/");
    onFolderChange(newPath);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Folder list refreshed");
  };

  return (
    <SecondaryNavContainer
      title="Documents"
      tools={
        <>
          <SecondaryNavToolButton onClick={handleRefresh}>
            <RefreshCw size={20} />
          </SecondaryNavToolButton>
          <SecondaryNavToolButton
            onClick={() => onNavigate("/documents/search")}
          >
            <Search size={22} />
          </SecondaryNavToolButton>
        </>
      }
    >
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="px-6 pb-2">
          <div className="flex items-center gap-0.5 text-sm text-muted-foreground flex-wrap">
            <span
              className="cursor-pointer hover:text-foreground transition-colors"
              onClick={() => onFolderChange("Documents")}
            >
              Documents
            </span>
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center">
                <span className="mx-1">/</span>
                <span
                  className="cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleBreadcrumbClick(index)}
                >
                  {crumb}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back Button */}
      {breadcrumbs.length > 0 && (
        <div className="px-6 pb-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={handleBackClick}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to{" "}
            {breadcrumbs.length === 1
              ? "Documents"
              : breadcrumbs[breadcrumbs.length - 2]}
          </Button>
        </div>
      )}

      {/* Items List */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        {isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 bg-accent/50 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No documents in this folder
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item) => {
              const isActiveDocument =
                item.type === "document" && currentDocumentPath === item.path;

              if (item.type === "folder") {
                return (
                  <SecondaryNavItem
                    key={item.path}
                    isActive={false}
                    onClick={() => onFolderChange(item.path)}
                  >
                    <Folder className="h-4 w-4 mr-3 flex-shrink-0 text-muted-foreground" />
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <SecondaryNavItemTitle>{item.name}</SecondaryNavItemTitle>
                      {item.documentCount !== undefined && (
                        <SecondaryNavItemSubtitle>
                          {item.documentCount}{" "}
                          {item.documentCount === 1 ? "document" : "documents"}
                        </SecondaryNavItemSubtitle>
                      )}
                    </div>
                  </SecondaryNavItem>
                );
              }

              return (
                <SecondaryNavItem
                  key={item.path}
                  isActive={isActiveDocument}
                  onClick={() => handleDocumentClick(item.path)}
                >
                  <FileText className="h-4 w-4 mr-3 flex-shrink-0 text-muted-foreground" />
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <SecondaryNavItemTitle>
                      {item.name.replace(/\.md$/, "")}
                    </SecondaryNavItemTitle>
                    <SecondaryNavItemSubtitle>
                      {new Date(item.modified).toLocaleDateString()}
                    </SecondaryNavItemSubtitle>
                  </div>
                </SecondaryNavItem>
              );
            })}
          </div>
        )}
      </div>
    </SecondaryNavContainer>
  );
}
