import "server-only";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

export function hasWebPushEnv() {
  return Boolean(vapidPublicKey && vapidPrivateKey && vapidSubject);
}

export function getWebPushEnv() {
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    throw new Error(
      "Configure NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY e VAPID_SUBJECT.",
    );
  }

  return {
    vapidPrivateKey,
    vapidPublicKey,
    vapidSubject,
  };
}
