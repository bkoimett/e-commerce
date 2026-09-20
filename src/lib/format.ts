// KES has no minor units in circulation, so format without decimals.
// Single formatter shared across the storefront (see DESIGN.md §14).
const kesFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatKES(amount: number): string {
  return kesFormatter.format(amount);
}