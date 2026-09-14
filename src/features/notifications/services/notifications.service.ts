import { supabase } from "@/lib/supabase";
import type { AppNotification } from "@/types/models";

export async function fetchMyNotifications(
  userId: string
): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data ?? []) as AppNotification[];
}

export async function markNotificationAsRead(
  notificationId: string
) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) throw error;
}

export async function markAllNotificationsAsRead(
  userId: string
) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
}

export function subscribeToNotifications(
  userId: string,
  callback: () => void
) {
  const channelName = `notifications:${userId}`;

  // إزالة أي channel قديم بنفس الاسم
  const existingChannel = supabase.getChannels().find(
    (channel) => channel.topic === `realtime:${channelName}`
  );

  if (existingChannel) {
    void supabase.removeChannel(existingChannel);
  }

  // مهم جدًا:
  // on() قبل subscribe()
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      () => {
        callback();
      }
    )
    .subscribe((status) => {
      console.log(
        `[Notifications Realtime] ${userId}:`,
        status
      );
    });

  // Cleanup
  return () => {
    void supabase.removeChannel(channel);
  };
}