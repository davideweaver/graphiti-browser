import { useQuery } from "@tanstack/react-query";
import { llamacppAdminService } from "@/api/llamacppAdminService";
import Container from "@/components/container/Container";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Database } from "lucide-react";

export default function LlamacppModels() {
  // Poll for model list
  const { data, isLoading, error } = useQuery({
    queryKey: ["llamacpp-models"],
    queryFn: async () => {
      const result = await llamacppAdminService.listModels();
      console.log("Models API response:", result);
      return result;
    },
    refetchInterval: 10000, // 10 seconds
    refetchIntervalInBackground: false,
    retry: false,
  });

  const models = data?.models || [];

  // Show error state
  if (error) {
    return (
      <Container
        title="LLM Models"
        description="Available models for inference"
        icon={Database}
      >
        <div className="p-8 text-center">
          <div className="text-destructive mb-2">Failed to load models</div>
          <div className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Unknown error"}
          </div>
        </div>
      </Container>
    );
  }

  // Helper to format file size
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <Container
      title="LLM Models"
      description="Available models for inference"
      icon={Database}
    >
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 font-medium">Model</th>
              <th className="text-left py-3 px-4 font-medium">Size</th>
              <th className="text-left py-3 px-4 font-medium">Parameters</th>
              <th className="text-left py-3 px-4 font-medium">Quantization</th>
              <th className="text-left py-3 px-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  <td className="py-3 px-4">
                    <Skeleton className="h-4 w-48" />
                  </td>
                  <td className="py-3 px-4">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="py-3 px-4">
                    <Skeleton className="h-4 w-12" />
                  </td>
                  <td className="py-3 px-4">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="py-3 px-4">
                    <Skeleton className="h-6 w-20" />
                  </td>
                </tr>
              ))
            ) : models.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No models found
                </td>
              </tr>
            ) : (
              models.map((model) => (
                <tr key={model.filename} className="border-b hover:bg-accent/50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{model.filename}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-md">
                        {model.path}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {model.formattedSize}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    —
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    —
                  </td>
                  <td className="py-3 px-4">
                    {model.serversUsing > 0 ? (
                      <Badge variant="default">
                        Loaded ({model.serversUsing})
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Available</Badge>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
