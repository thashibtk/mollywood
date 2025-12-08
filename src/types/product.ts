export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  color: "black" | "white";
  image: string;
  size?: ("S" | "M" | "L" | "XL" | "XXL")[];
  material?: string;
  type?: "Round Neck" | "V Neck" | "Crew Neck" | "Polo";
  pattern?: "Solid" | "Striped" | "Printed" | "Graphic";
  fit?: "Regular" | "Slim" | "Oversized" | "Relaxed";
  sku?: string;
}
