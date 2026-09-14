import { useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

import {
  fetchMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToNotifications,
} from "../services/notifications.service";

export function useNotifications() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", profile?.id],
    queryFn: () => fetchMyNotifications(profile!.id),
    enabled: Boolean(profile?.id),
  });

  useEffect(() => {
    if (!profile?.id) return;

    const unsubscribe = subscribeToNotifications(
      profile.id,
      () => {
        queryClient.invalidateQueries({
          queryKey: ["notifications", profile.id],
        });
      }
    );

    return unsubscribe;
  }, [profile?.id, queryClient]);

  return query;
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationAsRead(notificationId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(profile!.id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
    },
  });
}