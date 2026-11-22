import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/** Test cards — mirrors how a real gateway sandbox behaves. */
const ALWAYS_SUCCEEDS = '4242424242424242';
const ALWAYS_DECLINES = '4000000000000002';
const INSUFFICIENT_FUNDS = '4000000000009995';

type Body = {
  method: 'card' | 'upi' | 'cod';
  amount: number;
  card?: { number: string; name: string; expiry: string; cvc: string };
  upiId?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { method, amount } = body;

  if (!amount || amount <= 0) {
    return NextResponse.json({ ok: false, message: 'Invalid amount.' }, { status: 400 });
  }

  // Simulated processing time.
  await new Promise((r) => setTimeout(r, 1400));

  if (method === 'cod') {
    return NextResponse.json({
      ok: true,
      status: 'pending',
      reference: ref('COD'),
      message: 'Cash on delivery confirmed. Please keep the exact amount ready.',
    });
  }

  if (method === 'upi') {
    const id = (body.upiId ?? '').trim();
    if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(id)) {
      return NextResponse.json(
        { ok: false, status: 'failed', message: 'That UPI ID does not look right — try name@bank.' },
        { status: 402 }
      );
    }
    if (id.toLowerCase().startsWith('fail@')) {
      return NextResponse.json(
        { ok: false, status: 'failed', message: 'The UPI request was declined by the issuing bank.' },
        { status: 402 }
      );
    }
    return NextResponse.json({
      ok: true,
      status: 'paid',
      reference: ref('UPI'),
      message: 'UPI payment collected successfully.',
    });
  }

  const card = body.card;
  const digits = (card?.number ?? '').replace(/\D/g, '');

  if (digits.length < 13 || !luhn(digits)) {
    return NextResponse.json(
      { ok: false, status: 'failed', message: 'That card number is not valid. Check the digits and try again.' },
      { status: 402 }
    );
  }
  if (!/^\d{2}\s*\/\s*\d{2}$/.test(card?.expiry ?? '')) {
    return NextResponse.json(
      { ok: false, status: 'failed', message: 'Expiry must be in MM/YY format.' },
      { status: 402 }
    );
  }
  if (!/^\d{3,4}$/.test(card?.cvc ?? '')) {
    return NextResponse.json(
      { ok: false, status: 'failed', message: 'The security code must be 3 or 4 digits.' },
      { status: 402 }
    );
  }
  if (digits === ALWAYS_DECLINES) {
    return NextResponse.json(
      { ok: false, status: 'failed', message: 'Your card was declined by the issuing bank.' },
      { status: 402 }
    );
  }
  if (digits === INSUFFICIENT_FUNDS) {
    return NextResponse.json(
      { ok: false, status: 'failed', message: 'Declined — insufficient funds.' },
      { status: 402 }
    );
  }

  return NextResponse.json({
    ok: true,
    status: 'paid',
    reference: ref('PAY'),
    brand: brandOf(digits),
    last4: digits.slice(-4),
    message:
      digits === ALWAYS_SUCCEEDS
        ? 'Test payment approved.'
        : 'Payment approved.',
  });
}

function ref(prefix: string) {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${prefix}_${rand}`;
}

function brandOf(d: string) {
  if (/^4/.test(d)) return 'Visa';
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return 'Mastercard';
  if (/^3[47]/.test(d)) return 'Amex';
  if (/^6/.test(d)) return 'Discover';
  return 'Card';
}

function luhn(d: string) {
  let sum = 0;
  let double = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}
