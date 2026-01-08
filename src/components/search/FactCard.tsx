import type { Fact } from "@/types/graphiti";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface FactCardProps {
  fact: Fact;
  onOpenDetails?: () => void;
}

function getScoreConfig(score: number) {
  if (score >= 0.8) {
    return {
      label: "HIGH",
      variant: "default" as const,
      bgClass: "bg-green-500/10 border-green-500/20",
      textClass: "text-green-700 dark:text-green-400",
    };
  } else if (score >= 0.5) {
    return {
      label: "GOOD",
      variant: "secondary" as const,
      bgClass: "bg-blue-500/10 border-blue-500/20",
      textClass: "text-blue-700 dark:text-blue-400",
    };
  } else if (score >= 0.2) {
    return {
      label: "MEDIUM",
      variant: "outline" as const,
      bgClass: "bg-yellow-500/10 border-yellow-500/20",
      textClass: "text-yellow-700 dark:text-yellow-400",
    };
  } else {
    return {
      label: "LOW",
      variant: "outline" as const,
      bgClass: "bg-gray-500/10 border-gray-500/20",
      textClass: "text-gray-600 dark:text-gray-400",
    };
  }
}

export function FactCard({ fact, onOpenDetails }: FactCardProps) {
  const scoreConfig = fact.similarity_score !== undefined
    ? getScoreConfig(fact.similarity_score)
    : null;

  const isInvalid = fact.invalid_at && fact.valid_at === fact.invalid_at;

  return (
    <Card
      className={cn(
        scoreConfig?.bgClass,
        "hover:shadow-md transition-shadow cursor-pointer"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onOpenDetails?.();
      }}
    >
      <CardContent className="p-3">
        {/* Main fact content */}
        <div className="flex items-start gap-2 mb-2">
          <p className="text-sm flex-1">
            {fact.fact}
          </p>

          <div className="flex items-center gap-1 flex-shrink-0">
            {isInvalid && (
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" title="Fact was immediately invalidated" />
            )}
            {fact.similarity_score !== undefined && scoreConfig && (
              <>
                <Badge variant={scoreConfig.variant} className={cn("text-xs py-0", scoreConfig.textClass)}>
                  {scoreConfig.label}
                </Badge>
                <span className={cn("text-xs font-mono", scoreConfig.textClass)}>
                  {fact.similarity_score.toFixed(2)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Metadata row */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs py-0">
            {fact.name}
          </Badge>
          <span>
            Valid: {format(new Date(fact.valid_at), "MMM d, yyyy")}
            {fact.invalid_at && (
              <> • Invalid: {format(new Date(fact.invalid_at), "MMM d, yyyy")}</>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
