import { coupons, policies, shippingMethods, sizeGuide } from '../seed';
import { money, moneyShort } from '../format';
import type { Category, Product } from '../types';

export type LiteProduct = Pick<
  Product,
  'id' | 'name' | 'slug' | 'category' | 'subcategory' | 'gender' | 'price' | 'compareAt' | 'sizes' | 'rating' | 'tags' | 'material'
> & { colors: string[]; inStock: boolean };

export type AssistantContext = {
  products: LiteProduct[];
  cart: { name: string; qty: number; price: number; size: string; color: string }[];
  focus?: string[];
  orders: {
    id: string;
    status: string;
    total: number;
    createdAt: string;
    estimatedDelivery: string;
    itemCount: number;
  }[];
};

export type AssistantReply = {
  reply: string;
  suggestions: string[];
  productIds?: string[];
  action?:
    | { type: 'add_to_cart'; productId: string; size?: string }
    | { type: 'navigate'; href: string };
  intent: string;
};

/* ------------------------------------------------------------------ */

const COLOR_WORDS = [
  'black', 'ink', 'noir', 'onyx', 'white', 'chalk', 'ivory', 'cream', 'sand', 'beige', 'navy',
  'blue', 'cobalt', 'green', 'sage', 'olive', 'emerald', 'moss', 'pink', 'rose', 'red', 'crimson',
  'grey', 'gray', 'charcoal', 'brown', 'clay', 'espresso', 'gold', 'steel', 'silver', 'mint',
  'purple', 'orchid', 'gunmetal',
];

const TYPE_WORDS: Record<string, string[]> = {
  Hoodies: ['hoodie', 'hoodies', 'sweatshirt', 'sweater', 'fleece', 'pullover', 'jumper'],
  Outerwear: ['jacket', 'jackets', 'coat', 'outerwear', 'chore', 'field jacket'],
  Shirts: ['shirt', 'shirts', 'oxford', 'poplin', 'button', 'camp shirt'],
  Dresses: ['dress', 'dresses', 'gown', 'midi', 'evening'],
  Sneakers: ['sneaker', 'sneakers', 'trainer', 'trainers', 'shoe', 'shoes', 'runner', 'kicks'],
  'Slip-ons': ['slip on', 'slip-on', 'slipon', 'loafer'],
  Watches: ['watch', 'watches', 'chronograph', 'timepiece'],
};

const CATEGORY_WORDS: Record<Category, string[]> = {
  clothing: ['clothing', 'clothes', 'apparel', 'wear', 'outfit'],
  footwear: ['footwear', 'shoes', 'sneakers', 'trainers', 'boots'],
  accessories: ['accessory', 'accessories', 'watch', 'watches', 'jewellery', 'jewelry'],
};

const has = (t: string, words: string[]) => words.some((w) => t.includes(w));

/* ------------------------------------------------------------------ */

export function runAssistant(message: string, ctx: AssistantContext): AssistantReply {
  const text = ` ${message.toLowerCase().trim()} `;
  const products = ctx.products ?? [];

  /* --- order status ------------------------------------------------ */
  const orderMatch = message.match(/AO-\d{8}-\d{4}/i);
  if (
    orderMatch ||
    has(text, ['where is my order', 'track my order', 'order status', 'my order', 'track order', 'delivery status'])
  ) {
    const order = orderMatch
      ? ctx.orders.find((o) => o.id.toLowerCase() === orderMatch[0].toLowerCase())
      : ctx.orders[0];

    if (!order) {
      return {
        intent: 'order_status',
        reply:
          orderMatch
            ? `I could not find ${orderMatch[0]} on this device. Order history is stored locally in this demo — if you placed it in another browser it will not show up here.`
            : 'I do not see any orders yet on this device. Once you place one I can track it, show the delivery estimate and resend the confirmation email.',
        suggestions: ['Show me bestsellers', 'What is your return policy?', 'How long is delivery?'],
      };
    }

    const eta = new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const stage: Record<string, string> = {
      placed: 'is placed and payment is authorised',
      confirmed: 'is confirmed and being prepared',
      packed: 'is packed and waiting for the carrier',
      shipped: 'has shipped and is with the carrier',
      delivered: 'was delivered',
      cancelled: 'was cancelled',
    };
    return {
      intent: 'order_status',
      reply: `Order **${order.id}** ${stage[order.status] ?? 'is being processed'}. That is ${
        order.itemCount
      } item${order.itemCount === 1 ? '' : 's'} totalling ${money(order.total)}.${
        order.status === 'delivered' || order.status === 'cancelled'
          ? ''
          : ` Estimated delivery is **${eta}**.`
      }`,
      suggestions: ['Open my order', 'Can I return it?', 'Change my delivery address'],
      action: { type: 'navigate', href: `/orders/${order.id}` },
    };
  }

  /* --- add to cart from a reference ---------------------------------- */
  if (has(text, ['add it', 'add that', 'add the', 'add to cart', 'add to bag', 'buy the', 'i will take'])) {
    const target = resolveReference(message, products, ctx.focus ?? []);
    if (target) {
      const size = extractSize(text, target);
      return {
        intent: 'add_to_cart',
        reply: `Added **${target.name}** to your cart${size ? ` in size ${size}` : ''} — ${money(
          target.price
        )}. Want me to take you to checkout?`,
        suggestions: ['Take me to checkout', 'Show me something to pair with it', 'What is the return policy?'],
        productIds: [target.id],
        action: { type: 'add_to_cart', productId: target.id, size },
      };
    }
    return {
      intent: 'add_to_cart',
      reply: 'Happy to — which piece? Name it, or say “show me hoodies” and I will put a few in front of you.',
      suggestions: ['Show me hoodies', 'Show me sneakers', 'Show me watches'],
    };
  }

  /* --- cart ---------------------------------------------------------- */
  if (
    !has(text, ['add ', 'buy ', 'put ']) &&
    has(text, ["what's in my cart", 'whats in my cart', 'my cart', 'my bag', 'cart total', 'view cart'])
  ) {
    if (!ctx.cart.length) {
      return {
        intent: 'cart',
        reply: 'Your cart is empty right now. Tell me what you are after — a hoodie, a jacket, a watch — and I will pull a few options.',
        suggestions: ['Show me hoodies under $150', 'Best gift under $500', 'What is new?'],
      };
    }
    const total = ctx.cart.reduce((n, l) => n + l.price * l.qty, 0);
    const lines = ctx.cart
      .map((l) => `• ${l.qty} × ${l.name} (${l.color}, ${l.size}) — ${money(l.price * l.qty)}`)
      .join('\n');
    return {
      intent: 'cart',
      reply: `You have ${ctx.cart.reduce((n, l) => n + l.qty, 0)} item${
        ctx.cart.length === 1 ? '' : 's'
      } in your cart:\n\n${lines}\n\nSubtotal **${money(total)}**. Shipping is free as standard${
        total >= 300 ? ', and `STYLE20` would take 20% off this order' : ''
      }.`,
      suggestions: ['Take me to checkout', 'Apply a discount code', 'Suggest something to go with this'],
      action: { type: 'navigate', href: '/cart' },
    };
  }

  /* --- checkout ------------------------------------------------------ */
  if (has(text, ['checkout', 'check out', 'place my order', 'pay now', 'complete my order'])) {
    if (!ctx.cart.length) {
      return {
        intent: 'checkout',
        reply: 'There is nothing in your cart yet. Pick something first and I will walk you through checkout — address, shipping, payment, done in three steps.',
        suggestions: ['Show me bestsellers', 'What is on sale?'],
      };
    }
    return {
      intent: 'checkout',
      reply: 'Taking you to checkout. Three steps: delivery address, shipping speed, then payment. You can pay by card, UPI or cash on delivery — and this being a demo, no real money moves. Use card **4242 4242 4242 4242** to see a successful payment.',
      suggestions: ['Which shipping is fastest?', 'Do you have a discount code?'],
      action: { type: 'navigate', href: '/checkout' },
    };
  }

  /* --- coupons ------------------------------------------------------- */
  if (has(text, ['discount', 'coupon', 'promo', 'offer', 'voucher', 'sale code', 'any code'])) {
    const list = coupons.map((c) => `• **${c.code}** — ${c.label}`).join('\n');
    return {
      intent: 'coupon',
      reply: `These are live right now:\n\n${list}\n\nApply one in the cart or at checkout — only one code per order.`,
      suggestions: ['What is on sale?', 'Take me to checkout', 'Show me bestsellers'],
    };
  }

  /* --- sizing -------------------------------------------------------- */
  if (has(text, ['size', 'sizing', 'fit', 'measurement', 'how big', 'true to size', 'size guide'])) {
    const shoe = has(text, ['shoe', 'sneaker', 'trainer', 'footwear', 'uk ']);
    const rows = shoe
      ? sizeGuide.footwear.map((r) => `• ${r.size} — ${r.eu}, ${r.cm}`).join('\n')
      : sizeGuide.clothing.map((r) => `• ${r.size} — chest ${r.chest}, waist ${r.waist}`).join('\n');
    return {
      intent: 'size_help',
      reply: `${
        shoe
          ? 'Our footwear runs true to size, with the Daybreak on a slightly narrower last.'
          : 'Apparel is cut relaxed — if you are between sizes or want a classic fit, size down.'
      }\n\n${rows}\n\nExchanges for a different size are free within 30 days.`,
      suggestions: shoe ? ['Show me sneakers', 'What is your return policy?'] : ['Show me hoodies', 'What is your return policy?'],
    };
  }

  /* --- policies ------------------------------------------------------ */
  if (has(text, ['return', 'refund', 'exchange', 'send it back'])) {
    return {
      intent: 'returns',
      reply: `${policies.returns}\n\n${policies.exchange}`,
      suggestions: ['Track my order', 'How long is delivery?', 'Show me bestsellers'],
    };
  }
  if (has(text, ['shipping', 'delivery', 'how long', 'when will it arrive', 'dispatch', 'courier'])) {
    const rows = shippingMethods
      .map((s) => `• **${s.label}** — ${s.price === 0 ? 'Free' : money(s.price)}, ${s.eta}`)
      .join('\n');
    return {
      intent: 'shipping',
      reply: `${rows}\n\nOrders placed before 2pm dispatch the same day. We ship worldwide and you can use \`FREESHIP\` for free express.`,
      suggestions: ['Track my order', 'What is your return policy?', 'Take me to checkout'],
    };
  }
  if (has(text, ['payment', 'pay ', 'card', 'upi', 'cod', 'cash on delivery', 'visa', 'mastercard'])) {
    return {
      intent: 'payment',
      reply: `${policies.payment}\n\nAt checkout, card **4242 4242 4242 4242** always succeeds and **4000 0000 0000 0002** always declines, so you can try both paths.`,
      suggestions: ['Take me to checkout', 'Is cash on delivery available?', 'Any discount codes?'],
    };
  }
  if (has(text, ['warranty', 'guarantee', 'repair'])) {
    return { intent: 'warranty', reply: policies.warranty, suggestions: ['Show me watches', 'What is your return policy?'] };
  }
  if (has(text, ['material', 'fabric', 'wash', 'care for', 'shrink', 'cotton', 'silk'])) {
    const target = resolveReference(message, products, ctx.focus ?? []);
    if (target) {
      const full = products.find((p) => p.id === target.id);
      return {
        intent: 'care',
        reply: `**${target.name}** is ${full?.material ?? 'made from natural fibres'}. Follow the care label and it will outlast the trend.`,
        suggestions: ['Add it to my cart', 'Show me similar pieces'],
        productIds: [target.id],
      };
    }
    return {
      intent: 'care',
      reply: 'Most of our apparel is organic or long-staple cotton, our dresses are silk or cupro, and footwear uses full-grain leather. Name a piece and I will give you its exact composition and care.',
      suggestions: ['Tell me about the Atlas Hoodie', 'Show me dresses'],
    };
  }
  if (has(text, ['contact', 'human', 'agent', 'speak to', 'phone', 'email you', 'support'])) {
    return {
      intent: 'contact',
      reply: policies.contact,
      suggestions: ['Track my order', 'What is your return policy?'],
    };
  }

  /* --- greetings / identity ----------------------------------------- */
  if (/^\s*(hi|hey|hello|yo|good (morning|afternoon|evening))\b/.test(text) || text.trim().length < 3) {
    return {
      intent: 'greeting',
      reply: 'Hello — I am Ora, the Atlas & Oak assistant. I can find pieces for you, explain sizing, apply a discount, track an order or walk you through checkout. What are you after today?',
      suggestions: ['Show me bestsellers', 'Hoodies under $150', 'Track my order', 'Any discount codes?'],
    };
  }
  if (has(text, ['who are you', 'what can you do', 'help me', 'your name'])) {
    return {
      intent: 'about',
      reply: 'I am Ora. I can search the catalogue by type, colour, size and budget, recommend gifts, add things to your cart, explain sizing and policies, track orders and take you through checkout. Everything here runs on demo data.',
      suggestions: ['Show me bestsellers', 'Gift under $500', 'How does checkout work?'],
    };
  }
  if (has(text, ['thank', 'thanks', 'cheers', 'appreciate'])) {
    return {
      intent: 'thanks',
      reply: 'Any time. Shout if you want a second opinion on sizing or colour.',
      suggestions: ['Show me new arrivals', 'Track my order'],
    };
  }

  /* --- product discovery (the default useful path) ------------------- */
  const found = search(text, products);
  if (found.matched.length) {
    return {
      intent: 'find_product',
      reply: buildSearchReply(found, text),
      suggestions: buildSuggestions(found),
      productIds: found.matched.slice(0, 4).map((p) => p.id),
    };
  }

  if (found.filtersUsed) {
    return {
      intent: 'find_product_empty',
      reply: `Nothing matches ${describeFilters(found)} right now. Widen the budget or try another colour — or tell me the occasion and I will pick.`,
      suggestions: ['Show me bestsellers', 'What is on sale?', 'Show me everything under $200'],
    };
  }

  /* --- fallback ------------------------------------------------------ */
  return {
    intent: 'fallback',
    reply: 'I did not quite catch that. I can help with finding pieces, sizing, discounts, delivery, returns, order tracking and checkout — try one of these:',
    suggestions: ['Show me bestsellers', 'Hoodies under $150', 'What is your return policy?', 'Track my order'],
  };
}

/* ------------------------------------------------------------------ */

type SearchResult = {
  matched: LiteProduct[];
  category?: Category;
  type?: string;
  color?: string;
  gender?: 'men' | 'women';
  max?: number;
  min?: number;
  sale: boolean;
  gift: boolean;
  isNew: boolean;
  best: boolean;
  filtersUsed: boolean;
};

function search(text: string, products: LiteProduct[]): SearchResult {
  let type: string | undefined;
  for (const [key, words] of Object.entries(TYPE_WORDS)) if (has(text, words)) type = key;

  let category: Category | undefined;
  for (const [key, words] of Object.entries(CATEGORY_WORDS))
    if (has(text, words)) category = key as Category;
  if (type && !category) {
    category = ['Sneakers', 'Slip-ons'].includes(type)
      ? 'footwear'
      : type === 'Watches'
        ? 'accessories'
        : 'clothing';
  }

  const color = COLOR_WORDS.find((c) => text.includes(` ${c}`));
  const gender = has(text, [" men", "men's", ' male', ' him', ' his ', ' guys'])
    ? ('men' as const)
    : has(text, [' women', "women's", ' female', ' her ', ' ladies'])
      ? ('women' as const)
      : undefined;

  const under = text.match(/(?:under|below|less than|max|up to|cheaper than)\s*\$?\s*(\d+)/);
  const over = text.match(/(?:over|above|more than|at least|from)\s*\$?\s*(\d+)/);
  const between = text.match(/\$?\s*(\d+)\s*(?:-|to|and)\s*\$?\s*(\d+)/);

  let max = under ? Number(under[1]) : undefined;
  let min = over ? Number(over[1]) : undefined;
  if (between) {
    min = Number(between[1]);
    max = Number(between[2]);
  }

  const sale = has(text, ['sale', 'discount', 'deal', 'reduced', 'cheap', 'budget', 'affordable']);
  const gift = has(text, ['gift', 'present', 'birthday', 'anniversary', 'christmas']);
  const isNew = has(text, ['new', 'latest', 'arrival', 'just in', 'recent']);
  const best = has(text, ['best', 'popular', 'top', 'recommend', 'favourite', 'favorite', 'bestseller', 'what should i']);

  let matched = products.filter((p) => {
    if (category && p.category !== category) return false;
    if (type && p.subcategory !== type) return false;
    if (color && !p.colors.some((c) => c.toLowerCase().includes(color))) return false;
    if (gender && p.gender !== gender && p.gender !== 'unisex') return false;
    if (max !== undefined && p.price > max) return false;
    if (min !== undefined && p.price < min) return false;
    if (sale && !p.compareAt) return false;
    return true;
  });

  if (isNew) matched = [...matched].reverse();
  if (best || gift) matched.sort((a, b) => b.rating - a.rating || b.price - a.price);
  else if (sale || max !== undefined) matched.sort((a, b) => a.price - b.price);
  else matched.sort((a, b) => b.rating - a.rating);

  const filtersUsed = Boolean(
    category || type || color || gender || max !== undefined || min !== undefined || sale
  );

  // A bare "recommend something" should still return results.
  if (!filtersUsed && (best || gift || isNew)) matched = [...products].sort((a, b) => b.rating - a.rating);

  return { matched, category, type, color, gender, max, min, sale, gift, isNew, best, filtersUsed };
}

function describeFilters(r: SearchResult) {
  const bits: string[] = [];
  if (r.color) bits.push(r.color);
  if (r.type) bits.push(r.type.toLowerCase());
  else if (r.category) bits.push(r.category);
  if (r.gender) bits.push(`for ${r.gender}`);
  if (r.max !== undefined) bits.push(`under ${moneyShort(r.max)}`);
  if (r.min !== undefined) bits.push(`over ${moneyShort(r.min)}`);
  if (r.sale) bits.push('on sale');
  return bits.join(' ') || 'that';
}

function buildSearchReply(r: SearchResult, text: string) {
  const n = r.matched.length;
  const shown = Math.min(4, n);
  const cheapest = r.matched.reduce((a, b) => (a.price < b.price ? a : b));
  const lead = r.gift
    ? 'For a gift, these land well —'
    : r.best
      ? 'These are the pieces people keep coming back for —'
      : r.isNew
        ? 'Newest in —'
        : r.sale
          ? 'On sale right now —'
          : `Found ${n} piece${n === 1 ? '' : 's'} matching ${describeFilters(r)} —`;

  const tail =
    n > shown
      ? ` showing the top ${shown}. ${cheapest.name} is the most affordable at ${money(cheapest.price)}.`
      : has(text, ['which', 'what should'])
        ? ` My pick is ${r.matched[0].name}.`
        : '';

  return `${lead}${tail || ` here ${shown === 1 ? 'it is' : 'they are'}.`} Tap a card to open it, or say “add the first one to my cart”.`;
}

function buildSuggestions(r: SearchResult) {
  const out: string[] = [];
  if (r.matched[0]) out.push(`Add the ${r.matched[0].name} to my cart`);
  if (r.category === 'clothing' || r.type === 'Hoodies') out.push('What size should I get?');
  if (!r.sale) out.push('What is on sale?');
  out.push('Any discount codes?');
  return out.slice(0, 4);
}

function resolveReference(message: string, products: LiteProduct[], focus: string[]) {
  const text = message.toLowerCase();

  // Direct name match wins.
  const byName = products
    .map((p) => ({ p, score: nameScore(text, p.name) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)[0];
  if (byName) return byName.p;

  // Otherwise fall back to the last set of products shown.
  const pool = focus.map((id) => products.find((p) => p.id === id)).filter(Boolean) as LiteProduct[];
  if (!pool.length) return undefined;
  if (/\bsecond|2nd\b/.test(text)) return pool[1] ?? pool[0];
  if (/\bthird|3rd\b/.test(text)) return pool[2] ?? pool[0];
  if (/\blast\b/.test(text)) return pool[pool.length - 1];
  return pool[0];
}

function nameScore(text: string, name: string) {
  const words = name
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['the', 'with'].includes(w));
  const hits = words.filter((w) => text.includes(w)).length;
  return hits === 0 ? 0 : hits / words.length;
}

function extractSize(text: string, p: LiteProduct) {
  const uk = text.match(/uk\s*(\d{1,2})/);
  if (uk) {
    const want = `UK ${uk[1]}`;
    if (p.sizes.includes(want)) return want;
  }
  const apparel = text.match(/\b(size\s+)?(xs|s|m|l|xl|xxl)\b/);
  if (apparel) {
    const want = apparel[2].toUpperCase();
    if (p.sizes.includes(want)) return want;
  }
  return undefined;
}

export const starterPrompts = [
  'Show me bestsellers',
  'Hoodies under $150',
  'A gift under $500',
  'What is your return policy?',
];
