import { formatPrice } from "@/lib/format";

interface PriceProps {
  value: number;
  prefix?: string;
  className?: string;
}

/**
 * A formatted price ("4 500 DA") mixes digits with a Latin unit suffix — under
 * the Unicode Bidi Algorithm inside an RTL (Arabic) ambient direction, the
 * neutral space between those runs lets the browser visually reorder the
 * whole thing ("DA 500 4"). Force LTR on the price itself so it always reads
 * correctly regardless of the surrounding language. Always render prices
 * through this component, never call formatPrice() directly in JSX.
 */
export function Price({ value, prefix, className }: PriceProps) {
  return (
    <span dir="ltr" className={className}>
      {prefix}
      {formatPrice(value)}
    </span>
  );
}
