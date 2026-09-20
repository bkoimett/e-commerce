import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatKES } from "@/lib/format";
import { OrderStatusBadge } from "../StatusBadge";

interface OrderItemRow {
  quantity: number;
  unit_price: string;
  product_variants: Array<{
    sku: string;
    attributes: Record<string, string>;
    products: Array<{ name: string }>;
  }>;
}

interface ShippingAddressRow {
  line1?: string;
  line2?: string;
  town?: string;
  county?: string;
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, contact_name, contact_phone, contact_email, shipping_address, total_amount, payment_status, payment_provider, payment_reference, created_at, order_items(variant_id, quantity, unit_price, product_variants(sku, attributes, products(name)))"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !order) notFound();

  const shippingAddress = (order.shipping_address ?? {}) as ShippingAddressRow;
  const items = (order.order_items ?? []) as OrderItemRow[];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/orders"
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            ← Orders
          </Link>
          <h2 className="mt-1 text-xl font-semibold">
            Order <span className="font-mono text-base">{order.id.slice(0, 8)}</span>
          </h2>
          <p className="text-sm text-gray-500">
            Placed{" "}
            {new Date(order.created_at).toLocaleString("en-KE", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <OrderStatusBadge status={order.payment_status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold">Customer</h3>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Name</dt>
              <dd className="text-right font-medium">{order.contact_name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Phone</dt>
              <dd className="text-right tabular-nums">{order.contact_phone}</dd>
            </div>
            {order.contact_email && (
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Email</dt>
                <dd className="text-right">{order.contact_email}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold">Delivery address</h3>
          <address className="text-sm not-italic leading-relaxed text-gray-700">
            {[shippingAddress.line1, shippingAddress.line2].filter(Boolean).join(", ")}
            <br />
            {[shippingAddress.town, shippingAddress.county].filter(Boolean).join(", ")}
          </address>
        </section>
      </div>

      <section className="rounded-lg border bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold">Items</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2">Product</th>
              <th className="pb-2">SKU</th>
              <th className="pb-2">Variant</th>
              <th className="pb-2 text-right">Qty</th>
              <th className="pb-2 text-right">Unit price</th>
              <th className="pb-2 text-right">Line total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item, i) => {
              const variant = item.product_variants?.[0];
              const productName = variant?.products?.[0]?.name ?? "Unknown product";
              const unitPrice = Number(item.unit_price);
              return (
                <tr key={i}>
                  <td className="py-2.5 pr-4 font-medium">{productName}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-gray-500">
                    {variant?.sku ?? "-"}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-600">
                    {variant
                      ? Object.entries(variant.attributes ?? {})
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(", ")
                      : "-"}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">
                    {formatKES(unitPrice)}
                  </td>
                  <td className="py-2.5 text-right font-medium tabular-nums">
                    {formatKES(unitPrice * item.quantity)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t">
              <td colSpan={5} className="pt-3 text-right font-semibold">
                Total
              </td>
              <td className="pt-3 text-right font-semibold tabular-nums">
                {formatKES(Number(order.total_amount))}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="rounded-lg border bg-white p-4 text-sm">
        <h3 className="mb-3 font-semibold">Payment</h3>
        <dl className="space-y-1.5">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Provider</dt>
            <dd className="font-medium">{order.payment_provider}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Reference</dt>
            <dd className="font-mono text-gray-600">
              {order.payment_reference ?? "—"}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}