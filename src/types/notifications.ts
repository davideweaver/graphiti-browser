export interface Notification {
  id: string;
  message: string;              // Was: title
  context?: string;             // Was: body (optional, max 8000 chars)
  source?: string;              // NEW (optional, max 100 chars)
  workingDirectory?: string;    // NEW (optional, max 500 chars)
  sessionId?: string;           // NEW (optional, max 100 chars)
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

export interface DirectMessageResponse {
  success: boolean;
  channelId: string;
  parentTs: string;
  threadTs: string;
  threadUrl: string;
}
