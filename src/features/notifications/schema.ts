export type NotificationPriority = "low" | "normal" | "high";
export type NotificationType = "system" | "message" | "comment" | "billing" | "security";

export type CreateNotificationInput = {
  user_id: string;
  title: string;
  body?: string | null;
  link?: string | null;
  type?: NotificationType;
  data?: Record<string, unknown>;
  priority?: NotificationPriority;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  link: string | null;
  type: NotificationType;
  data: Record<string, unknown>;
  priority: NotificationPriority;
  seen_at: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
};
