"use client";

import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import StarsBackground from "@/components/StarsBackground";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Product as ShopProduct } from "@/types/product";
import { supabase, Product as SupabaseProduct } from "@/lib/supabase";
import { mapSupabaseToShopProduct, getImageUrl } from "@/lib/productHelpers";
import { useCart } from "@/context/CartContext";
import gsap from "gsap";
import BackgroundImage from "@/components/BackgroundImage";
import ScorpioLoader from "@/components/ScorpioLoader";
import SizeGuideModal from "@/components/SizeGuideModal";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const category = params.category as string;
  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<ShopProduct[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const detailsContainerRef = useRef<HTMLDivElement>(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const {
    cart,
    addToCart,
    removeFromCart,
    isInCart,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [selectedMediaType, setSelectedMediaType] = useState<"image" | "video">(
    "image"
  );
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [flyingProduct, setFlyingProduct] = useState<{
    id: string;
    x: number;
    y: number;
    endX: number;
    endY: number;
    target: "wishlist" | "cart";
  } | null>(null);
  const [showGoToCart, setShowGoToCart] = useState(false);
  const [supabaseProduct, setSupabaseProduct] =
    useState<SupabaseProduct | null>(null);
  const [relatedProductsIndex, setRelatedProductsIndex] = useState(0);
  const relatedProductsRef = useRef<HTMLDivElement>(null);

  // Fetch product from Supabase
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .eq("status", "published")
          .single();

        if (error) {
          console.error("Error fetching product:", error);
          setProduct(null);
          setLoading(false);
          return;
        }

        if (data) {
          setSupabaseProduct(data);
          const mapped = mapSupabaseToShopProduct(data);
          setProduct(mapped);
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Fetch related products (same category, excluding current product)
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!category) return;

      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("category", category)
          .eq("status", "published")
          .neq("id", productId)
          .order("created_at", { ascending: false })
          .limit(4);

        if (error) {
          console.error("Error fetching related products:", error);
          return;
        }

        const mapped = (data || [])
          .map(mapSupabaseToShopProduct)
          .filter((p): p is ShopProduct => p !== null);

        setRelatedProducts(mapped);
      } catch (error) {
        console.error("Error fetching related products:", error);
      }
    };

    if (category && productId) {
      fetchRelatedProducts();
    }
  }, [category, productId]);

  // Get product images and video from Supabase product
  const productMedia = useMemo(() => {
    if (!supabaseProduct) return { images: [], video: null };

    const images: string[] = [];

    // Filter out null/empty values and convert storage paths to public URLs
    const validImages =
      supabaseProduct.images?.filter((img) => img && img.trim() !== "") || [];

    // Add images from images array (convert storage paths to public URLs)
    if (validImages.length > 0) {
      images.push(...validImages.map(getImageUrl));
    } else if (
      supabaseProduct.image_url &&
      supabaseProduct.image_url.trim() !== ""
    ) {
      // Fallback to image_url if no images array (convert storage path to public URL)
      images.push(getImageUrl(supabaseProduct.image_url));
    }

    return {
      images:
        images.length > 0 ? images : product?.image ? [product.image] : [],
      video: supabaseProduct.video_url || null,
    };
  }, [supabaseProduct, product]);

  // Get stock data from Supabase product sizes
  const stockData = useMemo(() => {
    if (!supabaseProduct || !supabaseProduct.sizes) return {};
    return supabaseProduct.sizes as Record<string, number>;
  }, [supabaseProduct]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.set(containerRef.current, { opacity: 1 });
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: "power2.out" }
      );
    }

    if (imageRef.current) {
      gsap.set(imageRef.current, { opacity: 1, x: 0 });
      gsap.fromTo(
        imageRef.current,
        { x: -100, opacity: 0 },
        { x: 0, opacity: 1, duration: 1, ease: "power3.out" }
      );
    }

    if (detailsRef.current && detailsRef.current.children) {
      const children = Array.from(detailsRef.current.children) as HTMLElement[];
      children.forEach((child) => gsap.set(child, { opacity: 1, x: 0 }));
      gsap.fromTo(
        children,
        { x: 100, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          stagger: 0.15,
          duration: 0.8,
          ease: "power3.out",
          delay: 0.2,
        }
      );
    }

    // Auto-select first available size
    if (product?.size && product.size.length > 0) {
      setSelectedSize(product.size[0]);
    } else {
      setSelectedSize("");
    }
  }, [product]);

  useEffect(() => {
    if (!product || !selectedSize) {
      setQuantity(1);
      return;
    }
    const existing = cart.find(
      (item) => item.productId === product.id && item.size === selectedSize
    );
    if (existing) {
      setQuantity(existing.quantity);
    } else {
      setQuantity(1);
    }
  }, [cart, product, selectedSize]);

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product) return;

    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      const buttonRect = (
        e.currentTarget as HTMLElement
      ).getBoundingClientRect();
      const navButton = document.querySelector(
        '[aria-label="Wishlist"]'
      ) as HTMLElement;
      if (navButton) {
        const navRect = navButton.getBoundingClientRect();
        animateProductFly(buttonRect, navRect, product.id, "wishlist");
      }
      addToWishlist(product.id);
    }
  };

  const handleCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product) return;

    if (!selectedSize) {
      alert("Please select a size");
      return;
    }

    if (isInCart(product.id, selectedSize)) {
      removeFromCart(product.id, selectedSize);
      setShowGoToCart(false);
    } else {
      const buttonRect = (
        e.currentTarget as HTMLElement
      ).getBoundingClientRect();
      const navButton = document.querySelector(
        '[aria-label="Cart"]'
      ) as HTMLElement;
      if (navButton) {
        const navRect = navButton.getBoundingClientRect();
        animateProductFly(buttonRect, navRect, product.id, "cart");
      }
      addToCart(product.id, selectedSize, quantity);
      setShowGoToCart(true);

      // Auto-hide the Go to Cart button after 5 seconds
      setTimeout(() => {
        setShowGoToCart(false);
      }, 5000);
    }
  };

  const animateProductFly = (
    startRect: DOMRect,
    endRect: DOMRect,
    productId: string,
    target: "wishlist" | "cart"
  ) => {
    const endX = endRect.left + endRect.width / 2;
    const endY = endRect.top + endRect.height / 2;

    setFlyingProduct({
      id: productId,
      x: startRect.left + startRect.width / 2,
      y: startRect.top + startRect.height / 2,
      endX,
      endY,
      target,
    });

    setTimeout(() => {
      setFlyingProduct(null);
    }, 800);
  };

  const handleGoToCart = () => {
    router.push("/cart");
  };

  if (loading) {
    return <ScorpioLoader />;
  }

  if (!product) {
    return (
      <div className="relative min-h-screen bg-black text-white flex items-center justify-center">
        <StarsBackground />
        <BackgroundImage src="bg3.webp" opacity={0.7} />
        <Header />
        <div className="relative z-10 text-center">
          <h1 className="text-4xl mb-4">Product Not Found</h1>
          <p className="text-gray-400 mb-6">
            The product you're looking for doesn't exist or is no longer
            available.
          </p>
          <button
            onClick={() => router.push(`/shop/${category}`)}
            className="px-6 py-2 border border-white hover:bg-white hover:text-black transition-all"
          >
            Back to Products
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const inCart = selectedSize
    ? isInCart(product.id, selectedSize)
    : isInCart(product.id);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <StarsBackground />
      <BackgroundImage src="bg4.webp" opacity={0.7} />
      <Header />

      <div
        ref={containerRef}
        className="relative z-10 min-h-screen p-4 sm:p-6 md:p-8 lg:p-16 pt-24 md:pt-26 lg:pt-28"
      >
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => router.push(`/shop/${category}`)}
          whileHover={{ scale: 1.1, x: -5 }}
          className="mb-8 px-6 py-2 border border-white text-white hover:bg-white hover:text-black transition-all duration-300"
        >
          ← Back to Products
        </motion.button>

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
            {/* Product Images & Video */}
            <motion.div
              ref={imageRef}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="flex-1 w-full"
            >
              <div className="space-y-4">
                {/* Main Image/Video Display */}
                <div className="relative w-full aspect-square border border-gray-700 rounded-lg overflow-hidden group">
                  {selectedMediaType === "video" && productMedia.video ? (
                    <div className="relative w-full h-full">
                      <img
                        src={productMedia.video}
                        alt={`${product.name} video`}
                        className="w-full h-full object-cover"
                      />

                    </div>
                  ) : (
                    <Image
                      src={
                        productMedia.images[selectedImageIndex] || product.image
                      }
                      onError={(e) => {
                        console.error(
                          "Image failed to load:",
                          productMedia.images[selectedImageIndex] ||
                            product.image,
                          product.id
                        );
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.jpg";
                      }}
                      unoptimized={(
                        productMedia.images[selectedImageIndex] || product.image
                      )?.startsWith("https://")}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  )}

                  {/* Wishlist Button */}
                  <div className="absolute top-4 right-4 z-10">
                    <motion.button
                      onClick={handleWishlist}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className={`p-3 rounded-full backdrop-blur-md border transition-all duration-300 ${
                        inWishlist
                          ? "bg-white border-white text-black"
                          : "bg-black/50 border-gray-600 text-white hover:bg-white hover:text-black hover:border-white"
                      }`}
                      aria-label={
                        inWishlist ? "Remove from Wishlist" : "Add to Wishlist"
                      }
                    >
                      <svg
                        className="w-6 h-6"
                        fill={inWishlist ? "currentColor" : "none"}
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
                    </motion.button>
                  </div>
                </div>

                {/* Thumbnail Gallery */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {/* Image Thumbnails */}
                  {productMedia.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedMediaType("image");
                        setSelectedImageIndex(index);
                      }}
                      className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden transition-all ${
                        selectedMediaType === "image" &&
                        selectedImageIndex === index
                          ? "border-white"
                          : "border-gray-700 hover:border-gray-500"
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} ${index + 1}`}
                        width={80}
                        onError={(e) => {
                          console.error(
                            "Thumbnail image failed to load:",
                            img,
                            product.id
                          );
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.jpg";
                        }}
                        unoptimized={img?.startsWith("https://")}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}

                  {/* Video Thumbnail */}
                  {productMedia.video && (
                    <button
                      onClick={() => {
                        setSelectedMediaType("video");
                        setSelectedImageIndex(0);
                      }}
                      className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden transition-all ${
                        selectedMediaType === "video"
                          ? "border-white"
                          : "border-gray-700 hover:border-gray-500"
                      }`}
                    >
                      <div className="relative w-full h-full">
                        <img
                          src={productMedia.video}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              ref={detailsContainerRef}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-1 w-full"
            >
              <div ref={detailsRef} className="space-y-6">
                <div className="border border-gray-700 bg-black/50 backdrop-blur-sm rounded-lg p-6 lg:p-8">
                  {/* Category and Basic Info */}
                  <div className="mb-6">
                    <span className="text-sm uppercase tracking-wider text-gray-400">
                      {product.category}
                    </span>

                    <h1 className="text-3xl lg:text-4xl font-bold mt-2 ">
                      {product.name}
                    </h1>

                    <p className="text-sm text-gray-400 mb-4">
                      {product.sku}
                    </p>

                    {/* Product Details in one line */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                      <span className="text-sm uppercase tracking-wider border border-gray-600 px-3 py-1 rounded">
                        {product.color}
                      </span>
                      {product.type && (
                        <span className="text-sm text-gray-400">
                          <span className="text-gray-500 hidden sm:inline">
                            Type:
                          </span>{" "}
                          {product.type}
                        </span>
                      )}
                      {product.material && (
                        <span className="text-sm text-gray-400">
                          <span className="text-gray-500 hidden sm:inline">
                            Material:
                          </span>{" "}
                          {product.material}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Description */}
                  <div className="mb-6">
                    <p className="text-gray-300 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-3xl lg:text-4xl font-bold">
                      ₹{product.price.toLocaleString()}
                    </span>
                  </div>

                  {/* Size Selection */}
                  {product.size && product.size.length > 0 && (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold">
                          Select Size
                        </h3>
                        <button
                          onClick={() => setIsSizeGuideOpen(true)}
                          className="text-sm text-gray-400 hover:text-white underline decoration-gray-500 underline-offset-4 hover:decoration-white transition-all"
                        >
                          Size Guide
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {product.size.sort((a, b) => {
                          const sizeOrder = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
                          const indexA = sizeOrder.indexOf(a);
                          const indexB = sizeOrder.indexOf(b);
                          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                          if (indexA !== -1) return -1;
                          if (indexB !== -1) return 1;
                          return a.localeCompare(b);
                        }).map((size) => (
                          <motion.button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-4 py-2 border-2 transition-all duration-300 uppercase text-sm ${
                              selectedSize === size
                                ? "border-white bg-white text-black"
                                : "border-gray-600 text-white hover:border-white"
                            }`}
                          >
                            {size}
                          </motion.button>
                        ))}
                      </div>
                      {/* Stock Information */}
                      <div className="mt-3 space-y-1">
                        {selectedSize ? (
                          <p className="text-sm text-red-500 font-medium">
                            {stockData[selectedSize] || 0} available
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {product.size.sort((a, b) => {
                              const sizeOrder = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
                              const indexA = sizeOrder.indexOf(a);
                              const indexB = sizeOrder.indexOf(b);
                              if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                              if (indexA !== -1) return -1;
                              if (indexB !== -1) return 1;
                              return a.localeCompare(b);
                            }).map((size) => (
                              <p
                                key={size}
                                className="text-sm text-red-500 font-medium"
                              >
                                {size} - {stockData[size] || 0} available
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quantity Selection */}
                  {selectedSize && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">Quantity</h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border-2 border-gray-600">
                          <motion.button
                            onClick={() =>
                              setQuantity((prev) => Math.max(1, prev - 1))
                            }
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            disabled={quantity <= 1}
                            className="px-4 py-2 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                          >
                            −
                          </motion.button>
                          <span className="px-6 py-2 text-lg font-semibold border-x-2 border-gray-600 min-w-[60px] text-center">
                            {quantity}
                          </span>
                          <motion.button
                            onClick={() => {
                              const maxStock = stockData[selectedSize] || 0;
                              setQuantity((prev) =>
                                Math.min(maxStock, prev + 1)
                              );
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            disabled={
                              quantity >= (stockData[selectedSize] || 0)
                            }
                            className="px-4 py-2 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                          >
                            +
                          </motion.button>
                        </div>
                        <p className="text-sm text-gray-400">
                          Max: {stockData[selectedSize] || 0}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Add to Cart Button */}
                  <div className="space-y-3">
                    <motion.button
                      onClick={handleCart}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={!selectedSize}
                      className={`w-full py-4 text-lg font-semibold uppercase tracking-wider transition-all duration-300 border-2 ${
                        inCart
                          ? "bg-black border-white text-white hover:bg-gray-900 hover:border-gray-300 hover:shadow-lg hover:shadow-white/20"
                          : selectedSize
                          ? "bg-white text-black border-white hover:bg-gray-200 hover:border-gray-300 hover:shadow-lg hover:shadow-white/20"
                          : "bg-gray-600 text-gray-400 border-gray-600 cursor-not-allowed"
                      }`}
                    >
                      {inCart
                        ? "Remove from Cart"
                        : selectedSize
                        ? "Add to Cart"
                        : "Select Size"}
                    </motion.button>

                    {/* Go to Cart Button - Shows after adding to cart */}
                    <AnimatePresence>
                      {showGoToCart && inCart && (
                        <motion.button
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          onClick={handleGoToCart}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full py-4 text-lg font-semibold uppercase tracking-wider bg-white border-2 border-white text-black hover:bg-gray-100 hover:border-gray-300 hover:shadow-lg hover:shadow-white/20 transition-all duration-300"
                        >
                          Go to Cart →
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Features and FAQ Section */}
          <div className="mt-16 space-y-6">
            {/* Features Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="border border-gray-700 bg-black/50 backdrop-blur-sm rounded-lg p-6 lg:p-8"
            >
              <h3 className="text-xl font-semibold mb-6">Features</h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                <div className="flex items-start gap-2 lg:gap-3">
                  <div className="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 rounded-full border border-gray-600 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 lg:w-5 lg:h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs lg:text-sm font-semibold mb-0.5 lg:mb-1">
                      Premium Quality Fabric
                    </h4>
                    <p className="text-xs lg:text-sm text-gray-400">
                      Crafted with high-grade materials for ultimate comfort and
                      durability.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 lg:gap-3">
                  <div className="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 rounded-full border border-gray-600 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 lg:w-5 lg:h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs lg:text-sm font-semibold mb-0.5 lg:mb-1">
                      Comfortable Fit
                    </h4>
                    <p className="text-xs lg:text-sm text-gray-400">
                      Designed for perfect fit and all-day comfort.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 lg:gap-3">
                  <div className="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 rounded-full border border-gray-600 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 lg:w-5 lg:h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs lg:text-sm font-semibold mb-0.5 lg:mb-1">
                      Easy Care
                    </h4>
                    <p className="text-xs lg:text-sm text-gray-400">
                      Machine washable and wrinkle-resistant fabric.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 lg:gap-3">
                  <div className="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 rounded-full border border-gray-600 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 lg:w-5 lg:h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs lg:text-sm font-semibold mb-0.5 lg:mb-1">
                      Versatile Style
                    </h4>
                    <p className="text-xs lg:text-sm text-gray-400">
                      Perfect for casual wear, layering, or dressing up.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 lg:gap-3">
                  <div className="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 rounded-full border border-gray-600 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 lg:w-5 lg:h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs lg:text-sm font-semibold mb-0.5 lg:mb-1">
                      Eco-Friendly
                    </h4>
                    <p className="text-xs lg:text-sm text-gray-400">
                      Sustainable production methods and materials.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 lg:gap-3">
                  <div className="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 rounded-full border border-gray-600 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 lg:w-5 lg:h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs lg:text-sm font-semibold mb-0.5 lg:mb-1">
                      Colorfast
                    </h4>
                    <p className="text-xs lg:text-sm text-gray-400">
                      Vibrant colors that stay true wash after wash.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* You May Also Like Section - Slider */}
            {relatedProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="w-full"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl lg:text-3xl font-bold">
                    You May Also Like
                  </h2>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() =>
                        setRelatedProductsIndex((prev) =>
                          prev > 0 ? prev - 1 : prev
                        )
                      }
                      disabled={relatedProductsIndex === 0}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`p-2 border-2 border-white transition-all ${
                        relatedProductsIndex === 0
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-white hover:text-black"
                      }`}
                      aria-label="Previous products"
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
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </motion.button>
                    <motion.button
                      onClick={() =>
                        setRelatedProductsIndex((prev) =>
                          prev < Math.ceil(relatedProducts.length / 4) - 1
                            ? prev + 1
                            : prev
                        )
                      }
                      disabled={
                        relatedProductsIndex >=
                        Math.max(0, Math.ceil(relatedProducts.length / 4) - 1)
                      }
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`p-2 border-2 border-white transition-all ${
                        relatedProductsIndex >=
                        Math.ceil(relatedProducts.length / 4) - 1
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-white hover:text-black"
                      }`}
                      aria-label="Next products"
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </motion.button>
                  </div>
                </div>
                <div
                  ref={relatedProductsRef}
                  className="relative overflow-hidden"
                >
                  <motion.div
                    className="flex gap-3 sm:gap-4 md:gap-5"
                    animate={{
                      x: `-${relatedProductsIndex * (100 / 4)}%`,
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    {relatedProducts.map((relatedProduct, index) => {
                      const relatedInWishlist = isInWishlist(relatedProduct.id);

                      const handleRelatedWishlist = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (relatedInWishlist) {
                          removeFromWishlist(relatedProduct.id);
                        } else {
                          addToWishlist(relatedProduct.id);
                        }
                      };

                      return (
                        <div
                          key={relatedProduct.id}
                          className="flex-shrink-0 w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.938rem)]"
                        >
                          <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.6 }}
                            whileHover={{
                              y: -4,
                              transition: { duration: 0.3, ease: "easeOut" },
                            }}
                            className="group relative h-full"
                          >
                            <div
                              className="border border-gray-700 bg-black/50 backdrop-blur-sm rounded-lg overflow-hidden transition-all duration-500 h-full flex flex-col cursor-pointer group-hover:border-white group-hover:bg-black/70 group-hover:shadow-lg group-hover:shadow-white/10 relative"
                              onClick={() =>
                                router.push(
                                  `/shop/${category}/${relatedProduct.id}`
                                )
                              }
                            >
                              {/* Wishlist Icon - Top left of card */}
                              <div className="absolute top-2 left-2 z-30">
                                <motion.button
                                  onClick={handleRelatedWishlist}
                                  whileHover={{ scale: 1.2 }}
                                  whileTap={{ scale: 0.9 }}
                                  className={`p-2 rounded-full backdrop-blur-md border transition-all duration-300 shadow-lg ${
                                    relatedInWishlist
                                      ? "bg-white border-white text-black"
                                      : "bg-black/70 border-gray-400 text-white hover:bg-white hover:text-black hover:border-white"
                                  }`}
                                  aria-label={
                                    relatedInWishlist
                                      ? "Remove from Wishlist"
                                      : "Add to Wishlist"
                                  }
                                >
                                  <svg
                                    className="w-4 h-4 sm:w-5 sm:h-5"
                                    fill={
                                      relatedInWishlist
                                        ? "currentColor"
                                        : "none"
                                    }
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
                                </motion.button>
                              </div>

                              {/* Image Container */}
                              <div className="relative w-full aspect-[4/5] overflow-hidden bg-gradient-to-br from-gray-900 to-black">
                                <Image
                                  src={relatedProduct.image}
                                  alt={relatedProduct.name}
                                  fill
                                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                  onError={(e) => {
                                    console.error(
                                      "Related product image failed to load:",
                                      relatedProduct.image,
                                      relatedProduct.id
                                    );
                                    const target = e.target as HTMLImageElement;
                                    target.src = "/placeholder.jpg";
                                  }}
                                  unoptimized={relatedProduct.image?.startsWith(
                                    "https://"
                                  )}
                                />

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {/* Available Sizes Overlay */}
                                <div className="absolute top-0 right-0 h-full w-8 sm:w-10 bg-black/80 backdrop-blur-sm transform translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out flex flex-col items-center justify-center gap-1 sm:gap-2 z-10">
                                  {relatedProduct.size?.map(
                                    (size, sizeIndex) => (
                                      <motion.span
                                        key={size}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: sizeIndex * 0.1 }}
                                        className="text-xs font-bold text-white border border-white/50 rounded px-1 py-0.5 min-w-[20px] text-center"
                                      >
                                        {size}
                                      </motion.span>
                                    )
                                  )}
                                </div>

                                {/* Mobile Sizes Indicator */}
                                <div className="absolute bottom-2 left-2 sm:hidden">
                                  <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                                    <span className="text-xs text-white">
                                      {relatedProduct.size?.length} sizes
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Content */}
                              <div className="p-3 flex-1 flex flex-col">
                                <div className="mb-2">
                                  <div className="flex justify-between items-start gap-2 mb-1">
                                    <h3 className="text-xs sm:text-sm font-semibold text-white line-clamp-2 leading-tight flex-1">
                                      {relatedProduct.name}
                                    </h3>
                                    <span className="text-sm font-bold text-white whitespace-nowrap">
                                      ₹{relatedProduct.price.toLocaleString()}
                                    </span>
                                  </div>

              
                                </div>

                                <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-800">
                                  <span className="text-xs text-gray-400 uppercase tracking-wider">
                                    {relatedProduct.color}
                                  </span>
                                  {relatedProduct.fit && (
                                    <span className="text-xs text-gray-400">
                                      {relatedProduct.fit} fit
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* FAQ Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="border border-gray-700 bg-black/50 backdrop-blur-sm rounded-lg p-6 lg:p-8"
            >
              <h3 className="text-xl font-semibold mb-6">
                Frequently Asked Questions
              </h3>
              <div className="space-y-4">
                {[
                  {
                    question: "What sizes are available?",
                    answer:
                      "Our T-shirts are available in sizes XS, S, M, L, XL, XXL, and XXXL. Please refer to the size chart for accurate measurements.",
                  },
                  {
                    question: "How do I care for my Mollywood T-shirt?",
                    answer:
                      "Machine wash cold with like colors. Tumble dry low or air dry. Do not bleach. Iron on low heat if needed.",
                  },
                  {
                    question: "What is the return policy?",
                    answer:
                      "We accept returns within 3 days after delivery. Items must be unworn, unused, and have all original tags attached.",
                  },
                  {
                    question: "Do you ship internationally?",
                    answer:
                      "Yes, we ship worldwide. For international orders, customers must contact the merchant for assistance and support.",
                  },

                  {
                    question: "How long does shipping take?",
                    answer:
                      "Standard shipping typically takes 5-7 business days.",
                  },
                ].map((faq, index) => (
                  <div
                    key={index}
                    className="border-b border-gray-700 last:border-b-0 pb-4 last:pb-0"
                  >
                    <button
                      onClick={() =>
                        setOpenFaqIndex(openFaqIndex === index ? null : index)
                      }
                      className="w-full flex justify-between items-center text-left"
                    >
                      <span className="font-semibold pr-4">{faq.question}</span>
                      <motion.svg
                        animate={{
                          rotate: openFaqIndex === index ? 180 : 0,
                        }}
                        transition={{ duration: 0.3 }}
                        className="flex-shrink-0 w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </motion.svg>
                    </button>
                    <AnimatePresence>
                      {openFaqIndex === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <p className="mt-3 text-gray-400 text-sm">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Flying Product Animation */}
        {flyingProduct && (
          <motion.div
            initial={{
              x: flyingProduct.x,
              y: flyingProduct.y,
              scale: 1,
              opacity: 1,
            }}
            animate={{
              x: flyingProduct.endX,
              y: flyingProduct.endY,
              scale: 0.3,
              opacity: 0,
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed z-[100] pointer-events-none"
            style={{ left: 0, top: 0 }}
          >
            <div className="w-16 h-16 border-2 border-white bg-white/20 rounded-full flex items-center justify-center">
              {flyingProduct.target === "wishlist" ? (
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              ) : (
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}
            </div>
          </motion.div>
        )}
      </div>
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
      />
      <Footer />
    </div>
  );
}
