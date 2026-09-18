export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <p className="text-gray-600">Welcome to the admin dashboard.</p>
      </div>
      <nav className="grid gap-4 md:grid-cols-3">
        <a
          href="/admin/categories"
          className="rounded-lg border p-4 hover:bg-gray-50"
        >
          <h3 className="font-medium">Categories</h3>
          <p className="text-sm text-gray-500">Manage product categories</p>
        </a>
        <a
          href="/admin/products"
          className="rounded-lg border p-4 hover:bg-gray-50"
        >
          <h3 className="font-medium">Products</h3>
          <p className="text-sm text-gray-500">Manage products and variants</p>
        </a>
        <a
          href="/admin/promotions"
          className="rounded-lg border p-4 hover:bg-gray-50"
        >
          <h3 className="font-medium">Promotions</h3>
          <p className="text-sm text-gray-500">Manage promotions and discounts</p>
        </a>
      </nav>
    </div>
  );
}