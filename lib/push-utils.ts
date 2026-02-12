export async function sendPushNotification({
  title,
  message,
  excludeUserId,
  includeUserId
}: {
  title: string;
  message: string;
  excludeUserId?: string;
  includeUserId?: string;
}) {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    return 0;
  }

  const { default: webpush } = await import('web-push');
  const { createAdminSupabaseClient } = await import('@/lib/supabase-server');

  const vapidSubject =
    subject.startsWith('mailto:') || subject.startsWith('https://') || subject.startsWith('http://')
      ? subject
      : `mailto:${subject}`;
  webpush.setVapidDetails(vapidSubject, publicKey, privateKey);
  const supabase = createAdminSupabaseClient();

  let query = supabase.from('push_subscriptions').select('*');
  if (includeUserId) {
    query = query.eq('user_id', includeUserId);
  }
  if (excludeUserId) {
    query = query.neq('user_id', excludeUserId);
  }

  const { data: subscriptions } = await query;

  const payload = JSON.stringify({
    title,
    body: message,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png'
  });

  const results = await Promise.allSettled(
    (subscriptions || []).map((sub: any) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        },
        payload
      )
    )
  );

  const fulfilled = results.filter((r) => r.status === 'fulfilled').length;
  const staleEndpoints: string[] = [];

  results.forEach((r, idx) => {
    if (r.status !== 'rejected') return;
    const reason: any = r.reason;
    const statusCode = reason?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      const endpoint = (subscriptions || [])[idx]?.endpoint;
      if (endpoint) staleEndpoints.push(endpoint);
    }
  });

  if (staleEndpoints.length) {
    await supabase.from('push_subscriptions').delete().in('endpoint', staleEndpoints);
  }

  return fulfilled;
}
