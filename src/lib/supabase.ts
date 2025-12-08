import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Product types
export interface ProductSizes {
  XS?: number;
  S?: number;
  M?: number;
  L?: number;
  XL?: number;
  "2XL"?: number;
  "3XL"?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  images: string[] | null;
  video_url: string | null;
  inventory: number;
  sizes: ProductSizes | null;
  material: string | null;
  type: string | null;
  pattern: string | null;
  fit: string | null;
  status: 'draft' | 'published' | 'archived' | 'stockout';
  sku: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductInsert {
  name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string;
  images?: string[];
  video_url?: string;
  inventory?: number;
  sizes?: ProductSizes;
  material?: string;
  type?: string;
  pattern?: string;
  fit?: string;
  status?: 'draft' | 'published' | 'archived' | 'stockout';
  sku?: string;
}

// Coupon types
export interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  description: string | null;
  status: 'draft' | 'active' | 'scheduled' | 'expired';
  usage_count: number;
  max_usage: number | null;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface CouponInsert {
  code: string;
  discount_percent: number;
  description?: string;
  status?: 'draft' | 'active' | 'scheduled' | 'expired';
  usage_count?: number;
  max_usage?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
}

