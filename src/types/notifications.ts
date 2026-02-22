export interface Notification {
  id: string;
  title: string;
  body: string;
  target?: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  limit: number;
  offset: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface NotificationCreatedEvent {
  notification: Notification;
  id: string;
  unreadCount: number;
  timestamp: string;
}

export interface NotificationReadEvent {
  notification: Notification;
  id: string;
  unreadCount: number;
  timestamp: string;
}

export interface NotificationsReadAllEvent {
  unreadCount: number;
  timestamp: string;
}
