import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatKES } from "@/lib/format";
import { OrderStatusBadge } from "./StatusBadge";

/**
 * Admin order list (WORKFLOW #30). Read through the service-role client like
 * the other admin sections; orders are never visible to anon/authenticated
 * storefront roles under RLS (0001: orders_admin_read only).
 */
export default async function OrderList() {
  const supabase = createAdminClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, contact_name, contact_phone, total_amount, payment_status, payment_provider, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="text-red-600">Error loading orders: {error.message}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left text-sm text-gray-500">
            <th className="pb-2">Placed</th>
            <th className="pb-2">Customer</th>
            <th className="pb-2">Phone</th>
            <th className="pb-2">Total</th>
            <th className="pb-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {(orders ?? []).map((order) => (
            <tr key={order.id} className="text-sm">
              <td className="py-2.5 pr-4">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="tabular-nums text-gray-800 hover:underline"
                >
                  {new Date(order.created_at).toLocaleString("en-KE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </Link>
              </td>
              <td className="py-2.5 pr-4">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="text-gray-800 hover:underline"
                >
                  {order.contact_name}
                </Link>
              </td>
              <td className="py-2.5 pr-4 tabular-nums text-gray-600">
                {order.contact_phone}
              </td>
              <td className="py-2.5 pr-4 tabular-nums font-medium">
                {formatKES(Number(order.total_amount))}
              </td>
              <td className="py-2.5">
                <OrderStatusBadge status={order.payment_status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(!orders || orders.length === 0) && (
        <p className="py-8 text-center text-gray-500">
          No orders yet. Checkout creates the first one.
        </p>
      )}
    </div>
  );
}