import type { Entity } from "@/types/graphiti";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface EntityCardProps {
  entity: Entity;
}

export function EntityCard({ entity }: EntityCardProps) {
  const navigate = useNavigate();

  // Get entity type from labels array (skip generic "Entity" label)
  const entityType =
    entity.labels.find((label) => label !== "Entity") ||
    entity.entity_type ||
    "Unknown";

  const getEntityTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "person":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "organization":
        return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20";
      case "location":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/entity/${entity.uuid}`)}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-semibold text-primary">
                {getInitials(entity.name)}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg truncate">
                {entity.name}
              </h3>
              <Badge
                variant="secondary"
                className={getEntityTypeColor(entityType)}
              >
                {entityType}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {entity.summary}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
