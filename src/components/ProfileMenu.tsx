"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { User } from "@supabase/supabase-js";

interface ProfileMenuProps {
  isOpen: boolean;
  anchorRect: DOMRect | null;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  user: User | null;
}

interface ProfileMenuItem {
  label: string;
  path?: string;
  action?: () => void;
}

const MENU_ITEMS: ProfileMenuItem[] = [
  {
    label: "My Profile",
    path: "/profile",
  },
  {
    label: "Orders",
    path: "/orders",
  },
  {
    label: "Wishlist",
    path: "/wishlist",
  },
  {
    label: "Cart",
    path: "/cart",
  },
];

export default function ProfileMenu({
  isOpen,
  anchorRect,
  onClose,
  onNavigate,
  onLogout,
  user,
}: ProfileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Only close if click is outside the menu
      if (menuRef.current && !menuRef.current.contains(target)) {
        onClose();
      }
    };

    if (isOpen) {
      // Use click event (not mousedown) and add listener after current event loop
      // This ensures button clicks fire first
      const timeoutId = setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  if (!anchorRect) return null;

  // Calculate position relative to anchor
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const menuWidth = isMobile ? 200 : 220;
  const rightOffset = isMobile ? 16 : 0; // Align to right on mobile
  const leftPosition = isMobile ? undefined : anchorRect.right - menuWidth;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          className="fixed z-50 bg-black border border-white/20 rounded-lg shadow-lg overflow-hidden min-w-[200px]"
          style={{
            top: anchorRect.bottom + 8,
            left: isMobile ? undefined : leftPosition,
            right: isMobile ? rightOffset : undefined,
          }}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
        >
          {user ? (
            <>
              <div className="py-2">
                {MENU_ITEMS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Navigate first, then close menu
                      if (item.path) {
                        onNavigate(item.path);
                      } else if (item.action) {
                        item.action();
                      }
                      // Small delay to ensure navigation starts before closing
                      setTimeout(() => {
                        onClose();
                      }, 100);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="border-t border-white/10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onLogout();
                    setTimeout(() => {
                      onClose();
                    }, 100);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-300 hover:bg-white/10 hover:text-red-100 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="py-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onNavigate("/login");
                  setTimeout(() => {
                    onClose();
                  }, 100);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onNavigate("/register");
                  setTimeout(() => {
                    onClose();
                  }, 100);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Create Account
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
