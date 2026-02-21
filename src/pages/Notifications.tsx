import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import Container from "@/components/container/Container";
import { ContainerToolButton } from "@/components/container/ContainerToolButton";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { notificationsService } from "@/api/notificationsService";
import type {
  Notification,
  NotificationCreatedEvent,
  NotificationReadEvent,
  NotificationsReadAllEvent,
} from "@/types/notifications";
import { CheckCheck, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Notifications() {
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  // Fetch notifications
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["notifications", filter],
    queryFn: () =>
      notificationsService.listNotifications({
        read: filter === "unread" ? false : undefined,
        limit: 100,
      }),
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: (updatedNotification) => {
      // Update the notification in the cache
      queryClient.setQueryData<typeof data>(
        ["notifications", filter],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            notifications: old.notifications.map((n) =>
              n.id === updatedNotification.id ? updatedNotification : n
            ),
          };
        }
      );
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      // Refetch to get updated state
      refetch();
    },
  });

  // Setup Socket.IO connection
  useEffect(() => {
    const baseUrl = import.meta.env.VITE_XERRO_SERVICE_URL || "http://localhost:9205";
    const socketInstance = io(baseUrl, {
      path: "/ws",
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("✅ Connected to notification service");
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ Disconnected from notification service");
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    // Listen for notification events
    socketInstance.on("notification-created", (eventData: NotificationCreatedEvent) => {
      console.log("📨 New notification:", eventData);

      // Add to cache if it matches current filter
      if (filter === "all" || filter === "unread") {
        queryClient.setQueryData<typeof data>(
          ["notifications", filter],
          (old) => {
            if (!old) return old;
            return {
              ...old,
              notifications: [eventData.notification, ...old.notifications],
              total: old.total + 1,
            };
          }
        );
      }

      // Show toast for new notifications
      toast({
        title: eventData.notification.title,
        description: eventData.notification.body.slice(0, 100) + (eventData.notification.body.length > 100 ? "..." : ""),
      });
    });

    socketInstance.on("notification-read", (eventData: NotificationReadEvent) => {
      console.log("📖 Notification marked as read:", eventData);

      // Update in cache
      queryClient.setQueryData<typeof data>(
        ["notifications", filter],
        (old) => {
          if (!old) return old;

          // If filtering by unread, remove it
          if (filter === "unread") {
            return {
              ...old,
              notifications: old.notifications.filter((n) => n.id !== eventData.id),
              total: old.total - 1,
            };
          }

          // Otherwise update it
          return {
            ...old,
            notifications: old.notifications.map((n) =>
              n.id === eventData.id ? eventData.notification : n
            ),
          };
        }
      );
    });

    socketInstance.on("notifications-read-all", (eventData: NotificationsReadAllEvent) => {
      console.log("✅ All notifications marked as read:", eventData);

      // Refetch to get updated state
      refetch();
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [filter, queryClient, refetch]);

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        markAsReadMutation.mutate(notification.id);
      }
    },
    [markAsReadMutation]
  );

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const unreadCount = data?.notifications.filter((n) => !n.read).length ?? 0;

  return (
    <Container
      title="Notifications"
      description={
        data
          ? `${data.total} total notification${data.total !== 1 ? "s" : ""}${unreadCount > 0 ? ` • ${unreadCount} unread` : ""}`
          : undefined
      }
      tools={
        <div className="flex items-center gap-2 border-2 border-red-500">
          <Button variant="destructive" size="sm">
            TEST BUTTON
          </Button>
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
            {filter === "all" && data && (
              <Badge variant="secondary" className="ml-2">
                {data.total}
              </Badge>
            )}
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            Unread
            {filter === "unread" && data && (
              <Badge variant="secondary" className="ml-2">
                {data.total}
              </Badge>
            )}
          </Button>
          <ContainerToolButton
            size="icon"
            onClick={() => refetch()}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </ContainerToolButton>
        </div>
      }
    >
      {/* Mark all as read action */}
      {unreadCount > 0 && (
        <div className="mb-4">
          <ContainerToolButton
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </ContainerToolButton>
        </div>
      )}

      {/* Connection status */}
      {socket && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm">
            <div
              className={`h-2 w-2 rounded-full ${
                socket.connected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-muted-foreground">
              {socket.connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading notifications...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load notifications
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !error && data && data.notifications.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-muted-foreground">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && data && data.notifications.length > 0 && (
        <div className="space-y-3">
          {data.notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onClick={() => handleNotificationClick(notification)}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
