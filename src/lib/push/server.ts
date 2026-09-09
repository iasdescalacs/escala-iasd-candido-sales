import "server-only";

import webPush, { type PushSubscription } from "web-push";
import { getWebPushEnv, hasWebPushEnv } from "@/lib/push/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;
type NotificationMetadata = Record<string, Json | undefined>;

export type PushNotificationInput = {
  body: string;
  metadata?: NotificationMetadata;
  title: string;
  userId: string;
};

type PushSubscriptionRow = Pick<
  Database["public"]["Tables"]["push_subscriptions"]["Row"],
  "auth" | "endpoint" | "id" | "p256dh" | "user_id"
>;

export async function createNotificationsWithPush(
  admin: AdminClient,
  notifications: PushNotificationInput[],
) {
  if (notifications.length === 0) {
    return;
  }

  const { data } = await admin
    .from("notifications")
    .insert(
      notifications.map((notification) => ({
        body: notification.body,
        metadata: notification.metadata ?? {},
        title: notification.title,
        user_id: notification.userId,
      })),
    )
    .select("id,user_id,title,body,metadata");

  if (!data || data.length === 0) {
    return;
  }

  await sendPushNotifications(
    admin,
    data.map((notification) => ({
      body: notification.body,
      metadata: notification.metadata as NotificationMetadata,
      notificationId: notification.id,
      title: notification.title,
      userId: notification.user_id,
    })),
  );
}

async function sendPushNotifications(
  admin: AdminClient,
  notifications: Array<PushNotificationInput & { notificationId: string }>,
) {
  if (!hasWebPushEnv()) {
    return;
  }

  const { vapidPrivateKey, vapidPublicKey, vapidSubject } = getWebPushEnv();
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const userIds = Array.from(new Set(notifications.map((notification) => notification.userId)));
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id,user_id,endpoint,p256dh,auth")
    .in("user_id", userIds)
    .eq("enabled", true)
    .is("deleted_at", null);

  if (!subscriptions || subscriptions.length === 0) {
    return;
  }

  await Promise.allSettled(
    notifications.flatMap((notification) =>
      (subscriptions as PushSubscriptionRow[])
        .filter((subscription) => subscription.user_id === notification.userId)
        .map((subscription) => sendToSubscription(admin, subscription, notification)),
    ),
  );
}

async function sendToSubscription(
  admin: AdminClient,
  subscription: PushSubscriptionRow,
  notification: PushNotificationInput & { notificationId: string },
) {
  const payload = JSON.stringify({
    body: notification.body,
    data: {
      notificationId: notification.notificationId,
      url: getNotificationUrl(notification.metadata),
    },
    icon: "/icons/icon.svg",
    tag: notification.notificationId,
    title: notification.title,
  });

  try {
    await webPush.sendNotification(toWebPushSubscription(subscription), payload);
    await admin
      .from("push_subscriptions")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", subscription.id);
  } catch (error) {
    const statusCode = getWebPushStatusCode(error);

    if (statusCode === 404 || statusCode === 410) {
      await admin
        .from("push_subscriptions")
        .update({
          deleted_at: new Date().toISOString(),
          enabled: false,
        })
        .eq("id", subscription.id);
    }
  }
}

function toWebPushSubscription(subscription: PushSubscriptionRow): PushSubscription {
  return {
    endpoint: subscription.endpoint,
    keys: {
      auth: subscription.auth,
      p256dh: subscription.p256dh,
    },
  };
}

function getNotificationUrl(metadata: NotificationMetadata | undefined) {
  if (!metadata) {
    return "/agenda";
  }

  if (metadata.userId || metadata.requestedRoleKeys) {
    return "/painel";
  }

  return "/agenda";
}

function getWebPushStatusCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return error.statusCode;
  }

  return null;
}
