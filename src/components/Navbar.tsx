"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useUserAuth } from "@/context/UserAuthContext";
import WishlistModal from "@/components/WishlistModal";
import CartModal from "@/components/CartModal";
import ProfileMenu from "@/components/ProfileMenu";
import gsap from "gsap";
import Image from "next/image";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const navbarRef = useRef<HTMLElement>(null);
  const wishlistRef = useRef<HTMLButtonElement>(null);
  const cartRef = useRef<HTMLButtonElement>(null);
  const profileAnchorElementRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [wishlistAnchorRect, setWishlistAnchorRect] = useState<DOMRect | null>(
    null
  );
  const [cartAnchorRect, setCartAnchorRect] = useState<DOMRect | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profileAnchorRect, setProfileAnchorRect] = useState<DOMRect | null>(
    null
  );
  const [isScrolled, setIsScrolled] = useState(false);
  const { wishlist, cart } = useCart();
  const { user, logout } = useUserAuth();

  useEffect(() => {
    // Only show navbar on public-facing pages (hide on landing, intro, and admin routes)
    const pathnameValue = pathname ?? "";
    const shouldShow =
      pathnameValue !== "/" &&
      pathnameValue !== "/begins" &&
      !pathnameValue.startsWith("/admin");

    setIsVisible(shouldShow);

    if (navbarRef.current && shouldShow) {
      gsap.set(navbarRef.current, { opacity: 1, y: 0 });
      gsap.fromTo(
        navbarRef.current,
        { y: -100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
        }
      );
    }
  }, [pathname]);

  // Track scroll position to adjust mobile menu padding
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 40);
    };

    handleScroll(); // Check initial scroll position
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsWishlistModalOpen(false);
        setIsCartModalOpen(false);
        setIsProfileMenuOpen(false);
        setWishlistAnchorRect(null);
        setCartAnchorRect(null);
        setProfileAnchorRect(null);
        profileAnchorElementRef.current = null;
      }
    };

    if (isWishlistModalOpen || isCartModalOpen || isProfileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isWishlistModalOpen, isCartModalOpen, isProfileMenuOpen]);

  useEffect(() => {
    setIsWishlistModalOpen(false);
    setIsCartModalOpen(false);
    setWishlistAnchorRect(null);
    setCartAnchorRect(null);
    setIsProfileMenuOpen(false);
    setProfileAnchorRect(null);
    profileAnchorElementRef.current = null;
  }, [pathname]);

  useEffect(() => {
    const updateAnchors = () => {
      if (isWishlistModalOpen && wishlistRef.current) {
        setWishlistAnchorRect(wishlistRef.current.getBoundingClientRect());
      }
      if (isCartModalOpen && cartRef.current) {
        setCartAnchorRect(cartRef.current.getBoundingClientRect());
      }
      if (isProfileMenuOpen && profileAnchorElementRef.current) {
        setProfileAnchorRect(
          profileAnchorElementRef.current.getBoundingClientRect()
        );
      }
    };

    if (isWishlistModalOpen || isCartModalOpen || isProfileMenuOpen) {
      window.addEventListener("resize", updateAnchors);
      window.addEventListener("scroll", updateAnchors, { passive: true });
      updateAnchors();
    }

    return () => {
      window.removeEventListener("resize", updateAnchors);
      window.removeEventListener("scroll", updateAnchors);
    };
  }, [isWishlistModalOpen, isCartModalOpen, isProfileMenuOpen]);

  if (!isVisible) return null;

  const navItems = [
    { label: "Shop", path: "/shop" },
    { label: "About Us", path: "/about" },
    { label: "Contact Us", path: "/contact" },
  ];

  const isActive = (path: string) => pathname === path;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsSearchOpen(false);
    }
  };

  const handleSearchClick = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  const closeWishlistModal = () => {
    setIsWishlistModalOpen(false);
    setWishlistAnchorRect(null);
  };

  const closeCartModal = () => {
    setIsCartModalOpen(false);
    setCartAnchorRect(null);
  };

  const closeProfileMenu = () => {
    setIsProfileMenuOpen(false);
    setProfileAnchorRect(null);
    profileAnchorElementRef.current = null;
  };

  const handleWishlistClick = () => {
    if (isWishlistModalOpen) {
      closeWishlistModal();
    } else {
      const rect = wishlistRef.current?.getBoundingClientRect() ?? null;
      setWishlistAnchorRect(rect);
      setIsWishlistModalOpen(true);
    }
    closeCartModal();
    closeProfileMenu();
    setIsMobileMenuOpen(false);
  };

  const handleCartClick = () => {
    if (isCartModalOpen) {
      closeCartModal();
    } else {
      const rect = cartRef.current?.getBoundingClientRect() ?? null;
      setCartAnchorRect(rect);
      setIsCartModalOpen(true);
    }
    closeWishlistModal();
    closeProfileMenu();
    setIsMobileMenuOpen(false);
  };

  const handleProfileClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isProfileMenuOpen) {
      closeProfileMenu();
    } else {
      profileAnchorElementRef.current = event.currentTarget;
      setProfileAnchorRect(event.currentTarget.getBoundingClientRect());
      setIsProfileMenuOpen(true);
    }
    closeWishlistModal();
    closeCartModal();
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <motion.nav
        ref={navbarRef}
        className="fixed left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-white/20 h-16 md:h-20"
        style={{
          top: "var(--navbar-top, 2.5rem)",
          transition: "top 0.3s ease-in-out",
        }}
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Mobile: Collapse Icon on Left */}
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileTap={{ scale: 0.9 }}
              className="md:hidden p-2 text-white"
              aria-label="Menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </motion.button>

            {/* MOLLYWOOD Logo - Centered on mobile, left on desktop */}
            <motion.button
              onClick={() => router.push("/shop")}
              whileHover={{ scale: 1.1, letterSpacing: "2px" }}
              whileTap={{ scale: 0.95 }}
              className="brand-font font-bold tracking-wider cursor-pointer hover:text-gray-300 transition-colors flex items-center gap-2 md:gap-3 absolute left-1/2 transform -translate-x-1/2 md:relative md:left-0 md:transform-none"
            >
              <Image
                src="/logo/logo.jpg"
                alt="Mollywood Logo"
                width={32}
                height={32}
                className="object-contain rounded-full border-2 border-white p-1 md:w-10 md:h-10"
              />
              <div className="flex flex-col items-center leading-tight">
                <span className="text-[0.4rem] md:text-[0.5rem] font-normal tracking-wider opacity-70">
                  The
                </span>
                <span className="leading-none text-sm sm:text-base md:text-lg lg:text-xl">
                  MOLLYWOOD
                </span>
                <span className="text-[0.4rem] md:text-[0.5rem] font-normal tracking-wider opacity-70">
                  Clothing
                </span>
              </div>
            </motion.button>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-4 lg:gap-6 xl:gap-8">
              {/* Navigation Links */}
              <div className="flex items-center gap-3 lg:gap-4 xl:gap-6">
                {navItems.map((item) => (
                  <motion.button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`text-xs lg:text-sm xl:text-base font-semibold uppercase tracking-wider transition-colors ${
                      isActive(item.path)
                        ? "text-white border-b-2 border-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </motion.button>
                ))}
              </div>

              {/* Divider */}
              <div className="h-6 lg:h-8 w-px bg-white/20" />

              {/* Search Bar */}
              <AnimatePresence>
                {isSearchOpen ? (
                  <motion.form
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleSearch}
                    className="flex items-center gap-2 overflow-hidden"
                  >
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="px-3 py-1.5 bg-black border border-white/30 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-white transition-colors min-w-[200px] lg:min-w-[250px]"
                    />
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1.5 text-white hover:text-gray-300 transition-colors"
                      aria-label="Search"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery("");
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1.5 text-white hover:text-gray-300 transition-colors"
                      aria-label="Close search"
                    >
                      <svg
                        className="w-4 h-4"
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
                    </motion.button>
                  </motion.form>
                ) : (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleSearchClick}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-1.5 lg:p-2 text-white hover:text-gray-300 transition-colors"
                    aria-label="Search"
                  >
                    <svg
                      className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Divider */}
              <div className="h-6 lg:h-8 w-px bg-white/20" />

              {/* Icons */}
              <div className="flex items-center gap-2 lg:gap-3 xl:gap-4">
                {/* Wishlist Icon */}
                <motion.button
                  ref={wishlistRef}
                  onClick={handleWishlistClick}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                  className={`relative p-1.5 lg:p-2 transition-colors ${
                    wishlist.length > 0
                      ? "text-white"
                      : "text-white hover:text-gray-300"
                  }`}
                  aria-label="Wishlist"
                >
                  <svg
                    className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6"
                    fill={wishlist.length > 0 ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  {wishlist.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-white text-black rounded-full flex items-center justify-center px-1 text-[10px] font-bold"
                    >
                      {wishlist.length > 99 ? "99+" : wishlist.length}
                    </motion.span>
                  )}
                </motion.button>

                {/* Cart Icon */}
                <motion.button
                  ref={cartRef}
                  onClick={handleCartClick}
                  whileHover={{ scale: 1.2, rotate: -10 }}
                  whileTap={{ scale: 0.9 }}
                  className={`relative p-1.5 lg:p-2 transition-colors ${
                    cart.length > 0
                      ? "text-white"
                      : "text-white hover:text-gray-300"
                  }`}
                  aria-label="Cart"
                >
                  <svg
                    className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {cart.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-white text-black rounded-full flex items-center justify-center px-1 text-[10px] font-bold"
                    >
                      {cart.length > 99 ? "99+" : cart.length}
                    </motion.span>
                  )}
                </motion.button>

                {/* Profile Icon - Always visible */}
                <div className="relative">
                  <motion.button
                    onClick={(event) => handleProfileClick(event)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className={`relative p-1.5 lg:p-2 transition-colors ${
                      isProfileMenuOpen
                        ? "text-white"
                        : "text-white hover:text-gray-300"
                    }`}
                    aria-label="Profile"
                  >
                    <svg
                      className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </motion.button>
                  <ProfileMenu
                    isOpen={isProfileMenuOpen}
                    onClose={closeProfileMenu}
                    anchorRect={profileAnchorRect}
                    onNavigate={(path) => router.push(path)}
                    onLogout={handleLogout}
                    user={user}
                  />
                </div>
              </div>
            </div>

            {/* Mobile: Profile Icon on Right */}
            <div className="md:hidden relative">
              <motion.button
                onClick={(event) => handleProfileClick(event)}
                whileTap={{ scale: 0.9 }}
                className={`p-2 transition-colors ${
                  isProfileMenuOpen
                    ? "text-white"
                    : "text-white hover:text-gray-300"
                }`}
                aria-label="Profile"
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </motion.button>
              <ProfileMenu
                isOpen={isProfileMenuOpen}
                onClose={closeProfileMenu}
                anchorRect={profileAnchorRect}
                onNavigate={(path) => router.push(path)}
                onLogout={handleLogout}
                user={user}
              />
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed md:hidden left-0 right-0 z-49 bg-black/95 backdrop-blur-sm border-b-2 border-white/20 overflow-hidden"
            style={{
              top: "calc(var(--navbar-top, 2.5rem) + 4rem)",
              transition: "top 0.3s ease-in-out",
            }}
          >
            <div
              className={`px-4 pb-4 space-y-4 ${isScrolled ? "pt-16" : "pt-4"}`}
            >
              {/* Mobile Navigation Links */}
              {navItems.map((item, index) => (
                <motion.button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full text-left py-3 px-4 text-base font-semibold uppercase tracking-wider transition-colors border-l-4 ${
                    isActive(item.path)
                      ? "text-white border-white bg-white/10"
                      : "text-gray-400 border-transparent hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </motion.button>
              ))}

              {/* Mobile Search */}
              <div className="pt-4 border-t border-white/20">
                <form
                  onSubmit={handleSearch}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="flex-1 px-3 py-2 bg-black border border-white/30 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-white transition-colors"
                  />
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-white hover:text-gray-300 transition-colors"
                    aria-label="Search"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </motion.button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <WishlistModal
        isOpen={isWishlistModalOpen}
        onClose={closeWishlistModal}
        anchorRect={wishlistAnchorRect}
      />
      <CartModal
        isOpen={isCartModalOpen}
        onClose={closeCartModal}
        anchorRect={cartAnchorRect}
      />

      {/* Bottom Navigation - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-black/95 backdrop-blur-sm border-t-2 border-white/20">
        <div className="flex items-center justify-around h-16 px-2">
          {/* Home Button */}
          <motion.button
            onClick={() => {
              router.push("/");
              setIsMobileMenuOpen(false);
            }}
            whileTap={{ scale: 0.9 }}
            className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors ${
              pathname === "/" ? "text-white" : "text-gray-400 hover:text-white"
            }`}
            aria-label="Home"
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-xs font-semibold uppercase">Home</span>
          </motion.button>

          {/* Wishlist Button */}
          <motion.button
            onClick={handleWishlistClick}
            whileTap={{ scale: 0.9 }}
            className="relative flex flex-col items-center justify-center gap-1 p-2 transition-colors text-gray-400 hover:text-white"
            aria-label="Wishlist"
          >
            <svg
              className="w-6 h-6"
              fill={wishlist.length > 0 ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {wishlist.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-2 min-w-[18px] h-[18px] bg-white text-black rounded-full flex items-center justify-center px-1 text-[10px] font-bold"
              >
                {wishlist.length > 99 ? "99+" : wishlist.length}
              </motion.span>
            )}
            <span className="text-xs font-semibold uppercase">Wishlist</span>
          </motion.button>

          {/* Cart Button */}
          <motion.button
            onClick={handleCartClick}
            whileTap={{ scale: 0.9 }}
            className="relative flex flex-col items-center justify-center gap-1 p-2 transition-colors text-gray-400 hover:text-white"
            aria-label="Cart"
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
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {cart.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-2 min-w-[18px] h-[18px] bg-white text-black rounded-full flex items-center justify-center px-1 text-[10px] font-bold"
              >
                {cart.length > 99 ? "99+" : cart.length}
              </motion.span>
            )}
            <span className="text-xs font-semibold uppercase">Cart</span>
          </motion.button>
        </div>
      </div>
    </>
  );
}
