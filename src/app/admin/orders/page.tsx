import OrderList from "./OrderList";

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Orders</h2>
        <p className="text-gray-600">Every order placed through checkout.</p>
      </div>
      <OrderList />
    </div>
  );
}