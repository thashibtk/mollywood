"use client";

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Customer {
  email: string;
  name: string;
  phone: string;
  orders: number;
  lifetimeValue: number;
  lastOrderDate: string;
  shippingAddress?: ShippingAddress;
}

interface CustomerDetailsModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  formatLastSeen: (dateString: string) => string;
}

export default function CustomerDetailsModal({
  customer,
  isOpen,
  onClose,
  formatLastSeen,
}: CustomerDetailsModalProps) {
  if (!isOpen || !customer) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            Customer Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
              Personal Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Name
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {customer.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Email
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {customer.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Phone
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {customer.phone || "Not provided"}
                </p>
              </div>
            </div>
          </div>

          {/* Order Statistics */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
              Order Statistics
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Total Orders
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {customer.orders}
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Lifetime Value
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  ₹{customer.lifetimeValue.toLocaleString()}
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Last Order
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {formatLastSeen(customer.lastOrderDate)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(customer.lastOrderDate).toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {customer.shippingAddress ? (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                Shipping Address
              </h4>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="space-y-1 text-sm text-gray-900">
                  <p className="font-medium">
                    {customer.shippingAddress.street}
                  </p>
                  <p>
                    {customer.shippingAddress.city},{" "}
                    {customer.shippingAddress.state}{" "}
                    {customer.shippingAddress.postalCode}
                  </p>
                  <p>{customer.shippingAddress.country}</p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                Shipping Address
              </h4>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-500">
                  No shipping address available
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
