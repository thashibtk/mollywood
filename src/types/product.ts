export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  color: "black" | "white";
  image: string;
  size?: ("S" | "M" | "L" | "XL" | "XXL")[];

  sku?: string;
}
