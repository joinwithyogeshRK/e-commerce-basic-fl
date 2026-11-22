import { Star } from 'lucide-react';

export default function Rating({ value, count, size = 13 }: { value: number; count?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            size={size}
            className={i < Math.round(value) ? 'fill-clay text-clay' : 'text-line-strong'}
          />
        ))}
      </span>
      <span className="text-[12px] text-ink-muted">
        {value.toFixed(1)}
        {count !== undefined && ` (${count})`}
      </span>
    </span>
  );
}
