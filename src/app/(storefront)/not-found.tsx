import Link from "next/link";

export default function StorefrontNotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        We couldn&apos;t find that page
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        The link may be old, or the product may have been removed. Browse the
        catalogue instead.
      </p>
      <Link
        href="/products"
        className="mt-6 inline-flex rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
      >
        Shop all products
      </Link>
    </div>
  );
}