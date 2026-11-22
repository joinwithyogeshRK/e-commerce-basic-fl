import { NextResponse } from 'next/server';
import {
  adminAlertEmail,
  orderConfirmationEmail,
  paymentReceiptEmail,
  shippingUpdateEmail,
  welcomeEmail,
} from '@/lib/email/templates';
import type { MailMessage, Order } from '@/lib/types';

export const runtime = 'nodejs';

type Body =
  | { kind: 'order_confirmation' | 'payment_receipt' | 'shipping_update' | 'admin_alert'; order: Order }
  | { kind: 'welcome'; email: string };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  let to: string;
  let built: { subject: string; preheader: string; html: string };

  switch (body.kind) {
    case 'order_confirmation':
      built = orderConfirmationEmail(body.order);
      to = body.order.address.email;
      break;
    case 'payment_receipt':
      built = paymentReceiptEmail(body.order);
      to = body.order.address.email;
      break;
    case 'shipping_update':
      built = shippingUpdateEmail(body.order);
      to = body.order.address.email;
      break;
    case 'admin_alert':
      built = adminAlertEmail(body.order);
      to = 'ops@atlasandoak.com';
      break;
    case 'welcome':
      built = welcomeEmail(body.email);
      to = body.email;
      break;
    default:
      return NextResponse.json({ error: 'Unknown email kind' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  let provider: MailMessage['provider'] = 'simulated';
  let deliveryNote = 'Delivered to the in-app outbox (no mail provider configured).';

  if (apiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.MAIL_FROM ?? 'Atlas & Oak <onboarding@resend.dev>',
          to: [to],
          subject: built.subject,
          html: built.html,
        }),
      });
      if (res.ok) {
        provider = 'resend';
        deliveryNote = `Sent for real via Resend to ${to}.`;
      } else {
        deliveryNote = `Resend rejected the message (${res.status}); kept in the outbox instead.`;
      }
    } catch {
      deliveryNote = 'Mail provider unreachable; kept in the outbox instead.';
    }
  }

  const message: MailMessage = {
    id: `mail_${Math.random().toString(36).slice(2, 10)}`,
    to,
    subject: built.subject,
    preheader: built.preheader,
    html: built.html,
    kind: body.kind,
    sentAt: new Date().toISOString(),
    provider,
  };

  return NextResponse.json({ ok: true, message, deliveryNote });
}
