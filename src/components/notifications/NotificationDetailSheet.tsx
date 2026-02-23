import type { Notification } from "@/types/notifications";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SidePanelHeader } from "@/components/shared/SidePanelHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { Clock, CheckCircle2, MessageSquare, FolderOpen, Activity } from "lucide-react";

interface NotificationDetailSheetProps {
  notification: Notification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationDetailSheet({
  notification,
  open,
  onOpenChange,
}: NotificationDetailSheetProps) {
  if (!notification) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SidePanelHeader
          title={notification.message}
          description={
            notification.read ? (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Read {formatDistanceToNow(new Date(notification.readAt!), { addSuffix: true })}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-blue-500">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                Unread
              </span>
            )
          }
        />

        <div className="space-y-4 mt-6">
          {/* Context Card */}
          {notification.context && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm font-medium text-muted-foreground">Context</div>
                </div>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {notification.context}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Created timestamp */}
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Created
                  </div>
                  <div className="text-sm">
                    {format(new Date(notification.createdAt), "PPpp")}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>

              {/* Source */}
              {notification.source && (
                <div className="flex items-start gap-3">
                  <Activity className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Source
                    </div>
                    <Badge variant="secondary">{notification.source}</Badge>
                  </div>
                </div>
              )}

              {/* Working Directory */}
              {notification.workingDirectory && (
                <div className="flex items-start gap-3">
                  <FolderOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Working Directory
                    </div>
                    <div className="text-xs font-mono bg-accent/50 px-2 py-1 rounded break-all">
                      {notification.workingDirectory}
                    </div>
                  </div>
                </div>
              )}

              {/* Session ID */}
              {notification.sessionId && (
                <div className="flex items-start gap-3">
                  <div className="h-4 w-4 mt-0.5" /> {/* Spacer for alignment */}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Session ID
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {notification.sessionId}
                    </div>
                  </div>
                </div>
              )}

              {/* Notification ID */}
              <div className="flex items-start gap-3 pt-3 border-t">
                <div className="h-4 w-4 mt-0.5" /> {/* Spacer for alignment */}
                <div className="flex-1">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Notification ID
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {notification.id}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
