export function PromotionBanner({ text }: { text: string }) {
  return (
    <div className="bg-brand-navy text-white">
      <p className="mx-auto max-w-6xl px-4 py-2.5 text-center text-sm font-medium">
        {text}
      </p>
    </div>
  );
}