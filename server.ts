import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import nodemailer from 'nodemailer';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const RECIPIENT_EMAIL =
  process.env.NOTIFICATION_RECIPIENT_EMAIL?.trim() || 'preetamtejappanavar8@gmail.com';

type NotificationEventType =
  | 'account_registered'
  | 'donor_registered'
  | 'blood_donated'
  | 'blood_requested'
  | 'units_reserved'
  | 'donor_contacted';

interface NotificationLogEntry {
  id: string;
  eventType: NotificationEventType;
  recipient: string;
  subject: string;
  actorName: string;
  actorPhone: string;
  actorEmail: string;
  bloodGroup: string;
  city: string;
  details: string;
  status: 'sent' | 'logged_awaiting_smtp' | 'failed';
  provider: 'smtp' | 'resend' | 'local_log';
  errorReason?: string;
  timestamp: string;
}

const VALID_EVENT_TYPES = new Set<NotificationEventType>([
  'account_registered',
  'donor_registered',
  'blood_donated',
  'blood_requested',
  'units_reserved',
  'donor_contacted',
]);

const notificationLogs: NotificationLogEntry[] = [];
const rateLimitMap = new Map<string, {count: number; resetAt: number}>();

function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, 200);
}

function sanitizeField(value: unknown, maxLen = 300): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim().slice(0, maxLen);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}

function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

async function deliverEmail(params: {
  subject: string;
  textBody: string;
  htmlBody: string;
}): Promise<{status: 'sent' | 'logged_awaiting_smtp' | 'failed'; provider: 'smtp' | 'resend' | 'local_log'; errorReason?: string}> {
  if (isSmtpConfigured()) {
    try {
      const port = Number(process.env.SMTP_PORT || 465);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
        port,
        secure: port === 465,
        auth: {
          user: process.env.SMTP_USER!.trim(),
          pass: process.env.SMTP_PASS!.trim(),
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM?.trim() || `"BloodConnect Alerts" <${process.env.SMTP_USER!.trim()}>`,
        to: RECIPIENT_EMAIL,
        subject: params.subject,
        text: params.textBody,
        html: params.htmlBody,
      });

      return {status: 'sent', provider: 'smtp'};
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'SMTP delivery failed';
      console.error('SMTP notification error:', msg);
      return {status: 'failed', provider: 'smtp', errorReason: msg};
    }
  }

  if (isResendConfigured()) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.SMTP_FROM?.trim() || 'BloodConnect <onboarding@resend.dev>',
          to: [RECIPIENT_EMAIL],
          subject: params.subject,
          text: params.textBody,
          html: params.htmlBody,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        return {
          status: 'failed',
          provider: 'resend',
          errorReason: `Resend HTTP ${res.status}: ${errBody.slice(0, 150)}`,
        };
      }

      return {status: 'sent', provider: 'resend'};
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Resend delivery failed';
      console.error('Resend notification error:', msg);
      return {status: 'failed', provider: 'resend', errorReason: msg};
    }
  }

  return {
    status: 'logged_awaiting_smtp',
    provider: 'local_log',
    errorReason: 'Configure SMTP_USER/SMTP_PASS or RESEND_API_KEY in Secrets for live inbox delivery.',
  };
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({limit: '64kb'}));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      recipientEmail: RECIPIENT_EMAIL,
      emailConfigured: isSmtpConfigured() || isResendConfigured(),
    });
  });

  app.get('/api/notifications/logs', (_req, res) => {
    res.json({
      recipientEmail: RECIPIENT_EMAIL,
      emailConfigured: isSmtpConfigured() || isResendConfigured(),
      logs: notificationLogs.slice(0, 50),
    });
  });

  app.post('/api/notifications/event', async (req, res) => {
    const clientIp = req.ip || 'unknown';
    const now = Date.now();
    const bucket = rateLimitMap.get(clientIp);
    if (!bucket || now > bucket.resetAt) {
      rateLimitMap.set(clientIp, {count: 1, resetAt: now + 60_000});
    } else if (bucket.count >= 30) {
      res.status(429).json({error: 'Too many notification requests. Please wait a minute.'});
      return;
    } else {
      bucket.count += 1;
    }

    const body = req.body ?? {};
    const eventType = body.eventType as NotificationEventType;
    if (!VALID_EVENT_TYPES.has(eventType)) {
      res.status(400).json({error: 'Invalid notification eventType.'});
      return;
    }

    const actorName = sanitizeField(body.actorName, 120);
    if (!actorName) {
      res.status(400).json({error: 'actorName is required.'});
      return;
    }

    const actorPhone = sanitizeField(body.actorPhone, 40);
    const actorEmail = sanitizeField(body.actorEmail, 120);
    const bloodGroup = sanitizeField(body.bloodGroup, 16) || 'Not specified';
    const city = sanitizeField(body.city, 80) || 'India';
    const details = sanitizeField(body.details, 500);
    const title = sanitizeHeader(sanitizeField(body.title, 140) || 'BloodConnect Activity Alert');

    const timestamp = new Date().toISOString();
    const subject = sanitizeHeader(`[BloodConnect] ${title} — ${bloodGroup} (${city})`);

    const textBody = [
      `BloodConnect Portal Notification`,
      `Event: ${title} (${eventType})`,
      `Name: ${actorName}`,
      `Blood Group: ${bloodGroup}`,
      `City: ${city}`,
      actorPhone ? `Phone: ${actorPhone}` : null,
      actorEmail ? `Email: ${actorEmail}` : null,
      details ? `Details: ${details}` : null,
      `Timestamp (UTC): ${timestamp}`,
    ]
      .filter(Boolean)
      .join('\n');

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
        <div style="background: #dc2626; color: #ffffff; padding: 16px 20px;">
          <h2 style="margin: 0; font-size: 18px;">BloodConnect Activity Alert</h2>
          <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">${escapeHtml(title)}</p>
        </div>
        <div style="padding: 20px; color: #0f172a; font-size: 14px; line-height: 1.6;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #64748b;">Person / Requester</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(actorName)}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Blood Group</td><td style="padding: 6px 0; font-weight: 700; color: #b91c1c;">${escapeHtml(bloodGroup)}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Location</td><td style="padding: 6px 0;">${escapeHtml(city)}</td></tr>
            ${actorPhone ? `<tr><td style="padding: 6px 0; color: #64748b;">Phone</td><td style="padding: 6px 0;">${escapeHtml(actorPhone)}</td></tr>` : ''}
            ${actorEmail ? `<tr><td style="padding: 6px 0; color: #64748b;">Email</td><td style="padding: 6px 0;">${escapeHtml(actorEmail)}</td></tr>` : ''}
            <tr><td style="padding: 6px 0; color: #64748b;">Timestamp</td><td style="padding: 6px 0; font-family: monospace;">${escapeHtml(timestamp)}</td></tr>
          </table>
          ${details ? `<div style="margin-top: 14px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px;">${escapeHtml(details)}</div>` : ''}
        </div>
      </div>
    `;

    const delivery = await deliverEmail({subject, textBody, htmlBody});

    const entry: NotificationLogEntry = {
      id: `ntf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventType,
      recipient: RECIPIENT_EMAIL,
      subject,
      actorName,
      actorPhone,
      actorEmail,
      bloodGroup,
      city,
      details,
      status: delivery.status,
      provider: delivery.provider,
      errorReason: delivery.errorReason,
      timestamp,
    };

    notificationLogs.unshift(entry);
    if (notificationLogs.length > 100) {
      notificationLogs.pop();
    }

    res.status(200).json({
      ok: true,
      emailConfigured: isSmtpConfigured() || isResendConfigured(),
      notification: entry,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.use((_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BloodConnect server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start BloodConnect server:', err);
  process.exit(1);
});
