import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { memoryBlocksService } from "@/api/memoryBlocksService";
import Container from "@/components/container/Container";
import { ContainerToolButton } from "@/components/container/ContainerToolButton";
import { Badge } from "@/components/ui/badge";
import { Copy, RefreshCw, Pencil, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { MarkdownViewer } from "@/components/document-viewers";

export default function MemoryBlockDetail() {
  const params = useParams();
  const queryClient = useQueryClient();
  const label = params["*"] || "";
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  const {
    data: block,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["memory-block", label],
    queryFn: () => memoryBlocksService.getBlock(label),
    enabled: !!label,
  });

  const updateMutation = useMutation({
    mutationFn: (content: string) =>
      memoryBlocksService.updateBlock(label, content),
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["memory-block", label] });
      toast.success("Block saved");
    },
    onError: () => {
      toast.error("Failed to save block");
    },
  });

  const handleEdit = () => {
    setEditContent(block?.content || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => setIsEditing(false);

  const handleSave = () => updateMutation.mutate(editContent);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  };

  const handleCopy = () => {
    if (block?.content) {
      navigator.clipboard.writeText(block.content).then(() => {
        toast.success("Content copied to clipboard");
      });
    }
  };

  const isReadOnly = block?.frontmatter?.read_only === true;
  const limit = block?.frontmatter?.limit ?? 0;
  const charCount = editContent.length;
  const isOverLimit = limit > 0 && charCount > limit;
  const isNearLimit = limit > 0 && charCount > limit * 0.9;

  // Extract display name from label (last segment)
  const displayName = label.split("/").pop() || label;

  const tools = isEditing ? (
    <>
      <ContainerToolButton
        onClick={handleCancelEdit}
        aria-label="Cancel editing"
        title="Cancel"
      >
        <X className="h-4 w-4" />
      </ContainerToolButton>
      <ContainerToolButton
        onClick={handleSave}
        aria-label="Save block"
        title="Save"
        disabled={isOverLimit || updateMutation.isPending}
      >
        {updateMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
      </ContainerToolButton>
    </>
  ) : (
    <>
      <ContainerToolButton onClick={handleCopy} aria-label="Copy content" title="Copy content">
        <Copy className="h-4 w-4" />
      </ContainerToolButton>
      <ContainerToolButton
        onClick={() => {
          refetch();
          toast.success("Block refreshed");
        }}
        aria-label="Refresh"
        title="Refresh"
      >
        <RefreshCw className="h-4 w-4" />
      </ContainerToolButton>
      <ContainerToolButton
        onClick={handleEdit}
        aria-label="Edit block"
        title="Edit"
        disabled={isReadOnly}
      >
        <Pencil className="h-4 w-4" />
      </ContainerToolButton>
    </>
  );

  const titleNode = (
    <span className="flex items-center gap-2 flex-wrap">
      {displayName}
      {isReadOnly && (
        <Badge variant="secondary" className="text-xs font-normal">
          Read Only
        </Badge>
      )}
    </span>
  );

  const descriptionNode = block ? (
    <span className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
      <span>{label}</span>
      {block.totalLines > 0 && <span>{block.totalLines} lines</span>}
      {limit > 0 && (
        <span>
          limit: {limit.toLocaleString()} chars
        </span>
      )}
    </span>
  ) : undefined;

  return (
    <Container
      title={isLoading ? undefined : titleNode}
      description={isLoading ? undefined : descriptionNode}
      tools={!isLoading ? tools : undefined}
      loading={isLoading}
    >
      {!isLoading && block && (
        <>
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full min-h-[60vh] p-3 text-sm font-mono bg-background border border-input rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
              <div className="flex justify-end">
                <span
                  className={`text-xs ${
                    isOverLimit
                      ? "text-destructive font-medium"
                      : isNearLimit
                      ? "text-yellow-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {charCount.toLocaleString()}
                  {limit > 0 && ` / ${limit.toLocaleString()}`} chars
                </span>
              </div>
            </div>
          ) : (
            <MarkdownViewer content={block.content} documentPath={block.path} />
          )}
        </>
      )}
    </Container>
  );
}
