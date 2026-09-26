import { supabase, Product } from './supabase';

// Filter options interface
export interface ProductFilters {
  category?: string;
  status?: 'draft' | 'published' | 'archived' | 'stockout';
  minPrice?: number;
  maxPrice?: number;
  searchQuery?: string;
}

// Get unique values for filter dropdowns
export async function getFilterOptions() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('status', 'published');

    if (error) throw error;

    // Extract unique values
    const categories = [...new Set(data.map(p => p.category).filter(Boolean))];

    return {
      categories: categories.sort(),
    };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return {
      categories: [],
    };
  }
}

// Search and filter products
export async function searchProducts(filters: ProductFilters = {}) {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'published'); // Only show published products

    // Apply category filter
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    // Apply price range filter
    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }

    // Apply search query (searches in name and description)
    if (filters.searchQuery) {
      query = query.or(
        `name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return data as Product[];
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

// Get products by category
export async function getProductsByCategory(category: string) {
  return searchProducts({ category, status: 'published' });
}


