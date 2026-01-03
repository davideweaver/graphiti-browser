import { useState } from "react";
import type { Fact } from "@/types/graphiti";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

interface FactCardProps {
  fact: Fact;
}

export function FactCard({ fact }: FactCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-start justify-between">
          <span className="flex-1">{fact.name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Valid: {format(new Date(fact.valid_at), "MMM d, yyyy h:mm a")}
          </span>
          {fact.invalid_at && (
            <span>
              - Invalid: {format(new Date(fact.invalid_at), "MMM d, yyyy h:mm a")}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className={`mb-3 ${!isExpanded ? "line-clamp-2" : ""}`}>
          {fact.fact}
        </p>

        {isExpanded && (
          <>
            {fact.entities && fact.entities.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-semibold mb-2">Related Entities:</h4>
                <div className="flex flex-wrap gap-2">
                  {fact.entities.map((entity) => {
                    const entityType = entity.labels?.find((label) => label !== "Entity") || entity.entity_type || "Unknown";
                    return (
                      <Badge key={entity.uuid} variant="secondary">
                        {entity.name} ({entityType})
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {fact.episodes && fact.episodes.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Source Episodes:</h4>
                <div className="space-y-2">
                  {fact.episodes.map((episode) => (
                    <div
                      key={episode.uuid}
                      className="text-sm p-2 bg-muted rounded"
                    >
                      <div className="font-medium">{episode.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(
                          new Date(episode.created_at),
                          "MMM d, yyyy h:mm a"
                        )}
                      </div>
                      {episode.source_description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {episode.source_description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
