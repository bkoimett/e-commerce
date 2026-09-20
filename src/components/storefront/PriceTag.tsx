import { formatKES } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PriceTagProps {
  originalPrice: number;
  finalPrice: number;
  appliedPromotion: { discount_type: "percentage" | "fixed"; discount_value: number } | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceTag({ originalPrice, finalPrice, appliedPromotion, size = "md", className }: PriceTagProps) {
  const discounted = finalPrice < originalPrice;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span
        className={cn(
          size === "lg" ? "text-xl font-semibold" : size === "sm" ? "text-sm font-medium" : "text-base font-semibold"
        )}
      >
        {formatKES(finalPrice)}
      </span>
      {discounted && (
        <s className={cn("text-muted-foreground", size === "sm" ? "text-xs" : "text-sm")}>{formatKES(originalPrice)}</s>
      )}
      {discounted && appliedPromotion && (
        <span className="rounded-full bg-brand-amber px-2 py-0.5 text-xs font-medium whitespace-nowrap text-[--brand-ink]">
          {appliedPromotion.discount_type === "percentage"
            ? `${appliedPromotion.discount_value}% off`
            : `Save ${formatKES(appliedPromotion.discount_value)}`}
        </span>
      )}
    </span>
  );
}