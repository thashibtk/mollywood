"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { ReactNode, useEffect } from "react";
import { AdminAuthProvider, useAdminAuth } from "@/context/AdminAuthContext";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/admin" },
  { label: "Orders", path: "/admin/orders" },
  { label: "Products", path: "/admin/products" },
  { label: "Coupons", path: "/admin/coupons" },
  { label: "Customers", path: "/admin/customers" },
  { label: "Returns", path: "/admin/returns" },
  { label: "Next Update", path: "/admin/stock-update" },
  { label: "Reports", path: "/admin/reports" },
];

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAdminAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Don't show layout on login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Show loading or redirect if not authenticated
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex">
      <aside className="w-64 border-r border-gray-200 bg-gray-50/80 backdrop-blur-sm flex flex-col">
        <div className="px-6 py-6 border-b border-gray-200">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Mollywood Admin
          </h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
            control center
          </p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.path === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-gray-900 text-white shadow"
                    : "text-gray-600 hover:bg-gray-200/60"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-6 py-5 border-t border-gray-200 space-y-3">
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
          >
            Logout
          </button>
          <div className="text-xs text-gray-400 uppercase tracking-wider">
            Secure admin area
          </div>
        </div>
      </aside>
      <main className="flex-1 bg-white">{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthProvider>
  );
}

