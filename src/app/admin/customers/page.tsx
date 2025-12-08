"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import CustomerDetailsModal from "@/components/customer-details-modal";
import ScorpioLoader from "@/components/ScorpioLoader";

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

interface CustomerStats {
  totalCustomers: number;
  repeatPurchaseRate: number;
  avgLifetimeValue: number;
}

const ITEMS_PER_PAGE = 10;

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    repeatPurchaseRate: 0,
    avgLifetimeValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers based on search query using useMemo for better performance
  const filteredCustomers = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === "") return customers;
    
    const query = searchQuery.toLowerCase().trim();
    return customers.filter((customer) => {
      const nameMatch = customer.name.toLowerCase().includes(query);
      const emailMatch = customer.email.toLowerCase().includes(query);
      const phoneMatch = customer.phone ? customer.phone.includes(query) : false;
      
      return nameMatch || emailMatch || phoneMatch;
    });
  }, [customers, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      // Fetch all orders with shipping address
      const { data: orders, error } = await supabase
        .from("orders")
        .select(
          "customer_email, customer_name, customer_phone, total, created_at, shipping_address"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group orders by customer email
      const customerMap = new Map<string, Customer>();

      orders?.forEach((order) => {
        const email = order.customer_email.toLowerCase();
        const existing = customerMap.get(email);

        if (existing) {
          existing.orders += 1;
          existing.lifetimeValue += order.total;
          // Update last order date and shipping address if this order is more recent
          if (new Date(order.created_at) > new Date(existing.lastOrderDate)) {
            existing.lastOrderDate = order.created_at;
            if (order.shipping_address) {
              existing.shippingAddress =
                order.shipping_address as ShippingAddress;
            }
          }
        } else {
          customerMap.set(email, {
            email: order.customer_email,
            name: order.customer_name,
            phone: order.customer_phone || "",
            orders: 1,
            lifetimeValue: order.total,
            lastOrderDate: order.created_at,
            shippingAddress: order.shipping_address
              ? (order.shipping_address as ShippingAddress)
              : undefined,
          });
        }
      });

      // Convert map to array and sort by lifetime value
      const customersList = Array.from(customerMap.values()).sort(
        (a, b) => b.lifetimeValue - a.lifetimeValue
      );

      setCustomers(customersList);

      // Calculate statistics
      const totalCustomers = customersList.length;
      const repeatCustomers = customersList.filter((c) => c.orders > 1).length;
      const repeatPurchaseRate =
        totalCustomers > 0
          ? Math.round((repeatCustomers / totalCustomers) * 100)
          : 0;
      const totalLifetimeValue = customersList.reduce(
        (sum, c) => sum + c.lifetimeValue,
        0
      );
      const avgLifetimeValue =
        totalCustomers > 0
          ? Math.round(totalLifetimeValue / totalCustomers)
          : 0;

      setStats({
        totalCustomers,
        repeatPurchaseRate,
        avgLifetimeValue,
      });
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays === 0) {
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? "Just now" : `${diffMins} minutes ago`;
      }
      return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return "1 day ago";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? "1 month ago" : `${months} months ago`;
    }
  };

  const topCustomers = customers.slice(0, 10);

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Customer Insights
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Analyse loyal fans, top spenders, and engagement levels.
          </p>
        </div>
      </div>

      <div className="px-8 py-8 space-y-6">
        {loading ? (
          <ScorpioLoader />
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-5">
                <p className="text-xs uppercase tracking-wider text-gray-500">
                  Total Customers
                </p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {stats.totalCustomers.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500 uppercase tracking-wider">
                  Unique customers
                </p>
              </div>
              <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-5">
                <p className="text-xs uppercase tracking-wider text-gray-500">
                  Avg. Lifetime Value
                </p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  ₹{stats.avgLifetimeValue.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500 uppercase tracking-wider">
                  Average per customer
                </p>
              </div>
            </div>

            {/* Main Content - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: All Customers Table */}
              <div className="lg:col-span-2">
                <div className="border border-gray-200 rounded-xl bg-white shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        All Customers
                      </h3>
                      <p className="text-xs text-gray-500">
                        {filteredCustomers.length} customer
                        {filteredCustomers.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  {paginatedCustomers.length === 0 ? (
                    <div className="px-6 py-12 text-center text-gray-500">
                      <p>
                        {searchQuery ? "No customers found" : "No customers available"}
                      </p>
                      {searchQuery && (
                        <p className="text-xs mt-1">
                          Try adjusting your search query
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-xs text-gray-500">
                                Name
                              </th>
                              <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-xs text-gray-500">
                                Email
                              </th>
                              <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-xs text-gray-500">
                                Phone
                              </th>
                              <th className="px-6 py-3 text-center font-semibold uppercase tracking-wider text-xs text-gray-500">
                                Orders
                              </th>
                              <th className="px-6 py-3 text-right font-semibold uppercase tracking-wider text-xs text-gray-500">
                                LTV
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {paginatedCustomers.map((customer) => (
                              <tr
                                key={customer.email}
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setShowModal(true);
                                }}
                              >
                                <td className="px-6 py-4 text-gray-900 font-medium">
                                  {customer.name}
                                </td>
                                <td className="px-6 py-4 text-gray-700 text-xs">
                                  {customer.email}
                                </td>
                                <td className="px-6 py-4 text-gray-700">
                                  {customer.phone || "-"}
                                </td>
                                <td className="px-6 py-4 text-center text-gray-700">
                                  {customer.orders}
                                </td>
                                <td className="px-6 py-4 text-right text-gray-900 font-semibold">
                                  ₹{customer.lifetimeValue.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            Showing {startIndex + 1} to{" "}
                            {Math.min(endIndex, filteredCustomers.length)} of{" "}
                            {filteredCustomers.length} customers
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setCurrentPage((p) => Math.max(1, p - 1))
                              }
                              disabled={currentPage === 1}
                              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Previous
                            </button>
                            <div className="flex items-center gap-1">
                              {Array.from(
                                { length: totalPages },
                                (_, i) => i + 1
                              )
                                .filter(
                                  (page) =>
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 1 &&
                                      page <= currentPage + 1)
                                )
                                .map((page, index, array) => (
                                  <div
                                    key={page}
                                    className="flex items-center gap-1"
                                  >
                                    {index > 0 &&
                                      array[index - 1] !== page - 1 && (
                                        <span className="px-2 text-gray-400">
                                          ...
                                        </span>
                                      )}
                                    <button
                                      onClick={() => setCurrentPage(page)}
                                      className={`px-4 py-2 text-sm border rounded-lg ${
                                        currentPage === page
                                          ? "border-gray-900 bg-gray-900 text-white"
                                          : "border-gray-200 hover:bg-gray-50"
                                      }`}
                                    >
                                      {page}
                                    </button>
                                  </div>
                                ))}
                            </div>
                            <button
                              onClick={() =>
                                setCurrentPage((p) =>
                                  Math.min(totalPages, p + 1)
                                )
                              }
                              disabled={currentPage === totalPages}
                              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Right: Top Customers */}
              <div>
                <div className="border border-gray-200 rounded-xl bg-white shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Top Customers
                    </h3>
                    <p className="text-xs text-gray-500">
                      Sorted by lifetime value
                    </p>
                  </div>
                  {topCustomers.length === 0 ? (
                    <div className="px-6 py-12 text-center text-gray-500">
                      <p className="text-xs">No customers found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {topCustomers.map((customer) => (
                        <div
                          key={customer.email}
                          className="px-6 py-4 space-y-2"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {customer.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {customer.email}
                            </p>
                            {customer.phone && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {customer.phone}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 text-xs text-gray-600">
                            <div className="flex justify-between">
                              <span>Orders:</span>
                              <span className="font-medium">
                                {customer.orders}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>LTV:</span>
                              <span className="font-medium">
                                ₹{customer.lifetimeValue.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Last seen:</span>
                              <span className="font-medium">
                                {formatLastSeen(customer.lastOrderDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        customer={selectedCustomer}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedCustomer(null);
        }}
        formatLastSeen={formatLastSeen}
      />
    </div>
  );
}