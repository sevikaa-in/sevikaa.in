import { queryDb } from '@/lib/db';

export interface NotificationLogOptions {
  channel: 'sms' | 'email';
  provider: 'msg91' | 'aws_ses' | string;
  recipient: string;
  template_id?: string;
  message_id?: string;
  status?: 'submitted' | 'delivered' | 'failed' | 'bounced' | string;
  description?: string;
  raw_payload?: any;
}

export async function logNotificationDispatch(options: NotificationLogOptions) {
  try {
    const {
      channel = 'sms',
      provider = 'msg91',
      recipient,
      template_id = 'DEFAULT',
      message_id,
      status = 'submitted',
      description = 'Notification dispatched',
      raw_payload
    } = options;

    // notification_logs table managed via migrations — no runtime DDL

    await queryDb(`
      INSERT INTO public.notification_logs (channel, provider, recipient, template_id, message_id, status, description, raw_payload, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [
      channel, provider, recipient,
      template_id, message_id, status, description,
      raw_payload ? JSON.stringify(raw_payload) : null
    ]);
  } catch (err) {
    console.warn("Notice logging notification dispatch:", err);
  }
}
