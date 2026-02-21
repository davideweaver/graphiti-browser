import { toast } from "@/hooks/use-toast";
import type {
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
} from "@/types/notifications";

class NotificationsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_XERRO_SERVICE_URL || "";
    if (!this.baseUrl) {
      console.warn(
        "VITE_XERRO_SERVICE_URL not configured. Notifications may not work."
      );
    }
  }

  async listNotifications(params?: {
    read?: boolean;
    limit?: number;
    offset?: number;
    since?: string;
  }): Promise<NotificationListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.read !== undefined) {
        queryParams.append("read", String(params.read));
      }
      if (params?.limit) {
        queryParams.append("limit", String(params.limit));
      }
      if (params?.offset) {
        queryParams.append("offset", String(params.offset));
      }
      if (params?.since) {
        queryParams.append("since", params.since);
      }

      const url = `${this.baseUrl}/api/v1/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch notifications: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch notifications";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async getNotification(id: string): Promise<Notification> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/notifications/${id}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch notification: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch notification";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async markAsRead(id: string): Promise<Notification> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/notifications/${id}/read`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to mark notification as read: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to mark notification as read";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async markAllAsRead(): Promise<{ success: boolean; count: number }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/notifications/read-all`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to mark all as read: ${response.statusText}`
        );
      }

      const result = await response.json();

      if (result.count > 0) {
        toast({
          title: "All notifications marked as read",
          description: `${result.count} notification${result.count !== 1 ? "s" : ""} marked as read`,
        });
      }

      return result;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to mark all as read";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async getUnreadCount(): Promise<UnreadCountResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/notifications/unread-count`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch unread count: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch unread count";
      // Don't show toast for unread count errors (used for badges)
      console.error(message);
      throw error;
    }
  }
}

export const notificationsService = new NotificationsService();
