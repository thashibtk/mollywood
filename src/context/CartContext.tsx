"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { useUserAuth } from "./UserAuthContext";

interface CartItem {
  productId: string;
  size: string;
  quantity: number;
}

interface Coupon {
  code: string;
  discountPercent: number;
  description: string;
}

interface CartContextType {
  wishlist: string[];
  cart: CartItem[];
  coupon: Coupon | null;
  isLoading: boolean;
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  addToCart: (productId: string, size: string, quantity: number) => void;
  removeFromCart: (productId: string, size?: string) => void;
  isInWishlist: (productId: string) => boolean;
  isInCart: (productId: string, size?: string) => boolean;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  getDiscountAmount: (subtotal: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Coupons will be fetched from database

type StoredCartState =
  | CartItem[]
  | {
      items?: CartItem[];
      coupon?: Coupon | null;
    };

const sanitizeCartItems = (value: unknown): CartItem[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as CartItem).productId === "string" &&
        typeof (item as CartItem).size === "string" &&
        typeof (item as CartItem).quantity === "number"
    )
    .map((item) => ({
      productId: (item as CartItem).productId,
      size: (item as CartItem).size,
      quantity: Math.max(1, Math.round((item as CartItem).quantity)),
    }));
};

const sanitizeCoupon = (value: unknown): Coupon | null => {
  if (
    value &&
    typeof value === "object" &&
    typeof (value as Coupon).code === "string" &&
    typeof (value as Coupon).discountPercent === "number"
  ) {
    return {
      code: (value as Coupon).code,
      discountPercent: (value as Coupon).discountPercent,
      description: (value as Coupon).description || "",
    };
  }
  return null;
};

const parseStoredCartState = (
  value: StoredCartState
): { items: CartItem[]; coupon: Coupon | null } => {
  if (Array.isArray(value)) {
    return { items: sanitizeCartItems(value), coupon: null };
  }
  if (value && typeof value === "object") {
    const items = sanitizeCartItems(value.items ?? []);
    const coupon = sanitizeCoupon(value.coupon ?? null);
    return { items, coupon };
  }
  return { items: [], coupon: null };
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useUserAuth();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Track sync state to prevent concurrent operations
  const lastSyncTimeRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);

  // Load cart and wishlist from database or localStorage
  // Only load on initial mount or when user changes, not on every render
  const hasLoadedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (user === undefined) {
        // User auth is still loading, wait
        return;
      }

      // Only reload if user changed or this is the first load
      const userId = user?.id || null;
      if (hasLoadedRef.current && lastUserIdRef.current === userId) {
        // Already loaded for this user, don't reload
        setIsLoading(false);
        return;
      }

      // Reset if user changed (logged out or different user)
      if (lastUserIdRef.current !== null && lastUserIdRef.current !== userId) {
        hasLoadedRef.current = false;
      }

      hasLoadedRef.current = true;
      lastUserIdRef.current = userId;
      setIsLoading(true);
      
      if (user) {
        // User is logged in - load from database
        try {
          // Load cart from database
          const { data: cartData, error: cartError } = await supabase
            .from("user_cart")
            .select("product_id, size, quantity")
            .eq("user_id", user.id);

          if (cartError) {
            console.error("Error loading cart:", cartError);
          } else {
            const dbCart: CartItem[] = (cartData || []).map((item) => ({
              productId: item.product_id,
              size: item.size,
              quantity: item.quantity,
            }));

            // Merge with localStorage cart (localStorage takes precedence for conflicts)
            const savedCart = localStorage.getItem("mollywood-cart");
            let localCart: CartItem[] = [];
            if (savedCart) {
              try {
                const parsed = JSON.parse(savedCart) as StoredCartState;
                const { items } = parseStoredCartState(parsed);
                localCart = items;
              } catch (error) {
                console.error("Failed to parse stored cart", error);
              }
            }

            // Merge: combine both, with localCart items taking precedence
            const mergedCart = [...dbCart];
            localCart.forEach((localItem) => {
              const existingIndex = mergedCart.findIndex(
                (item) =>
                  item.productId === localItem.productId &&
                  item.size === localItem.size
              );
              if (existingIndex !== -1) {
                mergedCart[existingIndex] = localItem;
              } else {
                mergedCart.push(localItem);
              }
            });

            setCart(mergedCart);
            
            // Sync merged cart to database (don't wait, do it in background)
            // Only clear localStorage if there was local data to merge
            if (localCart.length > 0) {
              syncCartToDatabase(mergedCart, user.id).then(() => {
                // Clear localStorage cart after successful sync
                localStorage.removeItem("mollywood-cart");
              });
            } else if (mergedCart.length > 0) {
              // Even if no local cart, sync to ensure DB is up to date
              syncCartToDatabase(mergedCart, user.id);
            }
          }

          // Load wishlist from database
          const { data: wishlistData, error: wishlistError } = await supabase
            .from("user_wishlist")
            .select("product_id")
            .eq("user_id", user.id);

          if (wishlistError) {
            console.error("Error loading wishlist:", wishlistError);
          } else {
            const dbWishlist = (wishlistData || []).map(
              (item) => item.product_id
            );

            // Merge with localStorage wishlist
            const savedWishlist = localStorage.getItem("mollywood-wishlist");
            let localWishlist: string[] = [];
            if (savedWishlist) {
              try {
                localWishlist = JSON.parse(savedWishlist);
              } catch (error) {
                console.error("Failed to parse stored wishlist", error);
              }
            }

            // Merge: combine both, remove duplicates
            const mergedWishlist = [
              ...new Set([...dbWishlist, ...localWishlist]),
            ];
            setWishlist(mergedWishlist);

            // Sync merged wishlist to database (don't wait, do it in background)
            // Only clear localStorage if there was local data to merge
            if (localWishlist.length > 0) {
              syncWishlistToDatabase(mergedWishlist, user.id).then(() => {
                // Clear localStorage wishlist after successful sync
                localStorage.removeItem("mollywood-wishlist");
              });
            } else if (mergedWishlist.length > 0) {
              // Even if no local wishlist, sync to ensure DB is up to date
              syncWishlistToDatabase(mergedWishlist, user.id);
            }
          }
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      } else {
        // User is not logged in - load from localStorage
        const savedWishlist = localStorage.getItem("mollywood-wishlist");
        const savedCart = localStorage.getItem("mollywood-cart");

        if (savedWishlist) {
          try {
            const parsed = JSON.parse(savedWishlist);
            if (Array.isArray(parsed)) {
              setWishlist(parsed);
            }
          } catch (error) {
            console.error("Failed to parse stored wishlist", error);
            setWishlist([]);
          }
        } else {
          setWishlist([]);
        }

        if (savedCart) {
          try {
            const parsed = JSON.parse(savedCart) as StoredCartState;
            const { items, coupon } = parseStoredCartState(parsed);
            setCart(items);
            setCoupon(coupon);
          } catch (error) {
            console.error("Failed to parse stored cart", error);
            setCart([]);
            setCoupon(null);
          }
        } else {
          setCart([]);
          setCoupon(null);
        }
      }

      setIsLoading(false);
    };

    loadData();
  }, [user]);

  // Sync cart to database helper
  const syncCartToDatabase = async (items: CartItem[], userId: string) => {
    if (isSyncingRef.current) {
      // Prevent concurrent syncs
      return;
    }
    
    try {
      isSyncingRef.current = true;
      lastSyncTimeRef.current = Date.now();
      
      // Delete all existing cart items
      await supabase.from("user_cart").delete().eq("user_id", userId);

      // Insert all items
      if (items.length > 0) {
        const cartItems = items.map((item) => ({
          user_id: userId,
          product_id: item.productId,
          size: item.size,
          quantity: item.quantity,
        }));

        await supabase.from("user_cart").insert(cartItems);
      }
    } catch (error) {
      console.error("Error syncing cart to database:", error);
    } finally {
      isSyncingRef.current = false;
    }
  };

  // Sync wishlist to database helper
  const syncWishlistToDatabase = async (items: string[], userId: string) => {
    if (isSyncingRef.current) {
      // Prevent concurrent syncs
      return;
    }
    
    try {
      isSyncingRef.current = true;
      lastSyncTimeRef.current = Date.now();
      
      // Delete all existing wishlist items
      await supabase.from("user_wishlist").delete().eq("user_id", userId);

      // Insert all items
      if (items.length > 0) {
        const wishlistItems = items.map((productId) => ({
          user_id: userId,
          product_id: productId,
        }));

        await supabase.from("user_wishlist").insert(wishlistItems);
      }
    } catch (error) {
      console.error("Error syncing wishlist to database:", error);
    } finally {
      isSyncingRef.current = false;
    }
  };

  // Save to localStorage when state changes (for non-logged users)
  useEffect(() => {
    if (!user) {
      localStorage.setItem("mollywood-wishlist", JSON.stringify(wishlist));
    }
  }, [wishlist, user]);

  useEffect(() => {
    if (!user) {
      const payload: StoredCartState = {
        items: cart,
        coupon,
      };
      localStorage.setItem("mollywood-cart", JSON.stringify(payload));
    }
  }, [cart, coupon, user]);

  // Sync to database when state changes (for logged users)
  // Use a ref to prevent syncing during initial load
  const isInitialLoad = useRef(true);
  const cartSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wishlistSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user && !isLoading && !isInitialLoad.current && !isSyncingRef.current) {
      // Debounce sync to avoid too many database calls
      if (cartSyncTimeoutRef.current) {
        clearTimeout(cartSyncTimeoutRef.current);
      }
      cartSyncTimeoutRef.current = setTimeout(() => {
        // Only sync if we're not currently syncing and state hasn't changed recently
        if (!isSyncingRef.current) {
          syncCartToDatabase(cart, user.id);
        }
      }, 2000); // 2 second debounce to reduce database calls
    }
    return () => {
      if (cartSyncTimeoutRef.current) {
        clearTimeout(cartSyncTimeoutRef.current);
      }
    };
  }, [cart, user, isLoading]);

  useEffect(() => {
    if (user && !isLoading && !isInitialLoad.current && !isSyncingRef.current) {
      // Debounce sync to avoid too many database calls
      if (wishlistSyncTimeoutRef.current) {
        clearTimeout(wishlistSyncTimeoutRef.current);
      }
      wishlistSyncTimeoutRef.current = setTimeout(() => {
        // Only sync if we're not currently syncing and state hasn't changed recently
        if (!isSyncingRef.current) {
          syncWishlistToDatabase(wishlist, user.id);
        }
      }, 2000); // 2 second debounce to reduce database calls
    }
    return () => {
      if (wishlistSyncTimeoutRef.current) {
        clearTimeout(wishlistSyncTimeoutRef.current);
      }
    };
  }, [wishlist, user, isLoading]);

  // Mark initial load as complete after first load
  useEffect(() => {
    if (!isLoading) {
      // Add a small delay to ensure initial load is complete
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 500);
    }
  }, [isLoading]);


  const addToWishlist = async (productId: string) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) return prev;
      return [...prev, productId];
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((id) => id !== productId));

    // Also remove from database if logged in
    if (user) {
      supabase
        .from("user_wishlist")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .then(({ error }) => {
          if (error) console.error("Error removing from wishlist:", error);
        });
    }
  };

  const addToCart = (productId: string, size: string, quantity: number) => {
    const normalizedSize = size || "Free Size";
    const normalizedQuantity = Math.max(1, Math.round(quantity));

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === productId && item.size === normalizedSize
      );

      if (existingIndex !== -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: normalizedQuantity,
        };
        return next;
      }

      return [
        ...prev,
        {
          productId,
          size: normalizedSize,
          quantity: normalizedQuantity,
        },
      ];
    });
  };

  const removeFromCart = (productId: string, size?: string) => {
    setCart((prev) =>
      prev.filter((item) => {
        if (item.productId !== productId) return true;
        if (size) {
          return item.size !== size;
        }
        return false;
      })
    );

    // Also remove from database if logged in
    if (user) {
      const query = supabase
        .from("user_cart")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (size) {
        query.eq("size", size);
      }

      query.then(({ error }) => {
        if (error) console.error("Error removing from cart:", error);
      });
    }
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const isInCart = (productId: string, size?: string) =>
    cart.some((item) => {
      if (item.productId !== productId) return false;
      if (size) {
        return item.size === size;
      }
      return true;
    });

  const applyCoupon = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      return { success: false, message: "Enter a coupon code" };
    }

    try {
      // Fetch coupon from database - check both active and scheduled status (case-sensitive)
      const { data: couponData, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", trimmed)
        .in("status", ["active", "scheduled"])
        .maybeSingle();

      if (error) {
        console.error("Coupon query error:", error);
        return { success: false, message: "Failed to validate coupon code" };
      }

      if (!couponData) {
        return { success: false, message: "Invalid coupon code" };
      }

      // If scheduled, check if it's valid from date
      if (couponData.status === "scheduled" && couponData.valid_from) {
        const validFromDate = new Date(couponData.valid_from);
        if (validFromDate > new Date()) {
          return { success: false, message: "This coupon is not yet active" };
        }
      }

      // Check if coupon is expired
      if (couponData.valid_until) {
        const expiryDate = new Date(couponData.valid_until);
        if (expiryDate < new Date()) {
          return { success: false, message: "This coupon has expired" };
        }
      }

      // Check if coupon has reached max usage
      if (couponData.max_usage && couponData.usage_count >= couponData.max_usage) {
        return { success: false, message: "This coupon has reached its usage limit" };
      }

      const coupon: Coupon = {
        code: couponData.code,
        discountPercent: couponData.discount_percent,
        description: couponData.description || "",
      };

      setCoupon(coupon);
      return {
        success: true,
        message: `${coupon.discountPercent}% discount applied to your cart`,
      };
    } catch (error) {
      console.error("Error applying coupon:", error);
      return { success: false, message: "Failed to apply coupon" };
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
  };

  const getDiscountAmount = (subtotal: number) => {
    if (!coupon) return 0;
    return Math.round((subtotal * coupon.discountPercent) / 100);
  };

  return (
    <CartContext.Provider
      value={{
        wishlist,
        cart,
        coupon,
        isLoading,
        addToWishlist,
        removeFromWishlist,
        addToCart,
        removeFromCart,
        isInWishlist,
        isInCart,
        applyCoupon,
        removeCoupon,
        getDiscountAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
