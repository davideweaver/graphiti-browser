import type { Notification } from "@/types/notifications";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";

interface NotificationCardProps {
  notification: Notification;
  onClick?: () => void;
}

export function NotificationCard({ notification, onClick }: NotificationCardProps) {
  const isUnread = !notification.read;

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all cursor-pointer group border-l-4",
        isUnread
          ? "bg-blue-500/5 border-l-blue-500"
          : "border-l-transparent"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header with icon and status */}
        <div className="flex items-start gap-3 mb-2">
          <div className={cn(
            "mt-0.5 p-2 rounded-full",
            isUnread
              ? "bg-blue-500/10"
              : "bg-muted"
          )}>
            <Bell className={cn(
              "h-4 w-4",
              isUnread
                ? "text-blue-600 dark:text-blue-400"
                : "text-muted-foreground"
            )} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className={cn(
                "text-sm font-medium",
                isUnread && "font-semibold"
              )}>
                {notification.title}
              </h3>
              {isUnread && (
                <Badge
                  variant="default"
                  className="bg-blue-500 text-white text-xs py-0 px-2 flex-shrink-0"
                >
                  NEW
                </Badge>
              )}
            </div>

            {/* Body */}
            <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">
              {notification.body}
            </p>

            {/* Metadata row */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {format(new Date(notification.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </span>
              {notification.read && notification.readAt && (
                <>
                  <span>•</span>
                  <span>
                    Read {format(new Date(notification.readAt), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
