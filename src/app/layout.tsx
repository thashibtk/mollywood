import type { Metadata } from "next";
import { Roboto_Condensed } from "next/font/google";
import Navbar from "@/components/Navbar";
import StockUpdateTimer from "@/components/StockUpdateTimer";
import { CartProvider } from "@/context/CartContext";
import { UserAuthProvider } from "@/context/UserAuthContext";
import "./globals.css";

const robotoCondensed = Roboto_Condensed({
  variable: "--font-roboto-condensed",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: "Mollywood Clothing - India's First Premium T-Shirt Brand",
  description:
    "India's first premium T-shirt brand. Updates every 3 months. Categories: 1111, 2222, 3333, 4444, 5555, 6666, 7777, 8888, 9999",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${robotoCondensed.variable} antialiased`}
      >
        <UserAuthProvider>
          <CartProvider>
            <div className="relative">
              <StockUpdateTimer />
              <Navbar />
            </div>
            {children}
          </CartProvider>
        </UserAuthProvider>
      </body>
    </html>
  );
}
