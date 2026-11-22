import type { Order } from '../types';
import { money } from '../format';

const SHELL = (title: string, preheader: string, body: string) => `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${title}</title></head>
<body style="margin:0;background:#f3efe8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#15140f">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe8;padding:28px 12px">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e3d9">
    <tr><td style="padding:26px 30px;border-bottom:1px solid #f0ece3">
      <div style="font-size:15px;letter-spacing:.16em;text-transform:uppercase;font-weight:600">Atlas &amp; Oak</div>
    </td></tr>
    <tr><td style="padding:30px">${body}</td></tr>
    <tr><td style="padding:22px 30px;background:#faf8f4;border-top:1px solid #f0ece3;font-size:12px;color:#757065;line-height:1.6">
      Atlas &amp; Oak · 22 Nieuwstraat, Antwerp<br>
      Questions? Reply to this email and a person will answer.<br>
      <span style="color:#a39c8d">This is a demo store — no real payment was taken and no goods will ship.</span>
    </td></tr>
  </table>
</td></tr></table></body></html>`;

const itemRows = (order: Order) =>
  order.items
    .map(
      (l) => `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #f2eee6">
        <div style="font-size:14px;font-weight:600">${escapeHtml(l.name)}</div>
        <div style="font-size:12px;color:#757065;margin-top:3px">${escapeHtml(l.color)} · Size ${escapeHtml(
        l.size
      )} · Qty ${l.qty}</div>
      </td>
      <td align="right" style="padding:10px 0;border-bottom:1px solid #f2eee6;font-size:14px;white-space:nowrap">${money(
        l.price * l.qty
      )}</td>
    </tr>`
    )
    .join('');

const totalsBlock = (order: Order) => {
  const t = order.totals;
  const row = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:5px 0;font-size:${bold ? 15 : 13}px;${
      bold ? 'font-weight:700;' : 'color:#757065;'
    }">${label}</td><td align="right" style="padding:5px 0;font-size:${bold ? 15 : 13}px;${
      bold ? 'font-weight:700;' : ''
    }">${value}</td></tr>`;
  return `<table role="presentation" width="100%" style="margin-top:14px">
    ${row('Subtotal', money(t.subtotal))}
    ${t.discount > 0 ? row(`Discount${order.coupon ? ` (${order.coupon})` : ''}`, `−${money(t.discount)}`) : ''}
    ${row(`Shipping — ${escapeHtml(order.shippingMethod.label)}`, t.shipping === 0 ? 'Free' : money(t.shipping))}
    ${row('Tax', money(t.tax))}
    <tr><td colspan="2" style="padding-top:8px;border-top:1px solid #e8e3d9"></td></tr>
    ${row('Total paid', money(t.total), true)}
  </table>`;
};

const addressBlock = (order: Order) => `
  <div style="margin-top:22px;padding:16px;background:#faf8f4;border-radius:12px">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:#757065;margin-bottom:8px">Shipping to</div>
    <div style="font-size:13px;line-height:1.6">
      ${escapeHtml(order.address.fullName)}<br>
      ${escapeHtml(order.address.line1)}${order.address.line2 ? `<br>${escapeHtml(order.address.line2)}` : ''}<br>
      ${escapeHtml(order.address.city)}, ${escapeHtml(order.address.state)} ${escapeHtml(order.address.postalCode)}<br>
      ${escapeHtml(order.address.country)}
    </div>
  </div>`;

export function orderConfirmationEmail(order: Order) {
  const body = `
    <h1 style="margin:0 0 6px;font-size:23px;line-height:1.25">Thank you, ${escapeHtml(
      order.address.fullName.split(' ')[0]
    )} — your order is placed.</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#575349;line-height:1.65">
      We have your order <strong>${order.id}</strong> and payment is confirmed.
      Estimated delivery is <strong>${new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })}</strong> via ${escapeHtml(order.shippingMethod.label)}.
    </p>
    <table role="presentation" width="100%">${itemRows(order)}</table>
    ${totalsBlock(order)}
    ${addressBlock(order)}
    <p style="margin:24px 0 0;font-size:13px;color:#757065">
      We will email you again the moment it ships.
    </p>`;
  return {
    subject: `Order ${order.id} confirmed`,
    preheader: `Arriving around ${new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    })} · ${money(order.totals.total)}`,
    html: SHELL(`Order ${order.id} confirmed`, 'Your Atlas & Oak order is confirmed', body),
  };
}

export function paymentReceiptEmail(order: Order) {
  const method =
    order.payment.method === 'card'
      ? `${order.payment.brand ?? 'Card'} ending ${order.payment.last4}`
      : order.payment.method === 'upi'
        ? 'UPI'
        : 'Cash on delivery';
  const body = `
    <h1 style="margin:0 0 6px;font-size:23px;line-height:1.25">Payment ${
      order.payment.status === 'paid' ? 'successful' : 'pending'
    }</h1>
    <p style="margin:0 0 18px;font-size:14px;color:#575349;line-height:1.65">
      ${
        order.payment.status === 'paid'
          ? `We received ${money(order.totals.total)} for order ${order.id}.`
          : `Order ${order.id} is confirmed. You will pay ${money(order.totals.total)} on delivery.`
      }
    </p>
    <table role="presentation" width="100%" style="background:#faf8f4;border-radius:12px">
      <tr><td style="padding:16px">
        <table role="presentation" width="100%">
          <tr><td style="font-size:13px;color:#757065;padding:4px 0">Payment method</td><td align="right" style="font-size:13px;padding:4px 0">${escapeHtml(
            method
          )}</td></tr>
          <tr><td style="font-size:13px;color:#757065;padding:4px 0">Reference</td><td align="right" style="font-size:13px;padding:4px 0;font-family:ui-monospace,monospace">${escapeHtml(
            order.payment.reference
          )}</td></tr>
          <tr><td style="font-size:13px;color:#757065;padding:4px 0">Amount</td><td align="right" style="font-size:15px;font-weight:700;padding:4px 0">${money(
            order.totals.total
          )}</td></tr>
        </table>
      </td></tr>
    </table>
    <p style="margin:22px 0 0;font-size:13px;color:#757065">Keep this receipt for your records.</p>`;
  return {
    subject: `Payment receipt · ${order.id}`,
    preheader: `${money(order.totals.total)} · ${method}`,
    html: SHELL('Payment receipt', 'Your payment receipt', body),
  };
}

export function shippingUpdateEmail(order: Order) {
  const copy: Record<string, { title: string; line: string }> = {
    confirmed: { title: 'Your order is confirmed', line: 'We are preparing your pieces now.' },
    packed: { title: 'Packed and ready', line: 'Your order is boxed and waiting for the carrier.' },
    shipped: {
      title: 'On its way',
      line: `Your order has left our warehouse. Tracking: <strong>TRK${order.id.replace(/\D/g, '').slice(-9)}</strong>.`,
    },
    delivered: { title: 'Delivered', line: 'Your order was delivered. We hope it fits beautifully.' },
    cancelled: { title: 'Order cancelled', line: 'Your order was cancelled and the payment released.' },
  };
  const c = copy[order.status] ?? { title: 'Order update', line: 'There is an update on your order.' };
  const body = `
    <h1 style="margin:0 0 6px;font-size:23px;line-height:1.25">${c.title}</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#575349;line-height:1.65">
      ${c.line}<br>Order <strong>${order.id}</strong> · ${order.items.length} item${
        order.items.length === 1 ? '' : 's'
      }
    </p>
    <table role="presentation" width="100%">${itemRows(order)}</table>
    ${addressBlock(order)}`;
  return {
    subject: `${c.title} · ${order.id}`,
    preheader: c.line.replace(/<[^>]+>/g, ''),
    html: SHELL(c.title, c.title, body),
  };
}

export function welcomeEmail(email: string) {
  const body = `
    <h1 style="margin:0 0 6px;font-size:23px;line-height:1.25">Welcome to the list.</h1>
    <p style="margin:0 0 18px;font-size:14px;color:#575349;line-height:1.65">
      You are signed up with <strong>${escapeHtml(email)}</strong>. One letter a month, new pieces first,
      and no noise in between.
    </p>
    <div style="padding:18px;background:#faf8f4;border-radius:12px;text-align:center">
      <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#757065">Your welcome code</div>
      <div style="font-size:26px;font-weight:700;letter-spacing:.06em;margin-top:6px">WELCOME10</div>
      <div style="font-size:12px;color:#757065;margin-top:6px">10% off your first order</div>
    </div>`;
  return {
    subject: 'Welcome to Atlas & Oak — here is 10% off',
    preheader: 'Your code WELCOME10 is inside',
    html: SHELL('Welcome to Atlas & Oak', 'Welcome — 10% off inside', body),
  };
}

export function adminAlertEmail(order: Order) {
  const body = `
    <h1 style="margin:0 0 6px;font-size:21px">New order · ${order.id}</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#575349">
      ${escapeHtml(order.address.fullName)} (${escapeHtml(order.address.email)}) placed an order for
      <strong>${money(order.totals.total)}</strong> paid by ${escapeHtml(order.payment.method.toUpperCase())}.
    </p>
    <table role="presentation" width="100%">${itemRows(order)}</table>
    ${totalsBlock(order)}`;
  return {
    subject: `[Ops] New order ${order.id} · ${money(order.totals.total)}`,
    preheader: `${order.items.length} items · ${money(order.totals.total)}`,
    html: SHELL('New order', 'New order received', body),
  };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  );
}
