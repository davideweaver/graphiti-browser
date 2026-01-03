import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Brain } from "lucide-react";
import { format } from "date-fns";

interface Props {
  factIds: string[];
  facts?: Array<{ uuid: string; fact: string; valid_at: string }>;
}

export default function MemoryBadge({ factIds, facts }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-2">
      <Badge
        variant="secondary"
        className="cursor-pointer hover:bg-secondary/80 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Brain className="h-3 w-3 mr-1" />
        {factIds.length} memor{factIds.length === 1 ? "y" : "ies"} used
        {isExpanded ? (
          <ChevronUp className="h-3 w-3 ml-1" />
        ) : (
          <ChevronDown className="h-3 w-3 ml-1" />
        )}
      </Badge>

      {isExpanded && (
        <Card className="text-xs">
          <CardContent className="p-3 space-y-3">
            <p className="font-semibold">Memory Context:</p>
            {facts && facts.length > 0 ? (
              <div className="space-y-2">
                {facts.map((fact, i) => (
                  <div
                    key={fact.uuid}
                    className="border-l-2 border-muted pl-3 py-1"
                  >
                    <p className="text-muted-foreground mb-1">
                      {i + 1}. {format(new Date(fact.valid_at), "MMM d, yyyy")}
                    </p>
                    <p className="text-foreground">{fact.fact}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                {factIds.length} fact{factIds.length === 1 ? "" : "s"} from
                Graphiti were injected into this response
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
